import { defineProject } from "./schema";

export const skillsInit = defineProject({
  schemaVersion: 1,
  slug: "skills-init",
  order: 5,
  published: true,
  name: "skills-init",
  category: "Cross-harness tooling",
  status: "Open source",
  summary:
    "A CLI that installs one canonical set of agent skills into a repo and links it into the directories Codex, Claude, Cursor, and OpenCode read.",
  tags: ["Agent harnesses", "CLI", "Symlinks", "Open source"],
  links: [
    {
      kind: "package",
      label: "View package",
      href: "https://www.npmjs.com/package/skills-init",
    },
    {
      kind: "repository",
      label: "View source",
      href: "https://github.com/EzraApple/skills-init",
    },
  ],
  theme: {
    background: "oklch(0.15 0.016 175)",
    surface: "oklch(0.195 0.024 165)",
    foreground: "oklch(0.95 0.02 115)",
    muted: "oklch(0.7 0.04 123)",
    border: "oklch(0.365 0.045 145)",
    accent: "oklch(0.78 0.15 119)",
    accentSoft: "oklch(0.33 0.07 126)",
    titleWeight: 445,
    titleWidth: 88,
  },
  artifact: {
    kind: "tree",
    label: "One source, every agent",
    caption: "Project context lives once; tool-specific folders become views over it.",
    items: [
      { label: ".agents", detail: "Canonical skills" },
      { label: ".claude", detail: "Linked view" },
      { label: ".cursor", detail: "Linked view" },
      { label: ".codex", detail: "Linked view" },
      { label: ".opencode", detail: "Linked view" },
    ],
  },
  depth: {
    what: {
      headline: "Sensible repo defaults for cross-harness agent development.",
      body: "skills-init installs a baseline under .agents, then symlinks that canonical source into the skill paths expected by Codex, Claude, Cursor, OpenCode, and other harnesses.",
      highlights: ["One .agents source", "Symlinked tool views", "Ships a core skill pack"],
    },
    experience: {
      headline: "One command, then the context travels with the repo.",
      body: "The installer is intentionally boring: preview the writes, install the selected profile, and let each tool discover familiar paths.",
      highlights: ["npx skills-init", "Dry-run support", "Idempotent writes"],
    },
    decisions: [
      {
        title: "Canonical files, generated views",
        summary: "Tool folders link back to .agents instead of becoming independent copies.",
      },
      {
        title: "Profiles over installer branches",
        summary: "The content of an installation is data-driven so new packs do not complicate the core command.",
      },
    ],
    system: {
      headline: "A small filesystem adapter between one repo and many harnesses.",
      body: "Profiles select sensible default skills, the installer writes them once, and link adapters expose the same files through each harness's expected directory structure.",
      stack: ["Node.js", "TypeScript", "npm", "Filesystem links"],
      flow: ["Select profile", "Plan writes", "Create .agents", "Link tool views", "Validate"],
    },
    proof: [
      {
        label: "npm package",
        note: "Installable as npx skills-init.",
        href: "https://www.npmjs.com/package/skills-init",
      },
      {
        label: "Public source",
        note: "CLI, profiles, bundled skills, and tests.",
        href: "https://github.com/EzraApple/skills-init",
      },
    ],
  },
});
