# Stack and Deployment

## Status

Implemented for the initial local prototype.

## Application

- TypeScript with strict checking
- React 19
- Vite 8
- TanStack Query for the client data boundary
- TanStack Hotkeys for keyboard project navigation
- Motion with `LazyMotion` and `domAnimation` for code-split, transform-and-
  opacity-based project and icon transitions
- React Icons for the small social-link icon set
- self-hosted Instrument Sans variable font files
- Zod for runtime schemas and inferred TypeScript types
- Hono for public HTTP routes
- npm for package management

This is a standard Vite SPA, not Next.js or a proprietary site framework.

## Cloudflare

The Cloudflare Vite plugin runs the frontend and Worker together during local
development. `wrangler.jsonc` defines one deployment containing:

- static Vite assets;
- SPA fallback routing;
- a Worker that runs first for `/api/*`;
- the Hono API inside that Worker.

Production deploys with `npm run deploy`. The `ezraapple.dev` custom domain can
be attached to that Worker after the local experience is approved.

## Runtime services

None beyond Cloudflare Workers and static assets.

There is currently no D1, KV, R2, queue, database, CMS, or external hosting
dependency. Project data is small, curated, and compiled into the deployment.

## Current source shape

```text
content/projects/   schemas, authored projects, public selectors
src/                Vite React application
worker/             Hono API Worker
docs/               product and architecture decisions
wrangler.jsonc      Cloudflare routing and deployment
```

## Initial implementation sequence

1. Define and validate the project content model. Complete.
2. Add ShoutOut, Decyphr, Spatium, Le Harness, Cosmic Hot Potato, and
   skills-init. Complete.
3. Expose summaries and details through Hono. Complete.
4. Seed TanStack Query synchronously with project summaries. Complete.
5. Prototype the one-open sticky catalog and project-responsive color. Complete.
6. Refine layout, scroll behavior, and copy in the local browser. Next.
7. Add MCP after the content contract and project detail flow stabilize.
