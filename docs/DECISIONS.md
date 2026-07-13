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
- Project content is authored as validated TypeScript modules.
- Zod schemas are the source for runtime validation and inferred types.
- The first render receives project summaries synchronously; TanStack Query has
  no loading-state branch.
- The deployed runtime is Vite, React, Hono, and one Cloudflare Worker.
- The prototype catalog is ordered as ShoutOut, Decyphr, Spatium, LeHarness,
  Cosmic Hot Potato, and skills-init: current shipped product, founder
  experience, collaborative product, systems depth, technical play, then
  developer utility.
- The homepage has a compact identity introduction, social profile links, the
  project catalog, and two side-by-side endpoint code blocks. The endpoint
  blocks have no explanatory heading, status labels, or marketing copy.
- Endpoint copy controls transition from the copied Replo icon treatment to a
  themed checkmark for five seconds, with reduced-motion support.
- Open project cards use an editorial two-column composition: title and links
  on the left, description on the right.
- The homepage omits stack/status tags and placeholder project graphics.
- Instrument Sans is the initial interface typeface.
- Open and selected are one state; a clicked row does not retain a second
  visual focus state after navigation.
- Arrow keys, number keys, Home, and End select projects through TanStack
  Hotkeys.
- Keyboard shortcuts require a key release before firing again so a single
  press cannot repeat through the catalog.
- Duplicate hotkey registrations replace prior registrations so development
  hot reload cannot make one keypress skip multiple projects.
- The app does not use React's development-only Strict Mode double mount while
  the global TanStack Hotkeys manager is active.
- Catalog geometry is interpolated per-frame from scroll progress; the two
  panels adjacent to the fractional position share the expanded height, so
  scrolling reads as travel rather than a threshold switch.
- Discrete navigation (row clicks, arrows, number keys) animates the scroll
  position itself, keeping scroll as the single motion source for geometry.
- Closing a project detail restores the scroll position of the project that
  was open instead of resetting the catalog to the first project.
- The open panel shows the project's primary link (its first authored link)
  under the title; the full link set stays on the project detail sections so
  the homepage keeps pulling visitors into the deeper flow.
- CI (GitHub Actions) typechecks, builds, and runs an alignment suite that
  boots the built worker and asserts the site shell, JSON API, and MCP tools
  all serve exactly what the content modules author — including deep-link
  fallback, JSON 404s, agent projections omitting theme and artifact, and
  depth slicing.
- Typography is part of the theme: each project's title renders in its own
  display face (authored as titleFont/titleWeight theme tokens — Bricolage
  Grotesque, Space Grotesk, Outfit, JetBrains Mono, Unbounded, Martian
  Mono), and the catalog's scroll-linked fade carries the swap since titles
  never coexist. Geist is the base interface typeface; axis morphing was
  tried first and rejected as too subtle to distinguish the products.

## Provisional

- The draft homepage introduction.
- Five semantic depth labels: What it is, How it feels, Why, How it is built,
  and Shipped.
- Public unauthenticated API and MCP access protected by rate limits.

## Later

- Full project pages and their shared-element semantic zoom.
- Writing and cross-project decision archives.
- Live GitHub enrichment.
- Runtime storage, analytics, and ingestion infrastructure.
- Build-time GitHub metadata enrichment.
- Final copy, typography, palettes, and project ordering.

## Rejected central directions

- Browser, desktop, operating-system, or terminal metaphors.
- A generic chat-with-my-resume experience.
- A glossy, glassy, glow-heavy AI aesthetic.
- 3D spectacle as the site's main identity.
- A sidebar-based project dossier on the homepage.
- Multiple projects open simultaneously in the first catalog.
- Publishing or indirectly describing private projects.
