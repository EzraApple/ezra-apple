import { z } from "zod";
import extractedResume from "./resume.generated.json";
import { siteOrigin } from "./site";

const Text = z.string().trim().min(1);
const Highlights = z.array(Text).min(1);

export const ResumeSchema = z.object({
  name: Text,
  headline: Text,
  links: z.array(z.object({ label: Text, href: z.url() })).min(1),
  education: z.array(z.object({ institution: Text, degree: Text, date: Text })).min(1),
  experience: z.array(z.object({ organization: Text, role: Text, dates: Text, highlights: Highlights })).min(1),
  projects: z.array(z.object({ name: Text, description: Text, highlights: Highlights })),
  skills: z.array(z.object({ category: Text, items: z.array(Text).min(1) })).min(1),
  pdfUrl: z.url(),
  pdfSha256: z.string().regex(/^[a-f0-9]{64}$/).describe("SHA-256 of the PDF used to generate this content."),
});

// Generated from the approved public PDF; edit that source and run the sync script.
export const resume = ResumeSchema.parse({ ...extractedResume, pdfUrl: `${siteOrigin}/resume.pdf` });
