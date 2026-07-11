# Ezra Apple

Personal site for Ezra Apple: a public catalog of shipped products, technical
work, and the decisions behind them.

The site is intended to work for three audiences from one structured source of
truth:

- people browsing the site;
- developers querying its public API;
- agents connecting through MCP.

The first working prototype includes a typed project content system, a public
JSON API, and the homepage's one-open-at-a-time sticky project catalog.

## Local development

```bash
npm install
npm run dev
```

Vite serves the React app and runs the Hono API in Cloudflare's local Workers
runtime. The production build is verified with `npm run build`.

## Planning documents

- [Central architecture](docs/CENTRAL_ARCHITECTURE.md)
- [Project content model](docs/PROJECT_CONTENT_MODEL.md)
- [Data flow](docs/DATA_FLOW.md)
- [Homepage and sticky catalog](docs/HOMEPAGE_STICKY_CATALOG.md)
- [Motion and transitions](docs/MOTION_AND_TRANSITIONS.md)
- [Project-responsive color](docs/PROJECT_RESPONSIVE_COLOR.md)
- [Structured content, API, and MCP](docs/STRUCTURED_CONTENT_API_MCP.md)
- [Stack and deployment](docs/STACK_AND_DEPLOYMENT.md)
- [Decision log](docs/DECISIONS.md)

## Current stack

- React and TypeScript
- Vite with the Cloudflare Vite plugin
- Hono on Cloudflare Workers
- Zod schemas with inferred TypeScript types
- TanStack Query with synchronously seeded project data

## Content boundary

Everything published by this project must be deliberately public. Private
repositories, private runtime data, private work details, and private social
projects are outside the content model and must never be inferred or exposed.
