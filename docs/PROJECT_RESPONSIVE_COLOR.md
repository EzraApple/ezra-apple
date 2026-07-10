# Project-Responsive Color

## Status

Committed direction. Final colors require visual and contrast testing.

## Idea

The site has one design system, but each active project influences its colors.
As the sticky catalog moves from one project to the next, the surrounding page
gradually transitions through a deliberately ordered color field.

The theme change is not a hard switch and should not make every project feel
like a separate microsite.

## Color roles

Each project supplies a small set of semantic tokens:

```ts
type ProjectTheme = {
  background: string;
  surface: string;
  foreground: string;
  muted: string;
  border: string;
  accent: string;
  artifactAccent?: string;
};
```

The layout, typography, and spacing remain stable. Project identity appears in:

- the active index marker;
- borders and navigation arrows;
- small metadata;
- real product artifacts;
- a low-chroma shift in the background and surface colors.

## Color interpolation

Define and interpolate theme colors in OKLCH so intermediate colors remain
perceptually even instead of becoming muddy.

The active project's geometry should lead the transition. The page color field
can trail slightly behind, creating atmosphere without making the interface
feel reactive or flashy.

Background changes should remain subtle. Accents carry most of the identity.
Collapsed projects retain only a faint trace of their color.

## Provisional palette path

The projects should be ordered or colored so adjacent themes travel through a
short, intentional path:

```text
ShoutOut     deep blue
Spatium      blue-green / teal
skills-init  moss / restrained lime
Agent Memory olive / warm amber
```

Secondary colors may come from the real products, but should not create
competing full-page palettes.

## Guardrails

- Maintain WCAG contrast throughout interpolation, not only at endpoints.
- Avoid rainbow transitions and highly saturated full-page backgrounds.
- Avoid glass, glow, reflection, and gradient-heavy "AI" styling.
- Do not make inactive text illegible to exaggerate the active project.
- Theme changes should work without color as the only indicator of state.

## Structured content

Project theme data belongs in the same typed project object used by the site,
API, and MCP server. It may be returned through the API as descriptive metadata,
but agents should not need theme data to understand the substantive project.
