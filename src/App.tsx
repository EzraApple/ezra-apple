import { useQuery } from "@tanstack/react-query";
import { useHotkeys } from "@tanstack/react-hotkeys";
import { AnimatePresence, domAnimation, LayoutGroup, LazyMotion, m, useReducedMotion } from "motion/react";
import { FaGithub, FaLinkedinIn, FaXTwitter } from "react-icons/fa6";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { profile } from "@/content/profile";
import { getProjectDetail, type ProjectDetail, type ProjectSummary } from "@/content/projects";
import {
  CircleCheckIcon,
  CopyIcon,
  type AnimatedIconHandle,
} from "./animated-icons";
import { projectsQueryOptions } from "./projects-query";
import { MorphingProjectDetail, type MorphSection } from "./project-detail/MorphingProjectDetail";
import { ShoutOutHoldToTalk } from "./project-detail/ShoutOutHoldToTalk";
import { ShoutOutScene } from "./project-detail/ShoutOutScene";

type ThemeStyle = CSSProperties & {
  "--page-bg": string;
  "--page-surface": string;
  "--page-fg": string;
  "--page-muted": string;
  "--page-border": string;
  "--page-accent": string;
  "--page-accent-soft": string;
};

const PROJECT_HOTKEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;
const SOCIAL_ICONS: Record<string, ReactNode> = {
  GitHub: <FaGithub aria-hidden="true" />,
  LinkedIn: <FaLinkedinIn aria-hidden="true" />,
  X: <FaXTwitter aria-hidden="true" />,
};
const API_ENDPOINT = new URL("/api", window.location.origin).href;
const MCP_ENDPOINT = new URL("/mcp", window.location.origin).href;

