import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { profile } from "../content/profile";
import {
  getProjectDetail,
  listProjectSummaries,
  type ProjectDetail,
} from "../content/projects";

const DEPTHS = ["what", "experience", "decisions", "system", "proof"] as const;
type Depth = (typeof DEPTHS)[number];

const SEARCH_RESULT_LIMIT = 5;

// Agent-facing projections omit theme and artifact: they describe how the
// site renders a project, not what the project is.
function toAgentSummary(detail: ProjectDetail) {
  return {
    slug: detail.slug,
    name: detail.name,
    category: detail.category,
    status: detail.status,
    summary: detail.summary,
    tags: detail.tags,
    links: detail.links,
  };
}

function toAgentProject(detail: ProjectDetail, depth?: Depth) {
  return {
    ...toAgentSummary(detail),
    depth: depth ? { [depth]: detail.depth[depth] } : detail.depth,
  };
}

function projectDetails(): ProjectDetail[] {
  return listProjectSummaries()
    .map((summary) => getProjectDetail(summary.slug))
    .filter((detail): detail is ProjectDetail => detail !== undefined);
}

function searchableText(detail: ProjectDetail): string {
  const depthText = Object.values(detail.depth)
    .flatMap((section) =>
      Array.isArray(section)
        ? section.map((entry) => Object.values(entry).join(" "))
        : Object.values(section).flat().join(" "),
    )
    .join(" ");
  return [detail.name, detail.category, detail.summary, detail.tags.join(" "), depthText]
    .join(" ")
    .toLowerCase();
}

function asJson(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
  };
}

export function createMcpServer(origin: string): McpServer {
  const server = new McpServer({
    name: "ezra-apple",
    version: "1.0.0",
  });

  server.registerTool(
    "get_profile",
    {
      title: "Get profile",
      description:
        "Who Ezra Apple is: name, headline, location, and public links. The same identity rendered on the site and served by GET /api/profile.",
    },
    () => asJson({ ...profile, site: origin, api: `${origin}/api` }),
  );

  server.registerTool(
    "list_projects",
    {
      title: "List projects",
      description:
        "The curated public project catalog in its authored order: slug, name, category, status, one-sentence summary, tags, and links. Use get_project for depth.",
    },
    () => asJson({ projects: projectDetails().map(toAgentSummary) }),
  );

  server.registerTool(
    "get_project",
    {
      title: "Get project",
      description:
        "Full authored dossier for one project. Optional depth narrows to one level: what (what it is), experience (how it feels), decisions (why it works this way), system (how it is built), or proof (where it shipped).",
      inputSchema: {
        slug: z
          .string()
          .describe("Project slug from list_projects, e.g. shoutout"),
        depth: z.enum(DEPTHS).optional(),
      },
    },
    ({ slug, depth }) => {
      const detail = getProjectDetail(slug);
      if (!detail) {
        const known = listProjectSummaries().map((project) => project.slug);
        return asJson({
          error: `Unknown project: ${slug}`,
          knownSlugs: known,
        });
      }
      return asJson(toAgentProject(detail, depth));
    },
  );

  server.registerTool(
    "list_decisions",
    {
      title: "List decisions",
      description:
        "Design and engineering decisions across all projects, each with the project it belongs to. Optionally filter to one project slug.",
      inputSchema: {
        slug: z.string().optional().describe("Optional project slug filter"),
      },
    },
    ({ slug }) => {
      const details = projectDetails().filter(
        (detail) => !slug || detail.slug === slug,
      );
      return asJson({
        decisions: details.flatMap((detail) =>
          detail.depth.decisions.map((decision) => ({
            project: detail.slug,
            title: decision.title,
            summary: decision.summary,
          })),
        ),
      });
    },
  );

  server.registerTool(
    "search_work",
    {
      title: "Search work",
      description:
        "Keyword search across all authored project content (names, summaries, tags, narratives, decisions, systems). Returns matching projects with their summaries; use get_project on a result for depth.",
      inputSchema: {
        query: z.string().min(2).describe("Keywords, e.g. local AI dictation"),
      },
    },
    ({ query }) => {
      const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
      const scored = projectDetails()
        .map((detail) => {
          const haystack = searchableText(detail);
          const matched = terms.filter((term) => {
            const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            return new RegExp(`\\b${escaped}`).test(haystack);
          });
          return { detail, matched, score: matched.length };
        })
        .filter((entry) => entry.score > 0)
        .sort((left, right) => right.score - left.score)
        .slice(0, SEARCH_RESULT_LIMIT);

      return asJson({
        query,
        results: scored.map((entry) => ({
          ...toAgentSummary(entry.detail),
          matchedTerms: entry.matched,
        })),
      });
    },
  );

  return server;
}
