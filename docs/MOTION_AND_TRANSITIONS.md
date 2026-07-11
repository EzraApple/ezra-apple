# Motion and Transitions

## Status

Committed principles; exact values should be tuned in a real browser prototype.

## Motion model

The catalog has one spatial rule: projects move vertically through collapsed,
active, and upcoming states. Color changes support that movement but do not
replace it.

Scroll-linked movement should respond directly to scroll progress. It should
not wait for a threshold and then play a canned animation.

## State progression

```text
upcoming
  project row approaches from below

active
  project expands into the central reading area

completed
  project compresses into a narrow row above
```

The reverse scroll direction must produce the exact reverse spatial story.

## Timing and easing

- Scroll-driven transforms follow scroll position and therefore have no fixed
  duration.
- Arrow or row-click navigation scrolls the selected row into place smoothly.
- Outgoing project text is removed immediately while the panel geometry moves;
  keeping two text layers alive caused a visible overlap flash. Incoming
  content enters from `7px` below over `180ms` with a restrained ease-out,
  beginning `55ms` into the panel's `280ms` ease-in-out geometry transition.
- Hover and color feedback uses `ease`.
- Avoid bounce.
- Theme colors interpolate over roughly `620ms ease`; adjacent background
  colors remain close while accents carry most project identity.

These are starting values, not immutable constants.

## Performance constraints

- Animate `transform` and `opacity` for project geometry.
- Avoid animating layout properties such as height, width, margin, and padding
  every frame.
- Use a measured expanded layout and transform between visual states rather
  than continuously forcing React layout.
- Keep scroll progress outside React's render loop where possible.
- Apply `will-change` only to elements participating in the active transition.
- Avoid large animated blur filters, especially in Safari.

## Project expansion

Later, clicking the active project may expand it into a full project page. The
project number, title, and primary artifact should remain spatially continuous
through a shared-element transition. That later transition should reuse the
homepage geometry instead of fading to an unrelated page.

This is recorded as future direction only. The first prototype ends with the
one-open-at-a-time homepage catalog.

## Reduced motion

With `prefers-reduced-motion: reduce`:

- disable smooth project transforms and color interpolation;
- keep native scrolling;
- show the same content as a normal one-open accordion;
- change themes discretely when a project becomes active;
- do not autoplay product videos.

Reduced motion must preserve content, navigation, and active-project state.
