# Structured Content, API, and MCP

## Status

Implemented. The profile and project schemas, the JSON routes (including
`GET /api` as a self-describing index and `GET /api/profile`), and the
remote MCP server at `/mcp` (Streamable HTTP, stateless, official TypeScript
SDK over @hono/mcp) all read the same curated content modules the site
renders. Current MCP tools: `get_profile`, `list_projects`,
`get_project(slug, depth?)`, `list_decisions(slug?)`, and
`search_work(query)` with word-boundary matching and bounded results.
Agent-facing projections omit theme and artifact. `get_related_work` remains
future work; rate limiting is deferred to edge configuration.

## One source of truth

The public site, JSON API, and MCP server should read from the same curated,
typed content. The first version should store that content in this repository.

Core objects:

```text
Profile
Project
Decision
System description
Evidence or artifact
Relationship
Project theme
```

## Project depth

Each project can provide structured material at five depths:

```text
what        What it is and who it is for
experience How it feels and the core interaction
decisions   Why it works this way and the tradeoffs
system      How it is built
proof       Where it shipped and the evidence
```

The site can reveal these progressively. The API and MCP server can return the
requested depth directly.

## Current API

```text
GET /api/profile
GET /api/projects
GET /api/projects/:slug
```

Depth filtering, decision indexes, and search come after project detail pages
prove which structured slices are useful.

`GET /api/projects` is the catalog list call. It returns only the fields needed
to identify and render each project:

```json
{
  "data": [
    {
      "slug": "shoutout",
      "name": "ShoutOut",
      "summary": "...",
      "tags": ["macOS", "Swift", "Local AI", "Product"],
      "links": [],
      "theme": {},
      "artifact": {}
    }
  ],
  "meta": { "schemaVersion": 1, "source": "curated", "count": 5 }
}
```

`GET /api/projects/shoutout` returns the full public project object, including
`what`, `experience`, `decisions`, `system`, and `proof`.

Responses should contain structured facts, concise authored summaries, and
links to supporting public evidence. They should not return rendered HTML as
the primary representation.

## Provisional MCP tools

```text
get_profile()
list_projects()
get_project(project, depth?)
list_decisions(project?)
search_work(query)
get_related_work(topic)
```

Example questions the interface should support:

- What has Ezra shipped involving local AI?
- Which projects demonstrate product judgment?
- Why was ShoutOut designed to run locally?
- What public work relates to agent infrastructure?

## Public-access model

The API and MCP server serve deliberately public data, so the initial product
does not require end-user authentication.

Safety and operational controls:

- rate limit by client and route;
- cache public reads aggressively;
- bound search result sizes;
- expose only allowlisted authored fields;
- never read arbitrary local files or private repositories;
- never proxy unrestricted GitHub queries;
- log aggregate service health without collecting unnecessary user content.

## Site affordance

The homepage exposes the API and reserved MCP URLs as two quiet, side-by-side
code blocks with icon-only copy controls. It does not add explanatory headings,
status labels, or API marketing copy around them.
