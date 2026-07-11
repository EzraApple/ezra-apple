# Homepage and Sticky Catalog

## Status

Committed direction for the first homepage prototype.

## Homepage structure

```text
Compact introduction
  Ezra Apple / San Francisco
  One software-engineering sentence
  GitHub / LinkedIn / X

Selected Work
  01 ShoutOut
  02 Decyphr
  03 Spatium
  04 Le Harness
  05 Cosmic Hot Potato
  06 skills-init

Machine-readable endpoints
  [https://ezraapple.dev/api/projects] [copy]
  [https://ezraapple.dev/mcp]          [copy]
```

Draft introduction:

> Software engineer and former founder building AI products and developer
> tools.

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
- project title and useful external links in the left column;
- a short product description in the right column.

The title, links, and description form one vertically centered content band.
Links sit directly below the title rather than at the bottom of the expanded
panel, and the description aligns with the title's top edge.

The homepage deliberately omits stack tags, status pills, and improvised
project graphics. Those elements can return only when they add grounded,
project-specific information rather than decorative density.

The homepage should not render the complete project dossier. The detailed
semantic levels belong to the future project experience.

## Input methods

Native scrolling is primary. The page must not hijack the mouse wheel or force
scroll snapping.

Equivalent controls:

- click a collapsed project row;
- small previous/next arrow controls;
- global Arrow Up and Arrow Down shortcuts through TanStack Hotkeys;
- number keys 1 through 5, plus Home and End;
- touch scrolling on mobile.

The open project is the selected project. Row clicks release focus after
selection so browser focus styling cannot imply a second, stale selection.

A possible compact control is:

```text
up arrow    02 / 05    down arrow
```

The control should appear only while the catalog is the active page region. It
is navigation, not a carousel indicator.

## Sticky region

The catalog uses one sticky viewport in which the project stack is composed.
The document itself remains normally scrollable. Scroll distance between
projects stays short so the catalog never feels like it traps the visitor.

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