function displayEndpoint(endpoint: string): string {
  return endpoint.replace(/^https?:\/\//, "");
}
type DetailSection = "experience" | "system" | "origin";
const DETAIL_PATHS: MorphSection<DetailSection>[] = [
  { id: "experience", label: "Experience", description: "How it feels and the core interaction" },
  { id: "system", label: "System", description: "How it is built, and the decisions behind it" },
  { id: "origin", label: "Origin", description: "Why it exists and what shipped" },
];

function projectSlugFromPath(): string | null {
  const slug = window.location.pathname.split("/")[2];
  return slug && getProjectDetail(slug) ? slug : null;
}

function readDetailSection(): DetailSection | null {
  const value = window.location.pathname.split("/")[3];
  return value === "experience" || value === "system" || value === "origin"
    ? value
    : null;
}

const DEFAULT_TITLE = "Ezra Apple — Software Engineer";

// One abstract micro-mark per project: a single-stroke glyph drawn from
// what the thing is, sharing one grid and stroke weight so the set reads
// as a system. Rendering concern, so it lives beside the components.
const MARK_PROPS = {
  viewBox: "0 0 16 16",
  width: 15,
  height: 15,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.3,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const PROJECT_MARKS: Record<string, ReactNode> = {
  shoutout: (
    <svg {...MARK_PROPS} aria-hidden="true">
      <path d="M4 6.5v3M8 3.5v9M12 5.5v5" />
    </svg>
  ),
  decyphr: (
    <svg {...MARK_PROPS} aria-hidden="true">
      <path d="M5.5 4.5v7l6-3.5z" />
    </svg>
  ),
  spatium: (
    <svg {...MARK_PROPS} aria-hidden="true">
      <rect height="9" rx="0.5" width="9" x="3.5" y="3.5" />
      <path d="M8.5 3.5V8h4" />
    </svg>
  ),
  leharness: (
    <svg {...MARK_PROPS} aria-hidden="true">
      <path d="M4 5l3.5 3L4 11M9.5 11.5H13" />
    </svg>
  ),
  "cosmic-hot-potato": (
    // Two vectors from one origin with the angle between them: cos(theta).
    <svg {...MARK_PROPS} aria-hidden="true">
      <path d="M3.5 12.5L8 3.5M3.5 12.5L13 10.5" />
      <path d="M7.4 11.7A4 4 0 0 0 5.3 8.9" />
      <circle cx="8" cy="3.5" fill="currentColor" r="1.1" stroke="none" />
      <circle cx="13" cy="10.5" fill="currentColor" r="1.1" stroke="none" />
    </svg>
  ),
  "skills-init": (
    // A small file tree: root entry with two nested children.
    <svg {...MARK_PROPS} aria-hidden="true">
      <path d="M4.5 3.75h4M5.75 5.75v6.5M5.75 8.5h2M9.25 8.5h3.25M5.75 12.25h2M9.25 12.25h2.25" />
    </svg>
  ),
};

const THEME_VARS = [
  ["--page-bg", "background"],
  ["--page-surface", "surface"],
  ["--page-fg", "foreground"],
  ["--page-muted", "muted"],
  ["--page-border", "border"],
  ["--page-accent", "accent"],
  ["--page-accent-soft", "accentSoft"],
] as const;

// Colors hold steady through the middle 80% of each project's scroll range
// and blend across the 20% window straddling each boundary.
const THEME_BLEND_START = 0.4;
const THEME_BLEND_END = 0.6;

function mixThemeColor(from: string, to: string, t: number): string {
  if (t <= 0 || from === to) return from;
  if (t >= 1) return to;
  return `color-mix(in oklch, ${from} ${((1 - t) * 100).toFixed(1)}%, ${to})`;
}

function formatIndex(index: number): string {
  return String(index + 1).padStart(2, "0");
}

async function copyToClipboard(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const fallback = document.createElement("textarea");
    fallback.value = value;
    fallback.style.position = "fixed";
    fallback.style.opacity = "0";
    document.documentElement.appendChild(fallback);
    fallback.select();
    const copied = document.execCommand("copy");
    fallback.remove();
    return copied;
  }
}

function useCatalogScroll(
  count: number,
  setActiveIndex: (index: number) => void,
  enabled: boolean,
  projects: ProjectSummary[],
) {
  const trackRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);
  const scrollFrame = useRef(0);
  const scrollAnimating = useRef(false);
  const wasEnabled = useRef(enabled);

  const cancelScrollAnimation = useCallback(() => {
    if (scrollFrame.current) cancelAnimationFrame(scrollFrame.current);
    scrollFrame.current = 0;
    scrollAnimating.current = false;
  }, []);

  useEffect(() => {
    let animationFrame = 0;

    const panels = (): HTMLElement[] => {
      const track = trackRef.current;
      return track
        ? Array.from(track.querySelectorAll<HTMLElement>(".project-panel"))
        : [];
    };

    const clearScrub = () => {
      const stack = trackRef.current?.querySelector<HTMLElement>(
        ".project-stack",
      );
      if (stack) delete stack.dataset.scrub;
      for (const panel of panels()) {
        panel.style.flex = "";
        const fade = panel.querySelector<HTMLElement>(".project-content-fade");
        if (fade) fade.style.opacity = "";
      }
      // Hand color control back to React with the active theme in place so
      // the 620ms variable transitions resume for discrete changes.
      const shell = trackRef.current?.closest<HTMLElement>(".site-shell");
      const theme = projects[activeRef.current]?.theme;
      if (shell && theme) {
        delete shell.dataset.themeScrub;
        for (const [variable, key] of THEME_VARS) {
          shell.style.setProperty(variable, theme[key]);
        }
      }
    };

    const update = () => {
      animationFrame = 0;
      const track = trackRef.current;
      if (!track || !enabled || count < 2) return;
      if (window.matchMedia("(max-width: 760px)").matches) {
        clearScrub();
        return;
      }

      const top = window.scrollY + track.getBoundingClientRect().top;
      const distance = Math.max(track.offsetHeight - window.innerHeight, 1);
      const progress = Math.min(
        Math.max((window.scrollY - top) / distance, 0),
        1,
      );
      const exact = progress * (count - 1);
      const nextIndex = Math.round(exact);

      if (!scrollAnimating.current && nextIndex !== activeRef.current) {
        activeRef.current = nextIndex;
        setActiveIndex(nextIndex);
      }

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        clearScrub();
        return;
      }

      const stack = track.querySelector<HTMLElement>(".project-stack");
      const items = panels();
      if (!stack || items.length !== count) return;

      const rowHeight =
        Number.parseFloat(
          getComputedStyle(stack).getPropertyValue("--row-height"),
        ) || 50;
      const expandedHeight = stack.clientHeight - (count - 1) * rowHeight;
      if (expandedHeight <= rowHeight) return;

      const lower = Math.floor(exact);
      const fraction = exact - lower;

      // Scroll-linked theme: hold each project's colors through the middle
      // of its range, then blend in OKLCH across the boundary window.
      const shell = track.closest<HTMLElement>(".site-shell");
      const fromTheme = projects[lower]?.theme;
      const toTheme = projects[lower + 1]?.theme ?? fromTheme;
      if (shell && fromTheme && toTheme) {
        const blend =
          fraction <= THEME_BLEND_START
            ? 0
            : fraction >= THEME_BLEND_END
              ? 1
              : (fraction - THEME_BLEND_START) /
                (THEME_BLEND_END - THEME_BLEND_START);
        shell.dataset.themeScrub = "true";
        for (const [variable, key] of THEME_VARS) {
          shell.style.setProperty(
            variable,
            mixThemeColor(fromTheme[key], toTheme[key], blend),
          );
        }
      }

      stack.dataset.scrub = "true";
      items.forEach((panel, index) => {
        const share =
          index === lower ? 1 - fraction : index === lower + 1 ? fraction : 0;
        const basis = rowHeight + (expandedHeight - rowHeight) * share;
        panel.style.flex = `0 0 ${basis}px`;

        // Content legibility follows scroll distance, not a clock: it fades
        // over the half-open -> mostly-open stretch of the panel, so fast
        // scrolls pass through dim instead of strobing timed fades.
        const fade = panel.querySelector<HTMLElement>(".project-content-fade");
        if (fade) {
          const legibility = Math.min(Math.max((share - 0.5) / 0.35, 0), 1);
          fade.style.opacity = String(legibility);
        }
      });
    };

    const scheduleUpdate = () => {
      if (!animationFrame) animationFrame = requestAnimationFrame(update);
    };

    const cancelOnUserScroll = () => cancelScrollAnimation();

    if (enabled && !wasEnabled.current && trackRef.current && count > 1) {
      // Returning from the detail view: restore the scroll position that
      // corresponds to the project the visitor was on before the catalog
      // handler reads the scroll and resets the selection.
      const track = trackRef.current;
      if (!window.matchMedia("(max-width: 760px)").matches) {
        const top = window.scrollY + track.getBoundingClientRect().top;
        const distance = Math.max(track.offsetHeight - window.innerHeight, 0);
        window.scrollTo(0, top + distance * (activeRef.current / (count - 1)));
      }
    }
    wasEnabled.current = enabled;

    update();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("wheel", cancelOnUserScroll, { passive: true });
    window.addEventListener("touchstart", cancelOnUserScroll, {
      passive: true,
    });

    // Content mounts one React commit after the index crossing; if the
    // scroll gesture ended on that exact frame no further scroll event will
    // write its scrubbed opacity, so re-run the scrub whenever the stack's
    // subtree changes.
    const mountObserver = new MutationObserver(scheduleUpdate);
    const stackElement =
      trackRef.current?.querySelector<HTMLElement>(".project-stack");
    if (stackElement) {
      mountObserver.observe(stackElement, { childList: true, subtree: true });
    }

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      mountObserver.disconnect();
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("wheel", cancelOnUserScroll);
      window.removeEventListener("touchstart", cancelOnUserScroll);
      cancelScrollAnimation();
      clearScrub();
    };
  }, [cancelScrollAnimation, count, enabled, projects, setActiveIndex]);

  const animateScrollTo = useCallback(
    (targetY: number) => {
      cancelScrollAnimation();

      const startY = window.scrollY;
      const delta = targetY - startY;
      if (
        Math.abs(delta) < 1 ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        window.scrollTo({ top: targetY, behavior: "auto" });
        return;
      }

      const duration = 320;
      const start = performance.now();
      scrollAnimating.current = true;

      const step = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        const eased =
          t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        window.scrollTo(0, startY + delta * eased);
        if (t < 1) {
          scrollFrame.current = requestAnimationFrame(step);
        } else {
          scrollFrame.current = 0;
          scrollAnimating.current = false;
        }
      };
      scrollFrame.current = requestAnimationFrame(step);
    },
    [cancelScrollAnimation],
  );

  const goTo = useCallback(
    (index: number, _source: "pointer" | "keyboard") => {
      if (!enabled) return;
      const track = trackRef.current;
      if (!track) return;

      const targetIndex = Math.min(Math.max(index, 0), count - 1);
      const focusedElement = document.activeElement;
      if (
        focusedElement instanceof HTMLElement &&
        focusedElement.closest(".project-row")
      ) {
        focusedElement.blur();
      }
      activeRef.current = targetIndex;
      setActiveIndex(targetIndex);

      if (window.matchMedia("(max-width: 760px)").matches) return;

      const top = window.scrollY + track.getBoundingClientRect().top;
      const distance = Math.max(track.offsetHeight - window.innerHeight, 0);
      const ratio = count > 1 ? targetIndex / (count - 1) : 0;

      animateScrollTo(top + distance * ratio);
    },
    [animateScrollTo, count, enabled, setActiveIndex],
  );

  // Stepping reads the live index ref so a burst of key presses can never
  // compound against a stale render snapshot.
  const goBy = useCallback(
    (delta: number, source: "pointer" | "keyboard") => {
      goTo(activeRef.current + delta, source);
    },
    [goTo],
  );

  return { trackRef, goTo, goBy };
}

