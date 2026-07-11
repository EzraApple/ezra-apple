import { useQuery } from "@tanstack/react-query";
import { useHotkeys } from "@tanstack/react-hotkeys";
import { domAnimation, LayoutGroup, LazyMotion, m, useReducedMotion } from "motion/react";
import { FaGithub, FaLinkedinIn, FaXTwitter } from "react-icons/fa6";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { getProjectDetail, type ProjectDetail, type ProjectSummary } from "@/content/projects";
import {
  CircleCheckIcon,
  CopyIcon,
  type AnimatedIconHandle,
} from "./animated-icons";
import { projectsQueryOptions } from "./projects-query";
import { MorphingProjectDetail, type MorphSection } from "./project-detail/MorphingProjectDetail";

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
const API_ENDPOINT = new URL("/api/projects", window.location.origin).href;
const MCP_ENDPOINT = new URL("/mcp", window.location.origin).href;
type DetailSection = "product" | "engineering" | "story";
const DETAIL_PATHS: MorphSection<DetailSection>[] = [
  { id: "product", label: "Product", description: "Problem, interaction, and experience" },
  { id: "engineering", label: "Engineering", description: "Architecture, systems, and decisions" },
  { id: "story", label: "Story", description: "Why it exists and what shipped" },
];

function projectSlugFromPath(): string | null {
  const slug = window.location.pathname.split("/")[2];
  return slug && getProjectDetail(slug) ? slug : null;
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
  enabled = true,
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
      for (const panel of panels()) panel.style.flex = "";
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

      stack.dataset.scrub = "true";
      items.forEach((panel, index) => {
        const share =
          index === lower ? 1 - fraction : index === lower + 1 ? fraction : 0;
        const basis = rowHeight + (expandedHeight - rowHeight) * share;
        panel.style.flex = `0 0 ${basis}px`;
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

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("wheel", cancelOnUserScroll);
      window.removeEventListener("touchstart", cancelOnUserScroll);
      cancelScrollAnimation();
      clearScrub();
    };
  }, [cancelScrollAnimation, count, enabled, setActiveIndex]);

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

  return { trackRef, goTo };
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
        <span className="project-row-name">{project.name}</span>
      </button>

      {isExpanded ? (
        <ProjectDetailView onClose={onClose} project={detail} />
      ) : isActive ? (
        <m.div
          animate={{ opacity: 1, y: 0 }}
          className="project-content"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 7 }}
          key={project.slug}
          transition={{
            delay: shouldReduceMotion ? 0 : 0.055,
            duration: shouldReduceMotion ? 0 : 0.18,
            ease: [0.165, 0.84, 0.44, 1],
          }}
        >
          <div className="project-heading">
            <m.h2 layoutId={`project-title-${project.slug}`}>{project.name}</m.h2>
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
          <m.p className="project-summary" layoutId={`project-summary-${project.slug}`}>{project.summary}</m.p>
        </m.div>
      ) : null}
    </m.article>
  );
}

