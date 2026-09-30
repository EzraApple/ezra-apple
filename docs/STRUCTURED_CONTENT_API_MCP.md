# Public API and MCP

## Content contract

Each authored project has a compact catalog record and one complete Markdown
`document`. The document includes its origin, product behavior, engineering
choices, implementation, and links to public evidence. Its headings are ordinary
prose, not an API hierarchy. Read it in one request; no depth selection is needed.
The project documents preserve unique authored facts and evidence while
removing repeated captions and lists from the retired visual layout.

`content/projects/*.ts` is canonical for project documents. `content/resume.ts`
validates the structured résumé generated from the public PDF and used by the
human-readable `/resume` page. `content/writing.ts` holds validated article metadata
shared by the homepage, profile, writing API, MCP, search, and discovery guide.
Full articles stay at their original URLs. Zod validates content at build/startup.
The homepage receives only names, one-sentence summaries, and links; full project
documents never enter its static HTML. Both HTML pages ship no client JavaScript.

API schema version 2 removes `theme`, `artifact`, `order`, and `depth` from the
public project contract. Internal ordering and publication flags remain authored.
This is a deliberate pre-launch breaking change from the retired prototype.

## Compatibility policy

Keep `/api` and `/mcp` unversioned for this initial public contract. The JSON
`schemaVersion: 2` identifies the response shape after prototype changes; the
MCP server's `2.0.0` is an implementation version. Neither exposes an older contract.
MCP protocol versions are negotiated separately by the SDK.

Prefer additive changes and stable project slugs/tool names. If a future breaking
change needs to coexist with clients using the published contract, keep existing `/api/...` URLs serving the original contract, optionally alias
it under `/api/v1/...`, and introduce the new contract under `/api/v2/...` with
migration instructions. Moving old clients to a versioned URL requires an explicit
deprecation plan; adding `/v1` alone does not preserve their existing URLs. Do not increment URL versions for copy edits or new projects.

## Endpoints

| Endpoint | Response |
| --- | --- |
| `GET /api` | Endpoint index, access model, MCP discovery |
| `GET /resume` | Static, human-readable résumé with a PDF download link |
| `GET /api/profile` | Public identity, social links, and published writing |
| `GET /api/writing` | Article titles, descriptions, publications, and original URLs |
| `GET /api/resume` | Structured résumé with experience, education, projects, skills, and PDF URL/SHA-256 |
| `GET /api/projects` | Ordered compact catalog |
| `GET /api/projects/:slug` | Catalog fields plus the complete Markdown `document` |
| `GET /api/projects/:slug/document` | The same document as `text/markdown` |
| `GET /llms.txt` | Discovery guide and example questions |
| `POST /mcp` | Stateless MCP over Streamable HTTP with JSON responses |

JSON responses use `{ data, meta }`; metadata identifies schema version 2 and the
curated source. Unknown API paths/projects return JSON errors, not the homepage.
`/api/resume` is additive to version 2 and uses the same read-only cache and rate
limits as the other API routes. Writes to it return 405.

```sh
curl https://ezraapple.dev/api
curl https://ezraapple.dev/api/resume
curl https://ezraapple.dev/api/projects/shoutout/document
```

## MCP client experience

Configure a remote Streamable HTTP server URL of `https://ezraapple.dev/mcp`.
No API key or login is required for this deliberately public read-only content.

Six tools:

- `get_profile()` returns the same public profile as the API.
- `list_projects()` provides a compact catalog with slugs.
- `list_writing()` returns the same article metadata as `GET /api/writing`.
- `get_project(slug)` returns the same complete project object as the API.
- `search_work(query)` searches project documents and writing metadata by keyword.
  It preserves up to five project summaries in `results` and adds up to five articles
  in `writingResults`, each with matched terms. Article bodies are not indexed.
  It is not semantic search.
- `get_resume()` returns the same structured résumé as `GET /api/resume`,
  including a PDF link and SHA-256 hash for the human-readable file.