function ProjectPanel({
  detail,
  project,
  index,
  isActive,
  onSelect,
  onOpen,
  onClose,
  isAnyDetailOpen,
  isExpanded,
}: {
  detail: ProjectDetail;
  project: ProjectSummary;
  index: number;
  isActive: boolean;
  onSelect: (index: number) => void;
  onOpen: () => void;
  onClose: () => void;
  isAnyDetailOpen: boolean;
  isExpanded: boolean;
}) {
  const shouldReduceMotion = useReducedMotion() ?? false;

  return (
    <m.article
      aria-hidden={isAnyDetailOpen && !isExpanded || undefined}
      className="project-panel"
      data-active={isActive}
      data-detail-open={isExpanded}
      data-testid={`project-${project.slug}`}
      layoutId={`project-panel-${project.slug}`}
      style={
        {
          "--title-font": project.theme.titleFont,
          "--title-wght": project.theme.titleWeight,
        } as CSSProperties
      }
      onClick={(event) => {
        // The whole open panel is a door into the detail; real controls and
        // text selections keep their own behavior.
        if (!isActive || isExpanded || isAnyDetailOpen) return;
        const target = event.target as HTMLElement;
        if (target.closest("button, a")) return;
        if (window.getSelection()?.toString()) return;
        onOpen();
      }}
    >
      <button
        aria-expanded={isActive}
        className="project-row"
        tabIndex={isAnyDetailOpen && !isExpanded ? -1 : 0}
        onClick={(event) => {
          event.currentTarget.blur();
          if (isExpanded) onClose();
          else if (isActive) onOpen();
          else onSelect(index);
        }}
        type="button"
      >
        <span className="project-number">{formatIndex(index)}</span>
        <span aria-hidden="true" className="project-mark">
          {PROJECT_MARKS[project.slug] ?? null}
        </span>
        <span className="project-row-name">{project.name}</span>
      </button>

      <AnimatePresence custom={isExpanded} initial={false} mode="popLayout">
      {isExpanded ? (
        <ProjectDetailView key="detail" onClose={onClose} project={detail} />
      ) : isActive ? (
        <m.div
          animate={{ opacity: 1, y: 0 }}
          className="project-content"
          custom={isExpanded}
          exit="exit"
          initial={false}
          key={project.slug}
          transition={{ duration: 0 }}
          variants={{
            // Fade out when handing off to the detail view; vanish instantly
            // when the active project changes so two text layers never
            // overlap during a scroll switch. The entrance fade is a CSS
            // animation on .project-content so the layoutId title morph can
            // never override it into an instant flash.
            exit: (towardDetail: boolean) =>
              towardDetail && !shouldReduceMotion
                ? {
                    opacity: 0,
                    transition: {
                      duration: 0.14,
                      ease: [0.165, 0.84, 0.44, 1],
                    },
                  }
                : { opacity: 0, transition: { duration: 0 } },
          }}
        >
          <div className="project-content-fade">
          <div className="project-heading">
            <m.h2 layoutId={`project-title-${project.slug}`}>{project.name}</m.h2>
            <div className="project-actions">
              <button className="project-open-cta" onClick={onOpen} type="button">
                Explore project
                <span aria-hidden="true">→</span>
              </button>
              {project.links[0] ? (
                <a
                  className="project-link"
                  href={project.links[0].href}
                  rel="noreferrer"
                  target="_blank"
                >
                  {project.links[0].label}
                  <span aria-hidden="true"> ↗</span>
                </a>
              ) : null}
            </div>
          </div>
          <m.p className="project-summary" layoutId={`project-summary-${project.slug}`}>{project.summary}</m.p>
          </div>
        </m.div>
      ) : null}
      </AnimatePresence>
    </m.article>
  );
}

