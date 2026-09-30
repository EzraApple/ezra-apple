# Data flow

Authored TypeScript modules are canonical. Zod validates project content before
it reaches the homepage, API, or MCP server.

## Homepage

`getHomepageContent()` selects the profile, writing entries, and compact project
fields. Vite's `prerender-homepage` plugin renders `App` into the
initial HTML with React as a build-time template renderer. There is no hydration
seed or client JavaScript in the production homepage. `content/site.ts` supplies
the canonical origin; local development uses the dev server origin for labels.

The complete page works without JavaScript. Content updates arrive with each
deployment; there is no client query cache or runtime content fetch. The homepage
uses lowercase display labels while API/MCP preserve the formal project names.
Decyphr remains in the full catalog and is linked from the bio instead of the
project list.

The client never imports the full project documents. Each project module contains
compact metadata and one complete Markdown document. Narratives, decisions,
implementation notes, and evidence stay on the Worker side. The old theme, artifact,
and nested depth structures have been removed.

## Structured access

Cloudflare sends `/api`, `/api/*`, `/mcp`, and `/llms.txt` to the Worker. Other paths
serve the static site. Hono and MCP read the same validated public content. Project JSON contains the
same complete document returned by MCP; a sibling `/document` route serves the
Markdown directly. There is no progressive section traversal. The
hidden `/llms.txt` guide links to those endpoints; page metadata and API response
headers advertise it.

No database, CMS, external runtime content service, or request-time GitHub lookup
is involved. Content updates ship with the site.
