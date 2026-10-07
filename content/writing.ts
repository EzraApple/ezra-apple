import { z } from "zod";

const TextSchema = z.string().trim().min(1);
export const WritingEntrySchema = z.object({
  title: TextSchema,
  href: z.url(),
  description: TextSchema,
  publication: TextSchema,
});
export type WritingEntry = z.infer<typeof WritingEntrySchema>;

// Shared by the homepage, profile, writing API, and MCP. Full articles stay at their source URLs.
export const writing = z.array(WritingEntrySchema).parse([
  {
    title: "Company Context Is AI Infrastructure",
    href: "https://www.replo.app/engineering/company-context-is-infrastructure",
    description: "How we made Replo’s knowledge useful across the team.",
    publication: "Replo Engineering",
  },
]);
