import { z } from "zod";
import { decyphr } from "./projects/decyphr";
import { siteOrigin } from "./site";

const TextSchema = z.string().trim().min(1);

export const ProfileSchema = z.object({
  name: TextSchema,
  headline: TextSchema,
  headlineLink: z.object({
    text: TextSchema,
    label: TextSchema,
    href: z.url(),
    projectSlug: TextSchema,
  }),
  location: TextSchema,
  resume: z.object({ pageUrl: z.url(), pdfUrl: z.url(), structuredUrl: z.url() }),
  links: z
    .array(
      z.object({
        label: TextSchema,
        href: z.url(),
      }),
    )
    .min(1),
}).refine(({ headline, headlineLink }) => headline.includes(headlineLink.text), {
  message: "The linked founder text must appear in the headline",
  path: ["headlineLink", "text"],
});

export type Profile = z.infer<typeof ProfileSchema>;

// The one identity used by the site header, GET /api/profile, and the MCP
// get_profile tool.
export const profile: Profile = ProfileSchema.parse({
  name: "Ezra Apple",
  headline:
    "I build products and the systems behind them. I co-founded Decyphr.",
  headlineLink: {
    text: "Decyphr",
    label: "Decyphr, an AI video translation startup I co-founded",
    href: decyphr.links[0].href,
    projectSlug: decyphr.slug,
  },
  location: "San Francisco",
  resume: {
    pageUrl: `${siteOrigin}/resume`,
    pdfUrl: `${siteOrigin}/resume.pdf`,
    structuredUrl: `${siteOrigin}/api/resume`,
  },
  links: [
    { label: "GitHub", href: "https://github.com/EzraApple" },
    { label: "X", href: "https://x.com/ezra_sf" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/ezraapple/" },
    { label: "Résumé", href: `${siteOrigin}/resume` },
  ],
});
