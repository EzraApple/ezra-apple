import { defineProject } from "./schema";

export const decyphr = defineProject({
  slug: "decyphr",
  order: 2,
  published: true,
  name: "Decyphr",
  category: "Founder project",
  status: "Archived",
  summary: "AI video translation for creators.",
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

AI video translation for creators.

I co-founded [Decyphr](https://www.linkedin.com/company/106859432/) and served as CTO. We went through UC Berkeley SkyDeck Pad-13 and reached a closed creator beta with support for 25+ languages. The project is now archived.

I built the web app and processing pipeline. Creators could upload a video, choose languages, track progress, and download dubbed or lip-synced versions. The app used Next.js and Postgres, with AWS Lambda and Step Functions handling processing, retries, and failure reporting.`,
});
