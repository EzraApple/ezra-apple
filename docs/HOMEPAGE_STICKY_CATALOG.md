# Homepage and Sticky Catalog

## Status

Committed direction for the first homepage prototype.

## Homepage structure

```text
Navigation

Short factual introduction

Selected Work
  01 ShoutOut
  02 Spatium
  03 skills-init
  04 Agent Memory

Structured access
  JSON API
  MCP

Footer
```

Draft introduction:

> Ezra Apple is a software engineer in San Francisco. I build AI products,
> developer tools, and small software worth keeping.

The copy is provisional. Its job is to orient the visitor without turning the
hero into a slogan or marketing conversion surface.

## Catalog behavior

The catalog is entirely vertical and uses the full central content column.
There is no sidebar.

At any moment:

- exactly one project is open;
- completed projects are compressed into narrow numbered rows above it;
- the open project occupies the primary reading area;
- the next project is visible below as an approaching row;
- scrolling moves the next project toward the center and collapses the current
  project upward;
- scrolling upward reverses the same spatial relationship.

The interaction should feel like moving through one document, not switching
between separate cards.

## Open project contents

The homepage version of an open project should remain concise:

- project number and name;
- one-sentence premise;
- one real product artifact, interaction, or grounded diagram;
- a small amount of status or stack metadata;
- a quiet indication that the project can be opened more deeply.

The homepage should not render the complete project dossier. The detailed
semantic levels belong to the future project experience.

## Input methods

Native scrolling is primary. The page must not hijack the mouse wheel or force
scroll snapping.

Equivalent controls:

- click a collapsed project row;
- small previous/next arrow controls;
- keyboard Arrow Up and Arrow Down when focus is within the catalog;
- touch scrolling on mobile.

A possible compact control is:

```text
up arrow    02 / 04    down arrow
```

The control should appear only while the catalog is the active page region. It
is navigation, not a carousel indicator.

## Sticky region

The catalog may use one sticky viewport in which the project stack is composed.
The document itself remains normally scrollable. Each project receives enough
scroll distance to move between collapsed, active, and upcoming states.

The active project should not be perfectly locked to the center at every pixel.
A small amount of travel makes the interaction feel connected to the user's
scroll rather than pinned behind it.

## Mobile

Mobile keeps the same one-open-at-a-time rule. The open project becomes a
single-column composition, and previous/next rows remain visible. If the sticky
interaction becomes cramped or fragile, fall back to a normal expanding
accordion rather than preserving the desktop effect at the expense of reading.

## Explicit non-goals for the first prototype

- No sidebar layout.
- No simultaneous multi-project expansion.
- No full project-page semantic zoom yet.
- No 3D scene or camera movement.
- No scroll hijacking.
- No fake operating system, browser, or terminal shell.
- No generic `Try demo` or `Get started` calls to action.
