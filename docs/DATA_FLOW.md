# Data Flow

## Current flow

Authored TypeScript modules are canonical. They are validated and projected
into public shapes before reaching any interface.

```mermaid
flowchart LR
    Files["Typed project modules"] --> Zod["Zod validation"]
    Zod --> Selectors["Public selectors and DTOs"]
    Selectors --> Initial["Synchronous initial data"]
    Initial --> Query["TanStack Query cache"]
    Query --> UI["React catalog"]
    Selectors --> Hono["Hono API"]
    Hono --> JSON["Public JSON"]
    JSON -. optional revalidation .-> Query
    Selectors -. later .-> MCP["Remote MCP tools"]
```

## Why there is no loading state

The six project summaries are small and change only when the site deploys.
They are imported into the client bundle and passed to TanStack Query as
`initialData`.

```mermaid
sequenceDiagram
    participant Browser
    participant Assets as Cloudflare Assets
    participant React
    participant Query as TanStack Query

    Browser->>Assets: GET /
    Assets-->>Browser: HTML, JS, CSS, bundled project summaries
    Browser->>React: Start app
    React->>Query: Seed projects query synchronously
    Query-->>React: Six validated summaries
    React-->>Browser: Interactive catalog
```

There is no project-data request on the critical rendering path and therefore
no empty skeleton or loading state. TanStack Query still defines the client
data boundary, maintains a stable cache across interactions, and can revalidate
from `/api/projects` if runtime freshness becomes useful later.

## Cloudflare request routing

```mermaid
flowchart TD
    Request["Request to ezraapple.dev"] --> Route{"Path starts /api/?"}
    Route -- no --> Assets["Cloudflare static assets"]
    Assets --> SPA["Vite React application"]
    Route -- yes --> Worker["Cloudflare Worker"]
    Worker --> Hono["Hono router"]
    Hono --> Content["Validated in-bundle content"]
    Content --> Response["Cached JSON response"]
```

The Cloudflare Vite plugin runs the same split locally in `workerd`. Wrangler
builds and deploys the client assets and Worker together. No Vercel, database,
CMS, KV, or other hosted service is required.

## Later GitHub enrichment

GitHub can add objective public metadata, but it should remain outside the live
request path.

```mermaid
flowchart LR
    GitHub["Public GitHub API"] --> Ingest["Build or scheduled ingestion"]
    Ingest --> Snapshot["Generated public snapshot"]
    Authored["Authored narrative"] --> Merge["Explicit merge rules"]
    Snapshot --> Merge
    Merge --> Validate["Zod validation"]
    Validate --> Bundle["Deployed content bundle"]
```

The authored narrative always wins. A failed GitHub request must never prevent
the page or API from serving the last curated deployment.
