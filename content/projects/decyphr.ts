import { defineProject } from "./schema";

export const decyphr = defineProject({
  schemaVersion: 1,
  slug: "decyphr",
  order: 1,
  published: true,
  name: "Decyphr",
  category: "Founder project",
  status: "Closed beta",
  summary:
    "An AI video translation product I co-founded and took through a small creator beta, building the full-stack app and its AWS media pipeline before we simplified the product direction.",
  tags: ["Founder", "Next.js", "AWS", "Video AI", "Product validation"],
  links: [
    {
      kind: "product",
      label: "Visit Decyphr",
      href: "https://www.decyphr.ai/",
    },
  ],
  theme: {
    background: "oklch(0.15 0.022 235)",
    surface: "oklch(0.197 0.03 232)",
    foreground: "oklch(0.95 0.018 224)",
    muted: "oklch(0.7 0.042 225)",
    border: "oklch(0.36 0.052 225)",
    accent: "oklch(0.75 0.135 215)",
    accentSoft: "oklch(0.32 0.075 220)",
  },
  artifact: {
    kind: "flow",
    label: "Video localization pipeline",
    caption:
      "A production-shaped system built before the product had production-shaped demand.",
    items: [
      { label: "01", detail: "Upload source video" },
      { label: "02", detail: "Dub and poll jobs" },
      { label: "03", detail: "Retrieve translated audio" },
      { label: "04", detail: "Lip-sync and deliver" },
    ],
  },
  depth: {
    what: {
      headline: "A founder-built video translation product tested in closed beta.",
      body: "Decyphr let creators upload a video, choose target languages, and receive dubbed or lip-synced versions while the product tracked processing, usage, and failures.",
      highlights: [
        "UC Berkeley SkyDeck Pad-13",
        "Small creator beta",
        "29-language product direction",
      ],
    },
    experience: {
      headline: "One upload, then a visible long-running workflow.",
      body: "The app covered authentication, onboarding, project creation, media upload, job progress, downloads, account usage, and the internal admin tools needed to support a beta.",
      highlights: ["Creator onboarding", "Processing status", "Admin and usage tooling"],
    },
    decisions: [
      {
        title: "Build the complete loop",
        summary: "The beta exercised a real end-to-end product rather than a video-processing demo: users, uploads, orchestration, failure handling, and delivery lived in one system.",
      },
      {
        title: "Complexity outran validation",
        summary: "The AWS pipeline solved production-shaped reliability problems before demand was established, so the later direction became a lighter marketing surface for reevaluating the product thesis.",
      },
    ],
    system: {
      headline: "A T3-style web app in front of an AWS-orchestrated media pipeline.",
      body: "Next.js, tRPC, Prisma, Postgres, and Better Auth managed the product while CDK provisioned S3-triggered Lambda and Step Functions workflows for dubbing, lip-syncing, retries, retrieval, and failure updates.",
      stack: [
        "Next.js",
        "TypeScript",
        "tRPC",
        "Prisma",
        "Postgres",
        "AWS CDK",
        "S3",
        "Lambda",
        "Step Functions",
      ],
      flow: [
        "Upload to S3",
        "Start state machine",
        "Dub and poll",
        "Retrieve audio",
        "Lip-sync and retry",
        "Deliver result",
      ],
    },
    proof: [
      {
        label: "Current public site",
        note: "The lighter public marketing direction that followed the original beta product.",
        href: "https://www.decyphr.ai/",
      },
    ],
  },
});
