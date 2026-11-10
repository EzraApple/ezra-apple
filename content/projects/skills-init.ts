import { defineProject } from "./schema";

export const skillsInit = defineProject({
  slug: "skills-init",
  order: 6,
  published: true,
  name: "skills-init",
  category: "Cross-harness tooling",
  status: "Open source",
  summary: "Share one set of skills across coding agents.",
  tags: [
    "Agent harnesses",
    "CLI",
    "Symlinks",
    "Open source"
  ],
  links: [
    {
      kind: "repository",
      label: "Read the README",
      href: "https://github.com/EzraApple/skills-init#readme"
    },
    {
      kind: "package",
      label: "View package",
      href: "https://www.npmjs.com/package/skills-init"
    }
  ],
  document: `# skills-init

Share one set of skills across coding agents.

[skills-init](https://github.com/EzraApple/skills-init#readme) installs a shared set of engineering skills for Codex, Claude, Cursor, and OpenCode. It keeps the files in .agents/skills and creates relative links where each agent expects them. Each agent reads the same files, so an update does not leave other copies out of date.

The JavaScript CLI has no runtime dependencies. It supports dry runs and repeat installs, and preserves local edits when pruning retired skills. Install it with npx skills-init from [npm](https://www.npmjs.com/package/skills-init).`,
});
