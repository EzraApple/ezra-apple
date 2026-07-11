import { queryOptions } from "@tanstack/react-query";
import {
  ProjectsResponseSchema,
  type ProjectSummary,
} from "@/content/projects";

export const projectKeys = {
  all: ["projects"] as const,
  summaries: () => [...projectKeys.all, "summaries"] as const,
};

async function fetchProjectSummaries(): Promise<ProjectSummary[]> {
  const response = await fetch("/api/projects", {
    headers: { accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Project request failed with ${response.status}`);
  }

  return ProjectsResponseSchema.parse(await response.json()).data;
}

export function projectsQueryOptions(initialData: ProjectSummary[]) {
  return queryOptions({
    queryKey: projectKeys.summaries(),
    queryFn: fetchProjectSummaries,
    initialData,
  });
}