function EndpointCopyCard({
  endpoint,
  kind,
  tipId,
  tip,
}: {
  endpoint: string;
  kind: string;
  tipId: string;
  tip: ReactNode;
}) {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const copyIconRef = useRef<AnimatedIconHandle>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const [phase, setPhase] = useState<"idle" | "copying" | "copied">("idle");
  const [tipAbove, setTipAbove] = useState(false);
  const transitionTimer = useRef<number | undefined>(undefined);
  const resetTimer = useRef<number | undefined>(undefined);
  const isCopied = phase !== "idle";
  const showCheck = phase === "copied";

  // The tip prefers to open below the card; flip above only when the
  // viewport bottom would clip it.
  const placeTip = (card: HTMLElement) => {
    const tipHeight = tipRef.current?.offsetHeight ?? 0;
    const spaceBelow = window.innerHeight - card.getBoundingClientRect().bottom;
    setTipAbove(spaceBelow < tipHeight + 12);
  };

  const handleCopy = () => {
    copyIconRef.current?.startAnimation();
    setPhase(shouldReduceMotion ? "copied" : "copying");
    void copyToClipboard(endpoint);

    if (transitionTimer.current) window.clearTimeout(transitionTimer.current);
    if (resetTimer.current) window.clearTimeout(resetTimer.current);

    if (!shouldReduceMotion) {
      transitionTimer.current = window.setTimeout(
        () => setPhase("copied"),
        125,
      );
    }
    resetTimer.current = window.setTimeout(() => {
      setPhase("idle");
      copyIconRef.current?.stopAnimation();
    }, 5000);
  };

  useEffect(
    () => () => {
      if (transitionTimer.current) window.clearTimeout(transitionTimer.current);
      if (resetTimer.current) window.clearTimeout(resetTimer.current);
    },
    [],
  );

  return (
    <button
      aria-describedby={tipId}
      aria-label={isCopied ? `Copied ${endpoint}` : `Copy the ${kind} URL ${endpoint}`}
      className="endpoint-card"
      data-copied={isCopied}
      data-tip-above={tipAbove || undefined}
      onClick={handleCopy}
      onFocus={(event) => placeTip(event.currentTarget)}
      onMouseEnter={(event) => {
        placeTip(event.currentTarget);
        if (!isCopied) copyIconRef.current?.startAnimation();
      }}
      onMouseLeave={() => {
        if (!isCopied) copyIconRef.current?.stopAnimation();
      }}
      title={isCopied ? "Copied" : "Copy endpoint"}
      type="button"
    >
      <span aria-hidden="true" className="endpoint-kind">{kind}</span>
      <code>{displayEndpoint(endpoint)}</code>
      <span className="endpoint-icon" aria-hidden="true">
        {showCheck ? (
          <CircleCheckIcon animateOnMount size={15} />
        ) : (
          <CopyIcon ref={copyIconRef} size={15} />
        )}
      </span>
      <span className="endpoint-tip" id={tipId} ref={tipRef} role="tooltip">
        {tip}
      </span>
    </button>
  );
}

