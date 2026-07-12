import { z } from "zod";

const TextSchema = z.string().trim().min(1);

export const ProfileSchema = z.object({
  name: TextSchema,
  headline: TextSchema,
  location: TextSchema,
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
  headline:
    "Software engineer and former founder building AI products and agent infrastructure.",
  location: "San Francisco",
  links: [
    { label: "GitHub", href: "https://github.com/EzraApple" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/ezraapple/" },
    { label: "X", href: "https://x.com/ezra_sf" },
  ],
});
