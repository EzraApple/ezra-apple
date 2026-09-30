import { defineProject } from "./schema";

export const spatium = defineProject({
  slug: "spatium",
  order: 3,
  published: true,
  name: "Spatium",
  category: "Collaborative tool",
  status: "Live",
  summary: "Plan your apartment with roommates in real time.",
  tags: [
    "React",
    "Vite",
    "PartyKit",
    "Realtime"
  ],
  links: [
    {
      kind: "product",
      label: "Open Spatium",
      href: "https://spatium-snowy.vercel.app/"
    },
    {
      kind: "repository",
      label: "View source",
      href: "https://github.com/EzraApple/spatium"
    }
  ],
  document: `# Spatium

Plan your apartment with roommates in real time.

Spatium started with a real move: one roommate across the country, one floor plan, and no easy way to agree on where the couch should go.

## The product

Roommates work in the same browser-based floor plan, moving and snapping furniture into place while seeing each other's cursors and changes. Direct manipulation replaces back-and-forth descriptions of coordinates.

## Engineering decisions

I kept the tool focused on apartment planning instead of expanding it into a general design suite. Live cursors supply the presence remote collaborators need without adding chat or project management.

The React and Vite canvas shares TypeScript types with a PartyKit WebSocket server, so a local furniture move can update the shared room and render for the other person. Turborepo keeps the client and server in one monorepo.

## Evidence

- [Live product](https://spatium-snowy.vercel.app/): The hosted collaborative editor.
- [Public source](https://github.com/EzraApple/spatium): Architecture and implementation on GitHub.`,
});