function StructuredAccess({ hidden = false }: { hidden?: boolean }) {
  return (
    <section
      aria-hidden={hidden || undefined}
      className="machine-access"
      inert={hidden || undefined}
      aria-label="Machine-readable endpoints"
    >
      <EndpointCopyCard
        endpoint={API_ENDPOINT}
        kind="API"
        tip={
          <>
            <span className="endpoint-tip-line">
              <code>/api</code> · <code>/api/profile</code> · <code>/api/projects</code> · <code>/api/projects/:slug</code>
            </span>
            <span className="endpoint-tip-note">GET · JSON · no auth · self-describing index at /api</span>
          </>
        }
        tipId="api-endpoint-tip"
      />
      <EndpointCopyCard
        endpoint={MCP_ENDPOINT}
        kind="MCP"
        tip={
          <>
            <span className="endpoint-tip-line">
              <code>get_profile</code> · <code>list_projects</code> · <code>get_project</code> · <code>list_decisions</code> · <code>search_work</code>
            </span>
            <span className="endpoint-tip-note">Streamable HTTP · no auth · works with any MCP client</span>
          </>
        }
        tipId="mcp-endpoint-tip"
      />
    </section>
  );
}

function ProjectCatalog({
  projects,
  activeIndex,
  setActiveIndex,
  onOpenProject,
  onCloseProject,
  openProjectSlug,
}: {
  projects: ProjectSummary[];
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  onOpenProject: (slug: string) => void;
  onCloseProject: () => void;
  openProjectSlug: string | null;
}) {
  const isDetailOpen = openProjectSlug !== null;
  const { trackRef, goTo, goBy } = useCatalogScroll(
    projects.length,
    setActiveIndex,
    !isDetailOpen,
    projects,
  );
  const trackHeight = `${100 + Math.max(projects.length - 1, 0) * 28}vh`;
  const wasDetailOpen = useRef(isDetailOpen);

  // Closing a detail unmounts the control that held focus; hand it back to
  // the row of the project the visitor was reading.
  useEffect(() => {
    if (wasDetailOpen.current && !isDetailOpen) {
      trackRef.current
        ?.querySelector<HTMLElement>(
          '.project-panel[data-active="true"] .project-row',
        )
        ?.focus({ preventScroll: true });
    }
    wasDetailOpen.current = isDetailOpen;
  }, [isDetailOpen, trackRef]);

  useHotkeys(
    isDetailOpen ? [] : [
      {
        hotkey: "ArrowUp",
        callback: () => goBy(-1, "keyboard"),
      },
      {
        hotkey: "ArrowDown",
        callback: () => goBy(1, "keyboard"),
      },
      { hotkey: "Home", callback: () => goTo(0, "keyboard") },
      {
        hotkey: "End",
        callback: () => goTo(projects.length - 1, "keyboard"),
      },
      {
        hotkey: "ArrowRight",
        callback: () => {
          const project = projects[activeIndex];
          if (project) onOpenProject(project.slug);
        },
      },
      ...PROJECT_HOTKEYS.slice(0, projects.length).map((hotkey, index) => ({
        hotkey,
        callback: () => goTo(index, "keyboard"),
      })),
    ],
    {
      preventDefault: true,
      ignoreInputs: true,
      requireReset: true,
      conflictBehavior: "replace",
    },
  );

  return (
    <div
      className="catalog-track"
      data-detail-open={isDetailOpen}
      ref={trackRef}
      style={{ height: isDetailOpen ? "auto" : trackHeight }}
    >
      <div className="catalog-sticky">
        <div className="catalog-frame">
          <header className="intro">
            <div className="intro-meta">
              <div className="intro-label">
                <span>{profile.name}</span>
                <span>{profile.location}</span>
              </div>
              <nav className="social-links" aria-label="Social profiles">
                {profile.links.map((link) => (
                  <a
                    aria-label={link.label}
                    href={link.href}
                    key={link.href}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {SOCIAL_ICONS[link.label] ?? null}
                  </a>
                ))}
              </nav>
            </div>
            <h1 className="intro-tagline">{profile.headline}</h1>
          </header>

          <div aria-hidden={isDetailOpen || undefined} className="section-heading" inert={isDetailOpen || undefined}>
            <p>Selected work</p>
            <span className="keyboard-hint">↑ ↓ select · → open · 1–{projects.length}</span>
            <div className="catalog-controls" aria-label="Project navigation">
              <button
                aria-label="Previous project"
                disabled={activeIndex === 0}
                onClick={() => goBy(-1, "pointer")}
                type="button"
              >
                ↑
              </button>
              <span>
                {formatIndex(activeIndex)} / {formatIndex(projects.length - 1)}
              </span>
              <button
                aria-label="Next project"
                disabled={activeIndex === projects.length - 1}
                onClick={() => goBy(1, "pointer")}
                type="button"
              >
                ↓
              </button>
            </div>
          </div>

          <div className="project-stack" data-detail-open={isDetailOpen}>
            {projects.map((project, index) => {
              const detail = getProjectDetail(project.slug);
              if (!detail) return null;

              return (
                <ProjectPanel
                  detail={detail}
                  index={index}
                  isActive={index === activeIndex}
                  isAnyDetailOpen={isDetailOpen}
                  isExpanded={openProjectSlug === project.slug}
                  key={project.slug}
                  onClose={onCloseProject}
                  onSelect={(projectIndex) => goTo(projectIndex, "pointer")}
                  onOpen={() => onOpenProject(project.slug)}
                  project={project}
                />
              );
            })}
          </div>

          <StructuredAccess hidden={isDetailOpen} />
        </div>
      </div>
    </div>
  );
}

