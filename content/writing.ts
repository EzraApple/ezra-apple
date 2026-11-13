import { z } from "zod";

const TextSchema = z.string().trim().min(1);
export const WritingEntrySchema = z.object({
  title: TextSchema,
  href: z.url(),
  description: TextSchema,
  publication: TextSchema,
});
export type WritingEntry = z.infer<typeof WritingEntrySchema>;

export const shoutoutArticleUrl = "https://x.com/i/article/2120250098546626560";

// Shared by the homepage, profile, writing API, and MCP. Full articles stay at their source URLs.
export const writing = z.array(WritingEntrySchema).parse([
  {
    title: "Company Context Is AI Infrastructure",
    href: "https://www.replo.app/engineering/company-context-is-infrastructure",
    description: "How we brought Replo’s tools and team knowledge into one repo for coding agents.",
    publication: "Replo Engineering",
  },
  {
    title: "My Wispr Flow subscription lapsed, so I built my own",
    href: shoutoutArticleUrl,
    description: "How I cut local dictation latency to 187 ms on my M3 Max.",
    publication: "X",
  },
]);
