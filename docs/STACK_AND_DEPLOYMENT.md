# Stack and Deployment

## Status

Provisional stack aligned with the current direction.

## Application

- TypeScript
- React
- Vite
- Hono for HTTP routing and server interfaces
- pnpm for package management

The exact styling and animation libraries should be chosen after a small sticky
catalog prototype proves the interaction. CSS should handle simple transitions;
a motion library is justified only where scroll progress, interruption, or
shared-element continuity is materially easier to maintain.

## Deployment

Primary target: Cloudflare.

The intended shape is a Vite-built frontend and Hono routes deployed together
on Cloudflare Workers, with static assets and `/api` plus `/mcp` available on
the same origin.

Start with static, version-controlled content. Do not introduce a database
until the product needs runtime-authored data.

Potential later Cloudflare services:

- KV for small cached or derived public data;
- D1 if the site gains genuinely relational runtime content;
- Queues for asynchronous ingestion;
- Analytics Engine or another provider for aggregate product analytics.

These are options, not current requirements.

## Content ingestion

Authored repository content is canonical. Public GitHub metadata may be fetched
at build or scheduled-ingestion time for fields such as repository URL, latest
release, or update timestamp.

Do not make page rendering depend on live GitHub API availability.

## Suggested workspace shape

```text
apps/
  web/          Vite + React site
  worker/       Hono API and MCP routes
packages/
  content/      schemas and authored public data
  ui/           shared components if reuse emerges
docs/           product and architecture decisions
```

A single app is acceptable for the prototype. Do not create packages merely to
match this diagram.

## Initial implementation sequence

1. Create the typed project content model.
2. Build the static homepage structure.
3. Prototype the one-open sticky catalog with native scroll.
4. Add project-responsive OKLCH interpolation.
5. Add arrows, keyboard navigation, and reduced-motion behavior.
6. Expose the same content through a small JSON API.
7. Add the public MCP interface after the content contract stabilizes.
8. Design deeper project pages later.
