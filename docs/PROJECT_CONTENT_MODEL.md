# Project Content Model

## Status

Implemented initial contract. The schema can grow, but site, API, and future MCP
work should continue to derive their types from this boundary.

## Source of truth

`content/projects/schema.ts` contains Zod schemas. TypeScript types are inferred
from those schemas instead of being maintained as parallel interfaces.

```mermaid
flowchart LR
    Schema["Zod schemas"] --> Types["Inferred TypeScript types"]
    Schema --> Validation["Runtime and build validation"]
    Types --> Authoring["defineProject authoring contract"]
    Authoring --> Projects["Curated project modules"]
    Projects --> Validation
```

Every authored project passes through `defineProject()`. The collection then
validates uniqueness for project slugs and ordering before any consumer can use
it.

## Project shape

```text
Project
  schemaVersion
  slug, order, published
  name, category, status, summary
  tags[]
  links[]
  theme
  artifact
  depth
    what
    experience
    decisions[]
    system
    proof[]
```

The five objects under `depth` are the semantic levels for future project
pages and agent responses. The homepage intentionally receives a smaller
`ProjectSummary` projection containing only the fields it renders.

## Public projections

```mermaid
flowchart TD
    Project["Validated Project"] --> Summary["ProjectSummary\nhomepage catalog"]
    Project --> Detail["ProjectDetail\nAPI and future project page"]
    Summary --> Catalog["Sticky catalog"]
    Summary --> ListAPI["GET /api/projects"]
    Detail --> DetailAPI["GET /api/projects/:slug"]
    Detail -. later .-> MCP["MCP project tools"]
```

Projection functions are explicit allowlists. Adding an internal authoring
field does not automatically publish it through the list API or homepage.

## Adding a project

1. Add `content/projects/<slug>.ts` using `defineProject()`.
2. Include it in the authored collection in `content/projects/index.ts`.
3. Use only deliberately public links, facts, and evidence.
4. Run `npm run typecheck`; Zod also validates the data during the build.
5. Tune its OKLCH theme against its adjacent projects.

No database or CMS is involved. Content changes are reviewed in git and become
live with the next deployment.
