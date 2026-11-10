import { z } from "zod";
import { siteOrigin } from "./site";
import { writing, WritingEntrySchema } from "./writing";
import { resume } from "./resume";

const TextSchema = z.string().trim().min(1);

export const ProfileSchema = z.object({
  name: TextSchema,
  headline: TextSchema,
  background: TextSchema.describe("Short Markdown biography with links to previous work."),
  location: TextSchema,
  previousWork: z.array(z.object({ name: TextSchema, summary: TextSchema, href: z.url() })),
  writing: z.array(WritingEntrySchema),
  resume: z.object({ pageUrl: z.url(), pdfUrl: z.url(), structuredUrl: z.url() }),
  links: z
    .array(
      z.object({
        label: TextSchema,
        href: z.url(),
      }),
    )
    .min(1),
});

export type Profile = z.infer<typeof ProfileSchema>;

// The one identity used by the site header, GET /api/profile, and the MCP
// get_profile tool.
export const profile: Profile = ProfileSchema.parse({
  name: "Ezra Apple",
  headline: "I build AI products, with a focus on agent behavior, evaluation and intuitive user experiences.",
  background: "Previously at [Replo](https://www.replo.app/), building its AI commerce platform. Before that, I co-founded [Decyphr](https://www.linkedin.com/company/106859432/) as CTO and did machine learning research at [Berkeley Lab](https://www.lbl.gov/).",
  location: "San Francisco",
  previousWork: [
    { name: "Replo", summary: "Helped build and launch Replo’s AI commerce platform: product UI, live page previews, agent memory, and evaluations.", href: "https://www.replo.app/" },
    { name: "Decyphr", summary: "Co-founder and CTO of an AI video translation startup.", href: "https://www.linkedin.com/company/106859432/" },
    { name: "Berkeley Lab", summary: "Applied machine learning to ion-source diagnostics for accelerator research.", href: "https://www.lbl.gov/" },
  ],
  writing,
  resume: {
    pageUrl: `${siteOrigin}/resume/`,
    pdfUrl: `${siteOrigin}/resume.pdf`,
    structuredUrl: `${siteOrigin}/api/resume`,
  },
  links: [
    { label: "GitHub", href: "https://github.com/EzraApple" },
    { label: "X", href: "https://x.com/ezra_sf" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/ezraapple/" },
    { label: "Résumé", href: `${siteOrigin}/resume/` },
    { label: "Email", href: resume.links.find(({ label }) => label === "Email")!.href },
  ],
});
