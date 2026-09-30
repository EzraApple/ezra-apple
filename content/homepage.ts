import { profile, type Profile } from "./profile";
import { listProjectSummaries } from "./projects";
import type { HomepageProject } from "./projects/schema";
import { writing, type WritingEntry } from "./writing";

export type HomepageContent = {
  profile: Profile;
  projects: HomepageProject[];
  writing: WritingEntry[];
};

export function getHomepageContent(): HomepageContent {
  return {
    profile,
    projects: listProjectSummaries()
      .filter(({ slug }) => slug !== profile.headlineLink.projectSlug)
      .map(({ slug, name, summary, links }) => ({
        slug,
        name,
        label: slug === "shoutout" ? "shoutout.sh" : name,
        summary,
        links,
      })),
    writing,
  };
}
