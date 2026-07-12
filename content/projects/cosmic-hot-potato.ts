import { defineProject } from "./schema";

export const cosmicHotPotato = defineProject({
  schemaVersion: 1,
  slug: "cosmic-hot-potato",
  order: 4,
  published: true,
  name: "Cosmic Hot Potato",
  category: "Semantic word game",
  status: "Live",
  summary:
    "A daily Semantle-style word game where guesses are ranked by cosine similarity and plotted across an explorable 2D or 3D embedding space.",
  tags: ["Word game", "Embeddings", "3D", "UMAP"],
  links: [
    {
      kind: "product",
      label: "Play the game",
      href: "https://cosmic-hot-potato.vercel.app/",
    },
  ],
  theme: {
    background: "oklch(0.148 0.017 245)",
    surface: "oklch(0.193 0.026 248)",
    foreground: "oklch(0.95 0.018 285)",
    muted: "oklch(0.7 0.04 270)",
    border: "oklch(0.365 0.05 270)",
    accent: "oklch(0.76 0.14 300)",
    accentSoft: "oklch(0.32 0.075 285)",
  },
  artifact: {
    kind: "orbit",
    label: "Semantic vector field",
    caption: "Distance becomes a clue you can move around instead of another number in a list.",
    items: [
      { label: "50D", detail: "GloVe vectors" },
      { label: "cos θ", detail: "Guess similarity" },
      { label: "UMAP", detail: "3D neighborhood" },
      { label: "2D / 3D", detail: "Choose the map" },
    ],
  },
  depth: {
    what: {
      headline: "A semantic guessing game with spatial intuition.",
      body: "Each daily answer lives in a large word embedding space. Every guess reveals how semantically close it is and where it sits around the target.",
      highlights: ["Daily puzzle", "Cosine similarity", "2D and 3D views"],
    },
    experience: {
      headline: "Guess a word, then navigate the meaning around it.",
      body: "Ranks, temperature, and a glowing orbit map turn semantic distance into feedback the player can inspect from multiple angles.",
      highlights: ["Ranked guesses", "Interactive orbit map", "Switchable scene depth"],
    },
    decisions: [
      {
        title: "Make the embedding visible",
        summary: "The map turns an abstract similarity score into a place the player can explore.",
      },
      {
        title: "Preserve both modes",
        summary: "A 2D view stays available when depth helps less than direct comparison.",
      },
    ],
    system: {
      headline: "High-dimensional word meaning projected into a playable scene.",
      body: "Words ship as int8-quantized GloVe vectors, so any of 317,000 guesses scores inside the deployment with no embedding service, and UMAP projects each neighborhood into the playable 3D field.",
      stack: ["Next.js", "Three.js", "GloVe 50d", "UMAP", "Int8 vector store"],
      flow: ["Daily answer", "Word guess", "Vector similarity", "UMAP position", "2D or 3D render"],
    },
    proof: [
      {
        label: "Playable product",
        note: "The live daily word game and its public explanation of the map math.",
        href: "https://cosmic-hot-potato.vercel.app/",
      },
    ],
  },
});
