import { defineProject } from "./schema";

export const spatium = defineProject({
  slug: "spatium",
  order: 3,
  published: true,
  name: "Spatium",
  category: "Collaborative tool",
  status: "Live",
  summary: "Plan an apartment with roommates in real time.",
  tags: [
    "React",
    "Vite",
    "Cloudflare Workers",
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

Plan an apartment with roommates in real time.

I built [Spatium](https://spatium-snowy.vercel.app/) while planning a move with a roommate across the country. We needed to arrange furniture on the same floor plan without sending screenshots back and forth.

The browser editor supports furniture placement, snapping, and live cursors. I built it with React and a PartyServer WebSocket backend on Cloudflare Workers. Durable Objects coordinate each room, and Neon Postgres stores the layouts. The [source](https://github.com/EzraApple/spatium) is public.`,
});