function ProjectArtifactVisual({ project }: { project: ProjectDetail }) {
  if (project.slug === "shoutout") {
    return <ShoutOutScene />;
  }

  return (
    <div className="detail-artifact" aria-hidden="true">
      <span>{project.artifact.label}</span>
      {project.artifact.items.map((item) => (
        <div key={`${item.label}-${item.detail}`}>
          <strong>{item.label}</strong>
          <small>{item.detail}</small>
        </div>
      ))}
    </div>
  );
}

function ProjectDetailView({
  onClose,
  project,
}: {
  onClose: () => void;
  project: ProjectDetail;
}) {
  const [section, setSection] = useState<DetailSection | null>(
    readDetailSection,
  );
  const [sectionCursor, setSectionCursor] = useState(() => {
    const initialSection = readDetailSection();
    const index = initialSection ? DETAIL_PATHS.findIndex((path) => path.id === initialSection) : 0;
    return Math.max(index, 0);
  });
  const shouldReduceMotion = useReducedMotion() ?? false;
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const focusTimer = useRef<number | undefined>(undefined);
  // Whether this session pushed a section entry on top of the overview entry,
  // so leaving the section can pop it instead of growing the history.
  const didPushSection = useRef(false);

  const changeSection = useCallback(
    (nextSection: DetailSection | null) => {
      setSection(nextSection);
      if (nextSection) {
        const index = DETAIL_PATHS.findIndex(
          (path) => path.id === nextSection,
        );
        if (index >= 0) setSectionCursor(index);
      }

      const currentSection = readDetailSection();
      if (nextSection === null) {
        if (didPushSection.current) {
          didPushSection.current = false;
          window.history.back();
        } else {
          window.history.replaceState({}, "", `/projects/${project.slug}`);
        }
        // Land focus on the row of the section we just left once the
        // overview rows have re-entered, so the visitor's place survives.
        if (currentSection) {
          window.clearTimeout(focusTimer.current);
          focusTimer.current = window.setTimeout(() => {
            document
              .querySelector<HTMLElement>(
                `.detail-paths button[data-section="${currentSection}"]`,
              )
              ?.focus({ preventScroll: true });
          }, 620);
        }
        return;
      }

      const target = `/projects/${project.slug}/${nextSection}`;
      if (currentSection) {
        // Section-to-section moves replace so arrowing through sections
        // does not flood the history stack.
        window.history.replaceState({}, "", target);
      } else {
        didPushSection.current = true;
        window.history.pushState({}, "", target);
      }
    },
    [project.slug],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "ArrowLeft") {
        event.preventDefault();
        if (section) changeSection(null);
        else onClose();
        return;
      }

      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        const direction = event.key === "ArrowDown" ? 1 : -1;
        const currentIndex = section
          ? DETAIL_PATHS.findIndex((path) => path.id === section)
          : sectionCursor;
        const nextIndex = Math.min(Math.max(currentIndex + direction, 0), DETAIL_PATHS.length - 1);
        setSectionCursor(nextIndex);
        if (section) changeSection(DETAIL_PATHS[nextIndex].id);
        return;
      }

      if (event.key === "ArrowRight" && !section) {
        event.preventDefault();
        changeSection(DETAIL_PATHS[sectionCursor].id);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [changeSection, onClose, section, sectionCursor]);

  useEffect(() => {
    const syncRoute = () => {
      didPushSection.current = false;
      const nextSection = readDetailSection();
      setSection(nextSection);
      if (nextSection) {
        const index = DETAIL_PATHS.findIndex((path) => path.id === nextSection);
        if (index >= 0) setSectionCursor(index);
      }
    };
    window.addEventListener("popstate", syncRoute);
    return () => window.removeEventListener("popstate", syncRoute);
  }, []);

  // Opening a project unmounts the control that held focus, so land it on
  // the back control to keep keyboard and reader position inside the detail.
  useEffect(() => {
    backButtonRef.current?.focus({ preventScroll: true });
    return () => window.clearTimeout(focusTimer.current);
  }, []);

  useEffect(() => {
    const path = section
      ? DETAIL_PATHS.find((candidate) => candidate.id === section)
      : null;
    document.title = `${project.name}${path ? ` · ${path.label}` : ""} — Ezra Apple`;
  }, [project.name, section]);

  return (
    <m.section
      animate={{ opacity: 1 }}
      className="detail-shell"
      exit={{
        opacity: 0,
        transition: { duration: shouldReduceMotion ? 0 : 0.14 },
      }}
      initial={{ opacity: 0 }}
      transition={{
        delay: shouldReduceMotion ? 0 : 0.1,
        duration: shouldReduceMotion ? 0 : 0.26,
        ease: [0.165, 0.84, 0.44, 1],
      }}
    >
      <header className="detail-topbar">
        <button
          onClick={() => section ? changeSection(null) : onClose()}
          ref={backButtonRef}
          type="button"
        >
          ← {section ? "Back to overview" : "Back to projects"}
        </button>
        <span>{formatIndex(project.order)} / {project.name}</span>
      </header>

      <MorphingProjectDetail
        activeSection={section}
        highlightedSection={DETAIL_PATHS[sectionCursor].id}
        hero={(
          <div className="detail-hero" data-project={project.slug}>
            <div>
              <p className="detail-eyebrow">
                <span aria-hidden="true" className="project-mark">
                  {PROJECT_MARKS[project.slug] ?? null}
                </span>
                {project.category}
              </p>
              <m.h1 layoutId={`project-title-${project.slug}`}>{project.name}</m.h1>
              <m.p className="detail-summary" layoutId={`project-summary-${project.slug}`}>{project.summary}</m.p>
            </div>
            <ProjectArtifactVisual project={project} />
          </div>
        )}
        onSectionChange={changeSection}
        onSectionHighlight={(nextSection) => {
          const index = DETAIL_PATHS.findIndex((path) => path.id === nextSection);
          if (index >= 0) setSectionCursor(index);
        }}
        renderSection={(activeSection) => {
          if (activeSection === "system") {
            const system = project.depth.system;
            return (
              <article className="detail-section">
                <h1>{system.headline}</h1>
                <p className="detail-section-intro">{system.body}</p>
                <div className="system-flow">
                  {system.flow.map((step, index) => (
                    <div key={step}><span>{formatIndex(index)}</span><strong>{step}</strong></div>
                  ))}
                </div>
                <div className="decision-list">
                  {project.depth.decisions.map((decision) => (
                    <div key={decision.title}>
                      <strong>{decision.title}</strong>
                      <p>{decision.summary}</p>
                    </div>
                  ))}
                </div>
                <div className="detail-exits">
                  {project.links.map((link) => <a href={link.href} key={link.href} target="_blank" rel="noreferrer">{link.label} ↗</a>)}
                </div>
              </article>
            );
          }

          const narrative = activeSection === "experience" ? project.depth.experience : project.depth.what;
          const exits =
            activeSection === "origin"
              ? project.depth.proof.map((evidence) => (
                  <a href={evidence.href} key={evidence.href} rel="noreferrer" target="_blank" title={evidence.note}>
                    {evidence.label} ↗
                  </a>
                ))
              : project.links.map((link) => (
                  <a href={link.href} key={link.href} rel="noreferrer" target="_blank">
                    {link.label} ↗
                  </a>
                ));
          return (
            <article className="detail-section">
              <h1>{narrative.headline}</h1>
              <p className="detail-section-intro">{narrative.body}</p>
              {activeSection === "experience" && project.slug === "shoutout" ? (
                <>
                  <p className="narrative-inline">
                    {narrative.highlights.map((item, index) => (
                      <span key={item}>
                        <i>{formatIndex(index)}</i>
                        {item}
                      </span>
                    ))}
                  </p>
                  <ShoutOutHoldToTalk />
                </>
              ) : (
                <div className="narrative-grid">
                  {narrative.highlights.map((item, index) => (
                    <div key={item}><span>{formatIndex(index)}</span><strong>{item}</strong></div>
                  ))}
                </div>
              )}
              <div className="detail-exits">{exits}</div>
            </article>
          );
        }}
        sections={DETAIL_PATHS}
        shouldReduceMotion={shouldReduceMotion}
      />
    </m.section>
  );
}

