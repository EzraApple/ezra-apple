import { defineProject } from "./schema";

export const spatium = defineProject({
  schemaVersion: 1,
  slug: "spatium",
  order: 2,
  published: true,
  name: "Spatium",
  category: "Collaborative tool",
  status: "Live",
  summary:
    "A lightweight real-time apartment layout editor built so remote roommates can plan one physical space together.",
  tags: ["React", "Vite", "PartyKit", "Realtime"],
  links: [
    {
      kind: "product",
      label: "Open Spatium",
      href: "https://spatium-snowy.vercel.app/",
    },
    {
      kind: "repository",
      label: "View source",
      href: "https://github.com/EzraApple/spatium",
    },
  ],
  theme: {
    background: "oklch(0.147 0.017 220)",
    surface: "oklch(0.192 0.025 215)",
    foreground: "oklch(0.95 0.016 190)",
    muted: "oklch(0.69 0.035 197)",
    border: "oklch(0.36 0.045 205)",
    accent: "oklch(0.76 0.13 182)",
    accentSoft: "oklch(0.32 0.065 190)",
  },
  artifact: {
    kind: "canvas",
    label: "Shared floor plan",
    caption: "A practical spatial canvas with another person present in real time.",
    items: [
      { label: "Room", detail: "12 ft × 15 ft" },
      { label: "Sofa", detail: "Drag together" },
      { label: "Table", detail: "Rotate in place" },
      { label: "Cursor", detail: "Remote roommate" },
    ],
  },
  depth: {
    what: {
      headline: "A shared canvas for a shared apartment.",
      body: "Spatium started with a real move: one roommate across the country, one floor plan, and no good way to agree on where the couch goes.",
      highlights: ["Live cursors", "Snappable furniture", "One shared layout"],
    },
    experience: {
      headline: "Move furniture instead of describing coordinates.",
      body: "Both people can manipulate the same floor plan and immediately see what the other person means.",
      highlights: ["Direct manipulation", "Realtime presence", "Nothing to install"],
    },
    decisions: [
      {
        title: "Build the narrow tool",
        summary: "The product solves apartment layout coordination rather than becoming a general design suite.",
      },
      {
        title: "Presence is part of the interface",
        summary: "Live cursors make remote collaboration understandable without adding chat or project management.",
      },
    ],
    system: {
      headline: "A small monorepo around one shared state loop.",
      body: "The React canvas and PartyKit WebSocket server share types so local interactions and remote updates speak the same language.",
      stack: ["TypeScript", "React", "Vite", "PartyKit", "Turborepo"],
      flow: ["Canvas gesture", "Shared event", "PartyKit room", "Remote render"],
    },
    proof: [
      {
        label: "Live product",
        note: "The hosted collaborative editor.",
        href: "https://spatium-snowy.vercel.app/",
      },
      {
        label: "Public source",
        note: "Architecture and implementation on GitHub.",
        href: "https://github.com/EzraApple/spatium",
      },
    ],
  },
});
