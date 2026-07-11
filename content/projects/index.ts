import { cosmicHotPotato } from "./cosmic-hot-potato";
import { decyphr } from "./decyphr";
import { leHarness } from "./leharness";
import { shoutout } from "./shoutout";
import { skillsInit } from "./skills-init";
import { spatium } from "./spatium";
import {
  ProjectCollectionSchema,
  ProjectDetailSchema,
  ProjectSummarySchema,
  ProjectsResponseSchema,
  type Project,
  type ProjectDetail,
  type ProjectSummary,
  type ProjectsResponse,
} from "./schema";

const authoredProjects = ProjectCollectionSchema.parse([
  shoutout,
  decyphr,
  spatium,
  leHarness,
  cosmicHotPotato,
  skillsInit,
]);

const publicProjects = authoredProjects
  .filter((project) => project.published)
  .sort((left, right) => left.order - right.order);

function toSummary(project: Project): ProjectSummary {
  return ProjectSummarySchema.parse(project);
}

export function listProjectSummaries(): ProjectSummary[] {
  return publicProjects.map(toSummary);
}

export function getProject(slug: string): Project | undefined {
  return publicProjects.find((project) => project.slug === slug);
}

export function getProjectDetail(slug: string): ProjectDetail | undefined {
  const project = getProject(slug);
  return project ? ProjectDetailSchema.parse(project) : undefined;
}

export function getProjectsResponse(): ProjectsResponse {
  const data = listProjectSummaries();

  return ProjectsResponseSchema.parse({
    data,
    meta: {
      schemaVersion: 1,
      source: "curated",
      count: data.length,
    },
  });
}

export * from "./schema";