export function App({
  initialProjects,
}: {
  initialProjects: ProjectSummary[];
}) {
  const { data } = useQuery(projectsQueryOptions(initialProjects));
  const projects = data ?? initialProjects;
  const [openProjectSlug, setOpenProjectSlug] = useState<string | null>(projectSlugFromPath);
  const [activeIndex, setActiveIndex] = useState(() => {
    const initialSlug = projectSlugFromPath();
    const index = initialSlug ? initialProjects.findIndex((project) => project.slug === initialSlug) : 0;
    return Math.max(index, 0);
  });
  const isDetailOpen = openProjectSlug !== null;
  const activeProject = projects[activeIndex] ?? projects[0];
  // Whether this session pushed the project entry on top of the catalog
  // entry, so closing can pop it instead of growing the history.
  const didPushProject = useRef(false);

  const openProject = useCallback(
    (slug: string) => {
      const index = projects.findIndex((project) => project.slug === slug);
      if (index >= 0) setActiveIndex(index);
      setOpenProjectSlug(slug);
      didPushProject.current = true;
      window.history.pushState({}, "", `/projects/${slug}`);
    },
    [projects],
  );

  const closeProject = useCallback(() => {
    setOpenProjectSlug(null);
    if (didPushProject.current) {
      didPushProject.current = false;
      window.history.back();
    } else {
      window.history.replaceState({}, "", "/");
    }
  }, []);

  useEffect(() => {
    const syncRoute = () => {
      didPushProject.current = false;
      const slug = projectSlugFromPath();
      setOpenProjectSlug(slug);
      if (slug) {
        const index = projects.findIndex((project) => project.slug === slug);
        if (index >= 0) setActiveIndex(index);
      }
    };
    window.addEventListener("popstate", syncRoute);
    return () => window.removeEventListener("popstate", syncRoute);
  }, [projects]);

  useEffect(() => {
    document.documentElement.classList.toggle("project-open", isDetailOpen);
    document.body.classList.toggle("project-open", isDetailOpen);
    if (isDetailOpen) window.scrollTo({ top: 0, behavior: "auto" });
    return () => {
      document.documentElement.classList.remove("project-open");
      document.body.classList.remove("project-open");
    };
  }, [isDetailOpen]);

  useEffect(() => {
    if (!isDetailOpen) document.title = DEFAULT_TITLE;
  }, [isDetailOpen]);

  if (!activeProject) return null;

  const themeProject = isDetailOpen
    ? projects.find((project) => project.slug === openProjectSlug) ?? activeProject
    : activeProject;
  const themeStyle: ThemeStyle = {
    "--page-bg": themeProject.theme.background,
    "--page-surface": themeProject.theme.surface,
    "--page-fg": themeProject.theme.foreground,
    "--page-muted": themeProject.theme.muted,
    "--page-border": themeProject.theme.border,
    "--page-accent": themeProject.theme.accent,
    "--page-accent-soft": themeProject.theme.accentSoft,
  };

  return (
    <LazyMotion features={domAnimation} strict>
      <LayoutGroup>
        <main className="site-shell" style={themeStyle}>
          <section className="work-section" id="work">
            <ProjectCatalog
              activeIndex={activeIndex}
              onCloseProject={closeProject}
              onOpenProject={openProject}
              openProjectSlug={openProjectSlug}
              projects={projects}
              setActiveIndex={setActiveIndex}
            />
          </section>
        </main>
      </LayoutGroup>
    </LazyMotion>
  );
}
