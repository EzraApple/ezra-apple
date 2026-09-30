import { defineProject } from "./schema";

export const skillsInit = defineProject({
  slug: "skills-init",
  order: 6,
  published: true,
  name: "skills-init",
  category: "Cross-harness tooling",
  status: "Open source",
  summary: "One set of skills, shared across your coding agents.",
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

One set of skills, shared across your coding agents.

I made skills-init to keep agent instructions in one place when a repo is used with several coding agents.

## The product

Run npx skills-init to install a selected profile, including a core skill pack. The CLI previews its writes with a dry run and can be run again without duplicating the installation.

## Engineering decisions

The installer writes canonical skills under .agents, then links them into the paths Codex, Claude, Cursor, and OpenCode expect. Those tool folders are views over one source, so instructions do not drift into independent copies.

Profiles hold the installation content as data rather than adding branches to the Node.js and TypeScript installer for each pack. That keeps the command small while allowing different repo defaults.

## Evidence

- [npm package](https://www.npmjs.com/package/skills-init): Installable as npx skills-init.
- [Public source](https://github.com/EzraApple/skills-init): CLI, profiles, bundled skills, and tests.`,
});