function EndpointCopyCard({
  endpoint,
}: {
  endpoint: string;
}) {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const copyIconRef = useRef<AnimatedIconHandle>(null);
  const [phase, setPhase] = useState<"idle" | "copying" | "copied">("idle");
  const transitionTimer = useRef<number | undefined>(undefined);
  const resetTimer = useRef<number | undefined>(undefined);
  const isCopied = phase !== "idle";
  const showCheck = phase === "copied";

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
      aria-label={isCopied ? `Copied ${endpoint}` : `Copy ${endpoint}`}
      className="endpoint-card"
      data-copied={isCopied}
      onClick={handleCopy}
      onMouseEnter={() => {
        if (!isCopied) copyIconRef.current?.startAnimation();
      }}
      onMouseLeave={() => {
        if (!isCopied) copyIconRef.current?.stopAnimation();
      }}
      title={isCopied ? "Copied" : "Copy endpoint"}
      type="button"
    >
      <code>{endpoint}</code>
      <span className="endpoint-icon" aria-hidden="true">
        {showCheck ? (
          <CircleCheckIcon animateOnMount size={15} />
        ) : (
          <CopyIcon ref={copyIconRef} size={15} />
        )}
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
      <EndpointCopyCard endpoint={API_ENDPOINT} />
      <EndpointCopyCard endpoint={MCP_ENDPOINT} />
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
  const { trackRef, goTo } = useCatalogScroll(
    projects.length,
    setActiveIndex,
    !isDetailOpen,
  );
  const trackHeight = `${100 + Math.max(projects.length - 1, 0) * 28}vh`;

  useHotkeys(
    isDetailOpen ? [] : [
      {
        hotkey: "ArrowUp",
        callback: () => goTo(activeIndex - 1, "keyboard"),
      },
      {
        hotkey: "ArrowDown",
        callback: () => goTo(activeIndex + 1, "keyboard"),
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
                <span>Ezra Apple</span>
                <span>San Francisco</span>
              </div>
              <nav className="social-links" aria-label="Social profiles">
                <a aria-label="GitHub" href="https://github.com/EzraApple" rel="noreferrer" target="_blank">
                  <FaGithub aria-hidden="true" />
                </a>
                <a aria-label="LinkedIn" href="https://www.linkedin.com/in/ezraapple/" rel="noreferrer" target="_blank">
                  <FaLinkedinIn aria-hidden="true" />
                </a>
                <a aria-label="X / Twitter" href="https://x.com/ezra_sf" rel="noreferrer" target="_blank">
                  <FaXTwitter aria-hidden="true" />
                </a>
              </nav>
            </div>
            <p>Software engineer and former founder building AI products and developer tools.</p>
          </header>

          <div aria-hidden={isDetailOpen || undefined} className="section-heading" inert={isDetailOpen || undefined}>
            <p>Selected work</p>
            <span className="keyboard-hint">↑ ↓ select · → open · 1–{projects.length}</span>
            <div className="catalog-controls" aria-label="Project navigation">
              <button
                aria-label="Previous project"
                disabled={activeIndex === 0}
                onClick={() => goTo(activeIndex - 1, "pointer")}
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
                onClick={() => goTo(activeIndex + 1, "pointer")}
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
    return (
      <div className="signal-art" aria-hidden="true">
        {Array.from({ length: 17 }, (_, index) => <i key={index} style={{ height: `${18 + ((index * 19) % 68)}%` }} />)}
      </div>
    );
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
  const readSection = (): DetailSection | null => {
    const value = window.location.pathname.split("/")[3];
    return value === "product" || value === "engineering" || value === "story" ? value : null;
  };
  const [section, setSection] = useState<DetailSection | null>(readSection);
  const [sectionCursor, setSectionCursor] = useState(() => {
    const initialSection = readSection();
    const index = initialSection ? DETAIL_PATHS.findIndex((path) => path.id === initialSection) : 0;
    return Math.max(index, 0);
  });
  const shouldReduceMotion = useReducedMotion() ?? false;

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
  }, [onClose, section, sectionCursor]);

  useEffect(() => {
    const syncRoute = () => {
      const nextSection = readSection();
      setSection(nextSection);
      if (nextSection) {
        const index = DETAIL_PATHS.findIndex((path) => path.id === nextSection);
        if (index >= 0) setSectionCursor(index);
      }
    };
    window.addEventListener("popstate", syncRoute);
    return () => window.removeEventListener("popstate", syncRoute);
  }, []);

  const changeSection = (nextSection: DetailSection | null) => {
    setSection(nextSection);
    if (nextSection) {
      const index = DETAIL_PATHS.findIndex((path) => path.id === nextSection);
      if (index >= 0) setSectionCursor(index);
    }
    window.history.pushState({}, "", nextSection ? `/projects/${project.slug}/${nextSection}` : `/projects/${project.slug}`);
  };

  return (
    <m.section className="detail-shell" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <header className="detail-topbar">
        <button onClick={() => section ? changeSection(null) : onClose()} type="button">
          ← {section ? "Back to overview" : "Back to projects"}
        </button>
        <span>{formatIndex(project.order)} / {project.name}</span>
      </header>

      <MorphingProjectDetail
        activeSection={section}
        highlightedSection={DETAIL_PATHS[sectionCursor].id}
        hero={(
          <div className="detail-hero">
            <div>
              <p className="detail-eyebrow">{project.category}</p>
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
          const narrative = activeSection === "product" ? project.depth.experience : project.depth.what;
          return (
            <article className="detail-section">
              <h1>{activeSection === "engineering" ? "Architecture" : narrative.headline}</h1>
              <p className="detail-section-intro">
                {activeSection === "engineering" ? project.depth.system.body : narrative.body}
              </p>
              {activeSection === "engineering" ? (
                <div className="system-flow">
                  {project.depth.system.flow.map((step, index) => (
                    <div key={step}><span>{formatIndex(index)}</span><strong>{step}</strong></div>
                  ))}
                </div>
              ) : (
                <div className="narrative-grid">
                  {narrative.highlights.map((item, index) => (
                    <div key={item}><span>{formatIndex(index)}</span><strong>{item}</strong></div>
                  ))}
                </div>
              )}
              <div className="detail-exits">
                {project.links.map((link) => <a href={link.href} key={link.href} target="_blank" rel="noreferrer">{link.label} ↗</a>)}
              </div>
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

  useEffect(() => {
    const syncRoute = () => {
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
              onCloseProject={() => {
                setOpenProjectSlug(null);
                window.history.pushState({}, "", "/");
              }}
              onOpenProject={(slug) => {
                const index = projects.findIndex((project) => project.slug === slug);
                if (index >= 0) setActiveIndex(index);
                setOpenProjectSlug(slug);
                window.history.pushState({}, "", `/projects/${slug}`);
              }}
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
