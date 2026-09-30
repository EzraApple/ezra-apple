import { defineProject } from "./schema";

export const cosmicHotPotato = defineProject({
  slug: "cosmic-hot-potato",
  order: 5,
  published: true,
  name: "Cosmic Hot Potato",
  category: "Semantic word game",
  status: "Live",
  summary: "A daily word game that maps how semantically close your guesses are in 2D or 3D.",
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

A daily word game that maps how semantically close your guesses are in 2D or 3D.

Cosmic Hot Potato makes semantic distance something you can see and explore, rather than only a rank in a list.

## The product

Each daily answer sits in a word embedding space. A guess gets a similarity score and a position around the target, with ranked guesses, temperature feedback, and an interactive map that switches between 2D and 3D.

## Engineering decisions

The game ships int8-quantized, 50-dimensional GloVe vectors, so it can score any of 317,000 guesses inside the deployment without an embedding service. Cosine similarity measures closeness; UMAP places each neighborhood in the explorable scene.

The Next.js and Three.js interface keeps a 2D view available when depth makes comparison harder. Quantizing the vectors trades precision for a vocabulary that can ship with the game; both views use the same semantic feedback.

## Evidence

- [Playable product](https://cosmic-hot-potato.vercel.app/): The live daily word game and its public explanation of the map math.`,
});
