# Decision Log

## Committed

- The site is human-first and also exposes structured public data through JSON
  and MCP.
- Only explicitly public work is eligible for publication.
- The homepage is entirely vertical and has no sidebar.
- Selected work is presented as a sticky catalog with exactly one open project
  at a time.
- Native scrolling is primary; arrows, row clicks, keyboard, and touch provide
  equivalent navigation.
- The whole site gradually adopts the active project's color system.
- Project colors interpolate through an intentional OKLCH path.
- The first prototype stops at the homepage interaction.

## Provisional

- React, Vite, TypeScript, Hono, pnpm, and Cloudflare Workers.
- The initial project order: ShoutOut, Spatium, skills-init, Agent Memory.
- The draft homepage introduction.
- Five semantic depth labels: What it is, How it feels, Why, How it is built,
  and Shipped.
- Public unauthenticated API and MCP access protected by rate limits.

## Later

- Full project pages and their shared-element semantic zoom.
- Writing and cross-project decision archives.
- Live GitHub enrichment.
- Runtime storage, analytics, and ingestion infrastructure.
- Final copy, typography, palettes, and project ordering.

## Rejected central directions

- Browser, desktop, operating-system, or terminal metaphors.
- A generic chat-with-my-resume experience.
- A glossy, glassy, glow-heavy AI aesthetic.
- 3D spectacle as the site's main identity.
- A sidebar-based project dossier on the homepage.
- Multiple projects open simultaneously in the first catalog.
- Publishing or indirectly describing private projects.
