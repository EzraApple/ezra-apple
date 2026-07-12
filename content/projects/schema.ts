import { z } from "zod";

const TextSchema = z.string().trim().min(1);
const OklchSchema = z.string().regex(/^oklch\(.+\)$/);

export const ProjectLinkSchema = z.object({
  kind: z.enum(["product", "repository", "package"]),
  label: TextSchema,
  href: z.url(),
});

export const ProjectThemeSchema = z.object({
  background: OklchSchema,
  surface: OklchSchema,
  foreground: OklchSchema,
  muted: OklchSchema,
  border: OklchSchema,
  accent: OklchSchema,
  accentSoft: OklchSchema,
  // Each project's title renders in its own display face; the catalog's
  // scroll-linked fade carries the swap between adjacent projects.
  titleFont: TextSchema,
  titleWeight: z.number().min(100).max(900).default(600),
});

const ArtifactItemSchema = z.object({
  label: TextSchema,
  detail: TextSchema,
});

export const ProjectArtifactSchema = z.object({
  kind: z.enum(["flow", "canvas", "tree", "orbit", "log"]),
  label: TextSchema,
  caption: TextSchema,
  items: z.array(ArtifactItemSchema).min(3).max(5),
});

const NarrativeSectionSchema = z.object({
  headline: TextSchema,
  body: TextSchema,
  highlights: z.array(TextSchema).min(1).max(5),
});

const DecisionSchema = z.object({
  title: TextSchema,
  summary: TextSchema,
});

const SystemSectionSchema = z.object({
  headline: TextSchema,
  body: TextSchema,
  stack: z.array(TextSchema).min(1),
  flow: z.array(TextSchema).min(2),
});

const EvidenceSchema = z.object({
  label: TextSchema,
  note: TextSchema,
  href: z.url(),
});

export const ProjectSchema = z.object({
  schemaVersion: z.literal(1),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  order: z.number().int().nonnegative(),
  published: z.boolean(),
  name: TextSchema,
  category: TextSchema,
  status: z.enum(["Live", "Shipping", "Open source", "Closed beta"]),
  summary: TextSchema,
  tags: z.array(TextSchema).min(1).max(6),
  links: z.array(ProjectLinkSchema).min(1),
  theme: ProjectThemeSchema,
  artifact: ProjectArtifactSchema,
  depth: z.object({
    what: NarrativeSectionSchema,
    experience: NarrativeSectionSchema,
    decisions: z.array(DecisionSchema).min(1),
    system: SystemSectionSchema,
    proof: z.array(EvidenceSchema).min(1),
  }),
});

export const ProjectCollectionSchema = z
  .array(ProjectSchema)
  .superRefine((projects, context) => {
    const slugs = new Set<string>();
    const orders = new Set<number>();

    projects.forEach((project, index) => {
      if (slugs.has(project.slug)) {
        context.addIssue({
          code: "custom",
          message: `Duplicate project slug: ${project.slug}`,
          path: [index, "slug"],
        });
      }
      if (orders.has(project.order)) {
        context.addIssue({
          code: "custom",
          message: `Duplicate project order: ${project.order}`,
          path: [index, "order"],
        });
      }
      slugs.add(project.slug);
      orders.add(project.order);
    });
  });

export const ProjectSummarySchema = ProjectSchema.pick({
  slug: true,
  order: true,
  name: true,
  category: true,
  status: true,
  summary: true,
  tags: true,
  links: true,
  theme: true,
  artifact: true,
});

export const ProjectDetailSchema = ProjectSchema.omit({
  published: true,
});

export const ProjectsResponseSchema = z.object({
  data: z.array(ProjectSummarySchema),
  meta: z.object({
    schemaVersion: z.literal(1),
    source: z.literal("curated"),
    count: z.number().int().nonnegative(),
  }),
});

export type Project = z.infer<typeof ProjectSchema>;
export type ProjectInput = z.input<typeof ProjectSchema>;
export type ProjectSummary = z.infer<typeof ProjectSummarySchema>;
export type ProjectDetail = z.infer<typeof ProjectDetailSchema>;
export type ProjectsResponse = z.infer<typeof ProjectsResponseSchema>;

export function defineProject(project: ProjectInput): Project {
  return ProjectSchema.parse(project);
}
