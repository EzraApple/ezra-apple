import { useEffect, useState } from "react";

type LinkMode = "copy" | "symlink";

const MODE_KEY = "ezra-apple:skills-init-link-mode";
const MODE_EVENT = "ezra-apple:skills-init-link-mode-change";
const TOOLS = ["claude", "cursor", "codex", "opencode"] as const;
const SKILLS = ["adversarial-review", "writing-skills", "simplify"] as const;

function loadMode(): LinkMode {
  if (typeof window === "undefined") return "symlink";
  return window.localStorage.getItem(MODE_KEY) === "copy" ? "copy" : "symlink";
}

function saveMode(mode: LinkMode) {
  window.localStorage.setItem(MODE_KEY, mode);
  window.dispatchEvent(new CustomEvent(MODE_EVENT, { detail: mode }));
}

function useLinkMode() {
  const [mode, setMode] = useState<LinkMode>(loadMode);
  useEffect(() => {
    const onMode = (event: Event) =>
      setMode((event as CustomEvent<LinkMode>).detail);
    window.addEventListener(MODE_EVENT, onMode);
    return () => window.removeEventListener(MODE_EVENT, onMode);
  }, []);
  return [mode, saveMode] as const;
}

function LinkModeToggle() {
  const [mode, setMode] = useLinkMode();
  return (
    <div aria-label="Tool skill installation mode" className="skills-mode-toggle" role="group">
      {(["symlink", "copy"] as const).map((option) => (
        <button
          aria-pressed={mode === option}
          key={option}
          onClick={() => setMode(option)}
          type="button"
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function SkillTree({ installed = true }: { installed?: boolean }) {
  const [mode] = useLinkMode();
  return (
    <div className="skills-tree" data-installed={installed} data-mode={mode}>
      <div className="skills-root">
        <i>▾</i>
        <strong>.agents/skills</strong>
        <span>canonical</span>
      </div>
      {SKILLS.map((skill) => (
        <div className="skills-leaf" key={skill}>
          <i>├─</i>
          <span>{skill}/SKILL.md</span>
        </div>
      ))}
      <div className="skills-tool-links">
        {TOOLS.map((tool, index) => (
          <div key={tool}>
            <i>{index === TOOLS.length - 1 ? "└─" : "├─"}</i>
            <span>.{tool}/skills/*</span>
            <strong>{mode === "symlink" ? "↗ .agents" : "copied"}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkillsInitScene() {
  const [mode] = useLinkMode();
  return (
    <div className="skills-scene" data-mode={mode}>
      <header>
        <span>$ npx skills-init</span>
        <strong>core</strong>
      </header>
      <SkillTree />
      <footer>
        <span>3 skills</span>
        <span>4 tool views</span>
      </footer>
    </div>
  );
}

export function SkillsInitExperience() {
  const [mode] = useLinkMode();
  const [dryRun, setDryRun] = useState(true);
  const [ran, setRan] = useState(false);

  const command = `npx skills-init${dryRun ? " --dry-run" : ""}${mode === "copy" ? " --copy-links" : ""}`;

  return (
    <div className="skills-experience">
      <div className="skills-command-builder">
        <span>install profile</span>
        <h3>core</h3>
        <label>
          <input
            checked={dryRun}
            onChange={(event) => {
              setDryRun(event.target.checked);
              setRan(false);
            }}
            type="checkbox"
          />
          preview writes first
        </label>
        <LinkModeToggle />
        <code>{command}</code>
        <button onClick={() => setRan(true)} type="button">
          {dryRun ? "preview install" : "install skills"}
        </button>
      </div>
      <div className="skills-terminal-output" aria-live="polite">
        <header><span>project / terminal</span><strong>{ran ? "done" : "ready"}</strong></header>
        {ran ? (
          <>
            <p>$ {command}</p>
            <p><i>{dryRun ? "[dry-run]" : "[write]"}</i> create .agents/skills</p>
            {SKILLS.map((skill) => <p key={skill}><i>+</i> {skill}</p>)}
            <p><i>{mode === "symlink" ? "↗" : "+"}</i> expose 4 tool views</p>
            <p><strong>portable context ready.</strong></p>
          </>
        ) : (
          <p className="skills-terminal-placeholder">run the command to see every planned write.</p>
        )}
      </div>
    </div>
  );
}

export function SkillsInitSystem() {
  const [mode] = useLinkMode();
  return (
    <div className="skills-system" data-mode={mode}>
      <div className="skills-canonical">
        <span>source of truth</span>
        <strong>.agents/skills</strong>
        <small>actual project context lives once</small>
      </div>
      <div className="skills-rails" aria-hidden="true">
        {TOOLS.map((tool) => <i key={tool} />)}
      </div>
      <div className="skills-adapters">
        {TOOLS.map((tool) => (
          <div key={tool}>
            <span>{tool}</span>
            <strong>.{tool}/skills</strong>
            <small>{mode === "symlink" ? "linked view" : "portable copy"}</small>
          </div>
        ))}
      </div>
      <LinkModeToggle />
    </div>
  );
}

export function SkillsInitOrigin() {
  const [mode] = useLinkMode();
  const milestones = [
    ["jun 18", "initial skills initializer package"],
    ["jun 18", "link every tool directory by default"],
    ["jun 18", "public repository prepared"],
    ["npm", "skills-init published"],
  ];

  return (
    <div className="skills-origin" data-mode={mode}>
      <div>
        <span>why this exists</span>
        <h2>New repos should not start cold.</h2>
        <p>
          The same review, writing, and simplification instructions kept being
          pasted into prompts or copied between tools. skills-init records that
          judgment once, then lets every harness discover the same files.
        </p>
        <LinkModeToggle />
      </div>
      <ol>
        {milestones.map(([date, label]) => (
          <li key={`${date}-${label}`}>
            <span>{date}</span>
            <strong>{label}</strong>
          </li>
        ))}
      </ol>
      <SkillTree />
    </div>
  );
}
