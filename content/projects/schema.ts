import { z } from "zod";

const TextSchema = z.string().trim().min(1);
export const ProjectSlugSchema = z.string().min(1).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const SearchQuerySchema = z.string().max(200).trim().min(2);

export const ProjectLinkSchema = z.object({
  kind: z.enum(["product", "repository", "package", "profile"]),
  label: TextSchema,
  href: z.url(),
});

export const ProjectSummarySchema = z.object({
  slug: ProjectSlugSchema,
  name: TextSchema,
  category: TextSchema,
  status: z.enum(["Live", "Shipping", "Open source", "Closed beta", "Archived"]),
  summary: TextSchema,
  tags: z.array(TextSchema).min(1).max(6),
  links: z.array(ProjectLinkSchema),
});

// A project is one complete Markdown document plus a small discovery record.
export const ProjectDetailSchema = ProjectSummarySchema.extend({
  document: TextSchema.describe("Complete Markdown project document, including engineering decisions and public evidence links."),
});
export const ProjectSchema = ProjectDetailSchema.extend({
  order: z.number().int().nonnegative(),
  published: z.boolean(),
});

export const ProjectCollectionSchema = z.array(ProjectSchema).superRefine((projects, context) => {
  const slugs = new Set<string>();
  const orders = new Set<number>();
  projects.forEach((project, index) => {
    if (slugs.has(project.slug)) {
      context.addIssue({ code: "custom", message: `Duplicate project slug: ${project.slug}`, path: [index, "slug"] });
    }
    if (orders.has(project.order)) {
      context.addIssue({ code: "custom", message: `Duplicate project order: ${project.order}`, path: [index, "order"] });
    }
    slugs.add(project.slug);
    orders.add(project.order);
  });
});

export const HomepageProjectSchema = ProjectSummarySchema.pick({
  slug: true, name: true, summary: true, links: true,
}).extend({ label: TextSchema });

export const ProjectsResponseSchema = z.object({
  data: z.array(ProjectSummarySchema),
  meta: z.object({ schemaVersion: z.literal(2), source: z.literal("curated"), count: z.number().int().nonnegative() }),
});

export type HomepageProject = z.infer<typeof HomepageProjectSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type ProjectInput = z.input<typeof ProjectSchema>;
export type ProjectSummary = z.infer<typeof ProjectSummarySchema>;
export type ProjectDetail = z.infer<typeof ProjectDetailSchema>;
export type ProjectsResponse = z.infer<typeof ProjectsResponseSchema>;
export function defineProject(project: ProjectInput): Project {
  return ProjectSchema.parse(project);
}
