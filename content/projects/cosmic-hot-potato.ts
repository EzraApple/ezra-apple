import { defineProject } from "./schema";

export const cosmicHotPotato = defineProject({
  slug: "cosmic-hot-potato",
  order: 5,
  published: true,
  name: "Cosmic Hot Potato",
  category: "Semantic word game",
  status: "Live",
  summary: "A 3D word game based on semantic similarity.",
  tags: [
    "Word game",
    "Embeddings",
    "3D",
    "UMAP"
  ],
  links: [
    {
      kind: "product",
      label: "Play the game",
      href: "https://cosmic-hot-potato.vercel.app/"
    }
  ],
  document: `# Cosmic Hot Potato

A 3D word game based on semantic similarity.

I built [Cosmic Hot Potato](https://cosmic-hot-potato.vercel.app/) as a visual take on [Semantle](https://semantle.com/). Guess a daily word and see how close each guess is in meaning, with an interactive map alongside the ranked list.

The game scores guesses using cosine similarity between 50-dimensional GloVe vectors, with a vocabulary of over 317,000 words. UMAP projects nearby words into 3D, and similarity rank sets their distance from the answer. You can switch to a 2D view to compare guesses without the depth.`,
});
