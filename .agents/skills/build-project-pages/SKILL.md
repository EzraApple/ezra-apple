---
name: build-project-pages
description: Design, implement, or refine bespoke project-detail pages in the Ezra Apple portfolio. Use for the hero, Experience, System, or Origin treatment of ShoutOut, Spatium, LeHarness, Cosmic Hot Potato, Decyphr, skills-init, or a newly added project; for deciding what makes a project page feel authentic rather than generic; or for continuing the one-project-at-a-time customization pass.
---

# Build Project Pages

Build each page as a small, faithful encounter with the real product. Preserve
the portfolio's navigation framework while letting the visitor move progressively
deeper into the product's own behavior and visual language.

## Establish the real baseline

Before proposing or editing:

1. Verify the active checkout, branch, worktree, remote divergence, and running
   dev server cwd. Never critique a stale worktree or preview.
2. Read the project's content file and the existing detail-page framework.
3. Inspect the real source repository, README, current UI code, assets, design
   tokens, protocol/event names, and commit history. Use a shallow clone or the
   GitHub CLI when the source is not local.
4. Inspect the live product or marketing site when available, but treat source
   code as the authority for behavior and product vocabulary.
5. Reuse authentic assets in their correct context. Do not rotate, recolor, or
   repurpose an asset when a proper pose or variant exists.
6. Separate verified facts from proposed presentation. Never invent milestones,
   dates, system behavior, product capabilities, or private details.

Research until these are concrete:

- the product's core gesture;
- its strongest technical or product decision;
- its native visual vocabulary;
- its origin story and public receipts;
- one identity or state choice that can follow the visitor through the page.

## Use the four-layer descent

Treat the page as progressive immersion, not four unrelated sections.

### Hero: show the product's world

Create an autoplaying, legible pseudo-demo that communicates the product in one
loop. Keep it mostly inside the portfolio's visual system, but use the product's
real objects, states, timing, and vocabulary.

The loop must show a complete product beat, not decorative ambient motion:
ShoutOut's crab dictates, Spatium's cursor moves furniture and snaps it to the
grid, and LeHarness should execute a recognizable TUI turn.

### Experience: let the visitor perform the gesture

Turn the product's defining interaction into a real, bounded demo:

- hold to talk;
- drag and snap;
- submit a prompt or use a slash command;
- guess and receive a semantic similarity signal.

Make the input affect visible state. Verify it with genuine pointer, keyboard, or
touch input. A fake control that only plays a canned animation does not count.

### System: make one truth visible

Choose the single architecture or product decision that best explains why the
project is interesting. Express it as behavior or geometry, not a generic stack
diagram.

Examples:

- a local boundary containing the whole pipeline, with the risky rewrite bypass;
- two clients and a PartyKit room exchanging the real protocol messages;
- an append-only event log rebuilding a transcript on replay.

Stay at product altitude. Cut internal nodes, variants, and annotations that do
not strengthen the main claim. One flourish may animate the key decision; every
other flourish must earn its place.

### Origin: pair personality with proof

Lead with the actual reason the project exists, then support it with public
receipts from git history, releases, packages, or deployed artifacts.

Prefer:

- a sharp first-person cause over a generic project summary;
- real commit language and dates over polished invented milestones;
- an identity choice grounded in the product, such as crab coat, cursor color,
  or terminal accent;
- a final state that feels fully inside the product's own UI.

Persist the identity choice and reflect it across the hero, Experience, System,
and Origin where it is semantically natural. This cross-layer thread is part of
the page structure, not optional decoration.

## Apply a visual gradient

Increase product-native styling with depth:

1. Hero: product content in the portfolio's world.
2. Experience: a window into the product.
3. System: product components on portfolio ground.
4. Origin: fully inside the product.

Derive project-specific colors from the active `--page-*` tokens with
`color-mix` or equivalent theme variables. Do not hard-code a second palette
that breaks scroll-linked theming. Native typography, borders, shadows, grids,
glyphs, and component shapes may change by project.

Do not force every project into ShoutOut's or Spatium's exact markup. Reuse the
descent grammar and interaction standards, not their surface treatment.

## Protect the shared framework

Preserve:

- catalog-to-detail morphing and real deep-link routes;
- arrow-key grammar, focus restoration, and history semantics;
- reduced-motion behavior;
- mobile/narrow-width fallbacks;
- the typed content boundary shared by page, API, and MCP;
- one-open-at-a-time catalog behavior and active project theming.

Keep generic fallback sections working for projects not yet customized. Prefer
project-gated components over changes that make the shared renderer brittle.

Avoid generic portfolio filler: floating glass cards, shiny gradients, arbitrary
3D, decorative dashboards, repeated boxed lists, or claims with no product
artifact behind them.

## Decide before building

When the user asks for ideas, return a compact concept sheet containing:

- native visual vocabulary discovered in source;
- Hero loop;
- Experience gesture;
- System truth;
- Origin story and receipts;
- persistent identity thread;
- the hardest or highest-risk interaction.

When the user asks to build or continue, use that same model internally and
implement without pausing for approval unless a genuinely product-defining
choice is missing.

Complete one project's full arc before starting the next unless the user asks
for a narrower section. This validates the treatment as a coherent page rather
than accumulating disconnected hero experiments.

## Verify and hand off

1. Exercise each custom interaction with real input and inspect the resulting
   state, including persistence after navigation or reload.
2. Check desktop, narrow desktop, mobile, and reduced motion.
3. Run the repository's current tests, typecheck, build, and alignment suite
   with the Node version declared by the repo.
4. Confirm no stale build or wrong-worktree dev server was used as evidence.
5. Check the final diff for unrelated changes and private information.
6. Follow current git instructions. Keep coherent passes recorded as small
   checkpoint commits when agents are sharing work across worktrees.

Report the product story the implementation now tells, the authentic sources it
used, the interactions actually verified, and the next incomplete layer.
