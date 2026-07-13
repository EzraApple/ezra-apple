# UI Refinement Plan

## Status

Proposed. Written against the current working-tree state, which includes the
morphing project detail experience (`/projects/:slug` and
`/projects/:slug/:section`), the shared-element title/summary morph, section
navigation (Product / Engineering / Story), per-project detail routes with
history support, and the ShoutOut signal-art hero. This plan assumes that
direction is correct and focuses on finishing quality, not new metaphors.

## What already works well

- The catalog → detail morph is the right spine: row, hero title, and summary
  stay spatially continuous, matching the shared-element direction recorded in
  `MOTION_AND_TRANSITIONS.md`.
- Keyboard grammar is coherent end to end: ↑/↓ select, → opens, ←/Esc backs
  out, and section navigation reuses the same keys inside the detail view.
- Routes are real URLs with popstate support, so deep links and back/forward
  behave.

## Gaps, in priority order

### 1. The detail sections underuse the authored depth model — SHIPPED

Sections are now Experience / System / Origin: System renders its authored
headline plus the decisions list, Origin renders the what narrative with
proof links as exits. Remaining from the original idea: nothing.

### (original notes)

`renderSection` currently maps Product → `depth.experience` and both Story and
Engineering fall back to `depth.what` / `depth.system`. Unused entirely:
`depth.decisions[]` (authored per project), `depth.proof[]`, `system.stack`,
and the Story section renders the "what" narrative even though its nav
description promises "Why it exists and what shipped."

Plan:

- Product → `depth.experience` (as now).
- Engineering → `depth.system` plus a compact `decisions` list — title and
  one-line summary, hairline-separated. Decisions are the highest-signal
  authored content in the model ("artifacts over claims").
- Story → `depth.what` headline/body plus `proof[]` as the exits list
  (label, note, link), replacing or joining the generic links row.
- Keep the layout vocabulary already established (numbered grid, mono
  labels); this is content routing, not new design.

### 2. The homepage open panel renders no links — SHIPPED

The open panel now renders the project's primary link (its first authored
link) under the title. The full link set intentionally stays on the detail
sections so the homepage keeps feeding the deeper flow.

### 3. Catalog geometry is threshold-plus-canned — SHIPPED

Geometry is now interpolated per-frame from scroll progress in the existing
rAF handler: the two panels adjacent to the fractional position share the
expanded height, written directly on the elements outside React. Discrete
navigation (clicks, arrows, number keys) animates the scroll position itself
over ~320ms, so scroll remains the single motion source. Closing a detail
restores the scroll position of the open project instead of resetting to the
first one. Reduced motion and mobile keep the discrete accordion.

Still open from the original idea:

- A few pixels of intra-step travel on the open content itself.
- CSS scroll-driven animations (`animation-timeline: scroll()`) as a
  declarative progressive enhancement.
- Heights are still layout writes (matching the previous transition's cost);
  a transform-based composition would be the next step if profiling ever
  shows jank.

### 4. Non-ShoutOut heroes fall back to a generic list

`ProjectArtifactVisual` special-cases ShoutOut (signal art) and gives every
other project the same labeled item list. Fine as scaffolding, but the hero is
the detail view's identity moment and five of six projects share a fallback.

Plan — one restrained typographic/geometric treatment per artifact `kind`,
pure CSS/SVG, themed by the existing tokens, no illustrations:

- `flow` — the current numbered step treatment, tightened.
- `canvas` (Spatium) — hairline grid with a few accent rectangles echoing a
  floor plan.
- `log` (LeHarness) — stacked mono lines with an accent cursor row.
- `orbit` (Cosmic Hot Potato) — concentric hairline rings with accent points.
- `tree` (skills-init) — a small hairline branch diagram.

Each is ~20 lines of markup. The `kind` enum already encodes the intent; this
makes the authored data earn its keep without new content.

### 5. Detail-view internals worth a pass

- The Engineering section headline is hardcoded to "Architecture"; use
  `system.headline` (authored, currently unused).
- Escape/ArrowLeft handling lives on a raw `window` keydown while the catalog
  uses TanStack Hotkeys; unify on the hotkeys manager so `ignoreInputs` and
  conflict behavior apply consistently.
- `changeSection` pushes history for section moves; rapid ↑/↓ inside an open
  section creates a history entry per step. Consider `replaceState` for
  section-to-section moves, `pushState` only for open/close.
- On open, `window.scrollTo(0, 0)` jumps the page; the morph then plays in a
  frame whose scroll context changed. Worth testing whether locking scroll
  (the `project-open` class already exists) before the jump reads better.

### 6. Page furniture

- No favicon or OG image. Add a static dark OG card (name, one line, accent
  rule) and favicon. Update `<meta name="theme-color">` from the active
  theme so mobile browser chrome follows.
- Now that detail routes exist, the Worker should serve `index.html` for
  `/projects/*` so deep links survive a hard refresh (verify — currently only
  `/` is an asset route).

### 7. Mobile and theme QA

- Verify the detail morph on ≤760px: the catalog falls back to the accordion
  there, and the fixed `min-height: 430px` active panel leaves dead space for
  short summaries; let content define height with a smaller floor.
- Contrast-check every theme at interpolation midpoints (the color doc
  requires WCAG contrast throughout interpolation). Only LeHarness reads as a
  distinct world today; after per-row accent traces exist, re-tune the five
  cool themes so projects are identifiable at a glance.
- Collapsed-row identity from `PROJECT_RESPONSIVE_COLOR.md` is still unbuilt:
  active index marker in accent, faint per-project accent trace on collapsed
  rows, row hover tinted by that project's own `accentSoft`.

## Content notes touching UI

- Cosmic Hot Potato's repo is intended to become public; when it does, add a
  repository link to its `links[]`. Decyphr stays product-link-only.
- Spatium, LeHarness, and skills-init can add repo/npm links where missing.

## Sequencing

1. Section content routing (decisions, proof, system headline) — pure content
   wiring, no design risk.
2. Links in the homepage open panel.
3. Scroll-linked catalog geometry.
4. Per-kind hero artifacts.
5. Worker deep-link fallback, favicon/OG/theme-color.
6. Detail-view internals pass (hotkeys unification, history semantics).
7. Mobile height fix, then theme QA and accent re-tune last.