Successful results include declared output schemas, `structuredContent`, and a
serialized JSON text block for older clients. Tools carry read-only annotations.
Unknown slugs produce `isError: true` with the available slugs. Invalid arguments
are rejected; the old `depth` argument and `list_decisions` tool are removed.

Try these questions after connecting:

- “What tradeoffs did Ezra make building local dictation?” Search for dictation,
  then read ShoutOut's complete document and cite its evidence links.
- “Which projects demonstrate agent infrastructure work?” Search for agents or
  MCP, read the relevant documents, and distinguish authored claims from evidence.
- “What is Ezra's recent experience?” Call `get_resume` for structured roles and
  education, or open its PDF URL for the formatted résumé.

The server has no sessions or unsolicited event stream. Browser GET requests
accepting `text/html` receive a short plain-text setup guide at `/mcp`. Other GET
requests (including event streams) and DELETE return 405 with connection guidance;
protocol messages use POST. Each request
creates and closes its own server/transport.

## Discovery

The generated `/llms.txt` guide lists the résumé, public documents, endpoints, and example
questions. API responses advertise it through a `Link` header. Homepage metadata
and a hidden HTML note link to the same endpoints without adding visual clutter.
These are discovery hints, not a guarantee that every crawler will use MCP.

## Abuse controls and origins

- Cloudflare rate-limit bindings allow 300 API/guide requests and 120 MCP requests
  per IP per 60 seconds, in separate buckets. OPTIONS does not consume a bucket.
  Exceeded limits return 429, `Retry-After: 60`, and `Cache-Control: no-store`.
- Cloudflare's counters are approximate and local to a location, not a global
  quota or billing cap. Shared-IP clients share the bucket. These are generous
  abuse controls for public data, not an authentication system.
- The trusted `CF-Connecting-IP` edge header supplies the client key. Local
  requests without that header skip limiting; tests inject bindings. A missing
  production binding with an edge client IP fails closed rather than silently
  using an unreliable in-memory limiter.
- MCP bodies are capped at 32 KiB by actual streamed bytes as well as declared
  size. Slugs are restricted to 80 characters and the published slug syntax.
  Search queries are capped at 200 characters before trimming, then must contain
  at least two characters. JSON-RPC batches are not supported.
- API reads remain cross-origin public. MCP requests without Origin (normal
  native clients) are allowed. Browser origins must match the request origin or
  the comma-separated `MCP_TRUSTED_ORIGINS` Worker variable. Malformed, `null`, and
  untrusted origins are rejected before preflight processing. Add only exact
  trusted browser-client origins when needed; do not use `*`.

## Cache and operations

Successful named API and guide GET routes use Cloudflare's Cache API, a five-minute
shared TTL, and ETag conditional requests. Cache keys include the request origin,
path, and `WORKER_VERSION` deployment ID. Ignored query strings do not create new
cache variants, and a new deployment cannot reuse stale previous-deployment data.
Only successful public GETs are cached; MCP, errors, and rate-limit responses are
not. Rate limiting runs before cache lookup. Cache failures fall back to serving
content. Without version metadata, edge storage is skipped rather than risking
stale content; ETags still work. Localhost bypasses edge storage so hot reloads
never serve a previous document. `Cache-Status` reports hits, misses, or bypasses,
and the API exposes it and ETag to browser clients.

Wrangler config declares both rate-limit bindings, version metadata, and Workers
Observability. Inspect 429/5xx rates and latency after deployment; avoid logging
raw queries or IPs as application telemetry.

Before release, run `TEST_PORT=4198 npm test` and `npm run build`. Tests cover the
SDK lifecycle, output contracts, all documents, malformed inputs, origin policy,
byte limits, throttling, cache hits, deployment isolation, and ETags. Production
cache hits and distributed rate-limit behavior must also be checked against the
actual deployed Worker. Local tests do not establish either.

## Homepage affordance

Code and agents shares the Projects section style. The short `/api` and `/mcp`
labels link to the index and MCP setup guide. The résumé document icon opens
`/resume` in a new tab, where the formatted HTML and PDF download are available.
Agents can discover its structured counterpart through `/api`, `/llms.txt`, or MCP.
