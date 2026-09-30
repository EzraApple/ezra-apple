# Ezra Apple

A compact personal homepage with writing, one-sentence project descriptions,
and direct links. A readable résumé page is available at `/resume`; the same
content is available through the public JSON API and MCP server.

## Local development

```bash
npm ci
npm run dev
```

Vite serves the static homepage and runs the Hono API in Cloudflare's local Workers
runtime. `npm run build` checks types and builds both; `npm test` builds and tests
the production server, including the API/MCP content contract.

The Miniflare `undici` override pins the patched 7.29.1 release for
GHSA-3wwx-pv8p-q78v. Remove it when Miniflare's own dependency includes the fix.

## How the homepage loads

React is a build-time template renderer. Vite emits the homepage and résumé as
complete HTML and CSS, with no client JavaScript, hydration, data fetch, or loading
state. Development includes Vite's reload client; production does not.

## Editing content

- `content/profile.ts`: bio, location, and social links.
- `public/resume.pdf`: the approved public résumé, available for download from
  the HTML résumé page linked by the document icon.
- `content/resume.generated.json`: structured content extracted from that PDF;
  `content/resume.ts` validates it for `/api/resume` and MCP `get_resume`.
  After rebuilding the approved resume in the private resume repository, run
  `uv run scripts/sync_resume.py /path/to/approved/resume.pdf`. This copies the
  PDF and regenerates its structured content together. Requires Poppler's
  `pdftotext`; `uv` supplies the declared Python dependency. The parser supports
  the current one-page layout and should be reviewed if sections/layout change.
  Builds reject a PDF whose hash differs from the generated content. Review
  both outputs before publishing. Private LaTeX source and research notes stay
  in the private workspace; the site reads neither at runtime.
- `content/site.ts`: canonical public origin and share description for social metadata and the share image.
- `src/Resume.tsx` and `src/resume.css`: presentation of the public résumé at
  `/resume`, rendered into `resume/index.html` during the multipage build.
- `content/projects/*.ts`: compact project metadata and one complete Markdown `document` per project. API and MCP return that same document; no nested depth model or presentation fields.
- `content/writing.ts`: add a title, description, publication, and original URL when an essay is published. The same validated entries automatically feed the homepage, profile, `/api/writing`, MCP `list_writing`, writing search, and `/llms.txt`. Full articles remain at their original URLs. The writing section stays hidden when empty.
- `src/styles.css`: the single-column dark layout and responsive styles.

The social description is authored separately from the homepage headline in
`content/site.ts`. After changing that copy,
run `npm run build`, `uv run scripts/generate_share_image.py`, then rebuild to
include the refreshed `public/og.png`. The generator uses the site's bundled font
and the built page's metadata. The favicon lives in `public/favicon.svg`.

The homepage preloads only its regular body font; Vite rewrites the preload and
CSS to the same hashed file. `public/_headers` gives `/assets/*` a one-year
immutable cache lifetime. Only content-hashed build output belongs there;
HTML and fixed-name public files retain revalidation.

After building, `npm run check:performance` checks the homepage's HTML, linked
CSS, fonts, images, and favicon against a 45 KiB initial payload budget, with
separate limits for each category. Text is measured with gzip and WOFF2 is
measured as-is. It also rejects homepage scripts. The `postbuild` hook runs this
check locally and in CI alongside
the existing rendered-page and API/MCP tests. These are payload limits, not
browser timing measurements; linked pages, PDFs, and social metadata images
are not part of the initial homepage payload.

The Code and agents section uses matching `/api` and `/mcp` links to the API index and MCP setup guidance. The résumé icon opens `/resume` in a new tab; that page links to the PDF. `/llms.txt` is available
to agents and advertised through page metadata, a hidden HTML note with real
endpoint links, and API headers. Readers that strip hidden markup may miss the
note. Existing project-detail URLs fall back to the new homepage.

## Architecture

- React and TypeScript
- Vite with build-time rendering and the Cloudflare Vite plugin
- Hono on Cloudflare Workers
- Zod schemas with inferred types

See [data flow](docs/DATA_FLOW.md) and
[structured access](docs/STRUCTURED_CONTENT_API_MCP.md). Earlier design documents
about sticky catalogs, project colors, and nested transitions describe the retired
prototype, not the current UI.

## Content boundary

Everything published by this project must be deliberately public. Private
repositories, private runtime data, private work details, and private social
projects are outside the content model and must never be inferred or exposed.

## Public developer access

`GET /api` discovers the API. `GET /api/projects/:slug` returns a complete project
as JSON; `/api/projects/:slug/document` returns its Markdown directly. Connect an
MCP client to `/mcp` for `get_profile`, `list_projects`, `get_project`,
`search_work`, `get_resume`, and `list_writing`. Writing is also available at `/api/writing` and in the profile. Search preserves project matches in `results` and adds article metadata matches in `writingResults`. The current schema marker is 2 and the MCP implementation reports 2.0.0; neither
is a URL version. Public routes stay unversioned. The old prototype `depth`
parameter and `list_decisions` tool have been removed. See the compatibility
policy in the structured-access documentation.

The Worker includes per-IP rate limits, bounded MCP input, explicit browser-origin
validation, versioned edge caching, and ETag revalidation. See
[structured access](docs/STRUCTURED_CONTENT_API_MCP.md) for configuration and limits.
These controls are part of the Worker deployment; local verification is not proof
of production rate-limit or cache behavior.
