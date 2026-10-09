import { defineProject } from "./schema";

export const decyphr = defineProject({
  slug: "decyphr",
  order: 2,
  published: true,
  name: "Decyphr",
  category: "Founder project",
  status: "Archived",
  summary: "An AI video translation startup I co-founded and took through a creator beta.",
  tags: [
    "Founder",
    "Next.js",
    "AWS",
    "Video AI",
    "Product validation"
  ],
  links: [
    {
      kind: "profile",
      label: "Decyphr on LinkedIn",
      href: "https://www.linkedin.com/company/106859432/"
    }
  ],
  document: `# Decyphr

An AI video translation startup I co-founded and took through a creator beta.

I co-founded Decyphr and built a closed-beta product for video translation. The project went through UC Berkeley SkyDeck Pad-13. We aimed to support 29 languages and reached a small creator beta.

## The product

Creators could upload a video, choose target languages, follow processing, and receive dubbed or lip-synced versions. The beta also included onboarding, account usage, and admin tools for tracking jobs and failures.

## Engineering decisions

I built the product on Next.js, tRPC, Prisma, Postgres, and Better Auth. AWS CDK provisioned S3-triggered Lambda and Step Functions workflows for dubbing, lip-syncing, retries, retrieval, and failure updates. The complete loop made the beta usable beyond a processing demo.

The AWS pipeline solved reliability problems before demand justified that complexity. We moved toward a lighter way to retest the thesis, and Decyphr is now archived.

## Evidence

- [Company history](https://www.linkedin.com/company/106859432/): Decyphr's company page and updates on LinkedIn. The product is no longer operating.`,
});
