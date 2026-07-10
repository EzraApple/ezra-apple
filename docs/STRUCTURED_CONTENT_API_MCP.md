# Structured Content, API, and MCP

## Status

Committed product direction; schemas and transport details remain provisional.

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

## Provisional API

```text
GET /api/profile
GET /api/projects
GET /api/projects/:slug
GET /api/projects/:slug?depth=decisions
GET /api/decisions
GET /api/search?q=local-first
```

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

Structured access should be a quiet reveal near the bottom of the homepage:

```text
This site is also structured for software and agents.
JSON API / MCP
```

It is evidence of the architecture, not the homepage's primary gimmick.
