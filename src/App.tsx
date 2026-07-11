import { useQuery } from "@tanstack/react-query";
import { useHotkeys } from "@tanstack/react-hotkeys";
import { domAnimation, LazyMotion, m, useReducedMotion } from "motion/react";
import { FaGithub, FaLinkedinIn, FaXTwitter } from "react-icons/fa6";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import type { ProjectSummary } from "@/content/projects";
import {
  CircleCheckIcon,
  CopyIcon,
  type AnimatedIconHandle,
} from "./animated-icons";
import { projectsQueryOptions } from "./projects-query";

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

function formatIndex(index: number): string {
  return String(index + 1).padStart(2, "0");
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
) {
  const trackRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);

  useEffect(() => {
    let animationFrame = 0;

    const update = () => {
      animationFrame = 0;
      const track = trackRef.current;
      if (
        !track ||
        count < 2 ||
        window.matchMedia("(max-width: 760px)").matches
      ) {
        return;
      }

      const top = window.scrollY + track.getBoundingClientRect().top;
      const distance = Math.max(track.offsetHeight - window.innerHeight, 1);
      const progress = Math.min(
        Math.max((window.scrollY - top) / distance, 0),
        1,
      );
      const nextIndex = Math.round(progress * (count - 1));

      if (nextIndex !== activeRef.current) {
        activeRef.current = nextIndex;
        setActiveIndex(nextIndex);
      }
    };

    const scheduleUpdate = () => {
      if (!animationFrame) animationFrame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [count, setActiveIndex]);

  const goTo = useCallback(
    (index: number, source: "pointer" | "keyboard") => {
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

      window.scrollTo({
        top: top + distance * ratio,
        behavior:
          source === "keyboard" || prefersReducedMotion() ? "auto" : "smooth",
      });
    },
    [count, setActiveIndex],
  );

  return { trackRef, goTo };
}

function ProjectPanel({
  project,
  index,
  isActive,
  onSelect,
}: {
  project: ProjectSummary;
  index: number;
  isActive: boolean;
  onSelect: (index: number) => void;
}) {
  const shouldReduceMotion = useReducedMotion() ?? false;

  return (
    <article
      className="project-panel"
      data-active={isActive}
      data-testid={`project-${project.slug}`}
    >
      <button
        aria-expanded={isActive}
        className="project-row"
        onClick={(event) => {
          event.currentTarget.blur();
          onSelect(index);
        }}
        type="button"
      >
        <span className="project-number">{formatIndex(index)}</span>
        <span className="project-row-name">{project.name}</span>
      </button>

      {isActive ? (
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
            <h2>{project.name}</h2>
          </div>
          <p className="project-summary">{project.summary}</p>
        </m.div>
      ) : null}
    </article>
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

function StructuredAccess() {
  return (
    <section className="machine-access" aria-label="Machine-readable endpoints">
      <EndpointCopyCard endpoint={API_ENDPOINT} />
      <EndpointCopyCard endpoint={MCP_ENDPOINT} />
    </section>
  );
}

function ProjectCatalog({
  projects,
  activeIndex,
  setActiveIndex,
}: {
  projects: ProjectSummary[];
  activeIndex: number;
  setActiveIndex: (index: number) => void;
}) {
  const { trackRef, goTo } = useCatalogScroll(
    projects.length,
    setActiveIndex,
  );
  const trackHeight = `${100 + Math.max(projects.length - 1, 0) * 28}vh`;

  useHotkeys(
    [
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
    <div className="catalog-track" ref={trackRef} style={{ height: trackHeight }}>
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

          <div className="section-heading">
            <p>Selected work</p>
            <span className="keyboard-hint">↑ ↓ or 1–{projects.length}</span>
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

          <div className="project-stack">
            {projects.map((project, index) => (
              <ProjectPanel
                index={index}
                isActive={index === activeIndex}
                key={project.slug}
                onSelect={(projectIndex) => goTo(projectIndex, "pointer")}
                project={project}
              />
            ))}
          </div>

          <StructuredAccess />
        </div>
      </div>
    </div>
  );
}

export function App({
  initialProjects,
}: {
  initialProjects: ProjectSummary[];
}) {
  const { data } = useQuery(projectsQueryOptions(initialProjects));
  const projects = data ?? initialProjects;
  const [activeIndex, setActiveIndex] = useState(0);
  const activeProject = projects[activeIndex] ?? projects[0];

  if (!activeProject) return null;

  const themeStyle: ThemeStyle = {
    "--page-bg": activeProject.theme.background,
    "--page-surface": activeProject.theme.surface,
    "--page-fg": activeProject.theme.foreground,
    "--page-muted": activeProject.theme.muted,
    "--page-border": activeProject.theme.border,
    "--page-accent": activeProject.theme.accent,
    "--page-accent-soft": activeProject.theme.accentSoft,
  };

  return (
    <LazyMotion features={domAnimation} strict>
      <main className="site-shell" style={themeStyle}>
        <section className="work-section" id="work">
          <ProjectCatalog
            activeIndex={activeIndex}
            projects={projects}
            setActiveIndex={setActiveIndex}
          />
        </section>

      </main>
    </LazyMotion>
  );
}
