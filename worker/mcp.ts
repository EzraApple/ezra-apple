import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { profile, ProfileSchema } from "../content/profile";
import { resume, ResumeSchema } from "../content/resume";
import {
  getProjectDetail, listProjectSummaries, ProjectDetailSchema,
  ProjectSummarySchema, ProjectSlugSchema, SearchQuerySchema,
} from "../content/projects";

const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false,
};
const projects = listProjectSummaries().map(summary => ({
  summary,
  text: [summary.name, summary.category, summary.summary, ...summary.tags,
    getProjectDetail(summary.slug)!.document].join(" ").toLowerCase(),
}));

function asJson(value: Record<string, unknown>) {
  return {
    structuredContent: value,
    content: [{ type: "text" as const, text: JSON.stringify(value) }],
  };
}

export function createMcpServer(): McpServer {
  const server = new McpServer({ name: "ezra-apple", version: "2.0.0" }, {
    instructions: "Explore Ezra Apple's curated public work. list_projects returns a compact catalog; get_project returns one complete Markdown document including background, engineering choices, implementation, and evidence. No depth selection or follow-up section calls are needed. search_work is keyword search, not semantic search. get_resume returns structured experience, education, projects, skills, and a PDF link. Cite the public evidence links in each document; this content is authored, not independently verified.",
  });

  server.registerTool("get_profile", {
    title: "Get profile", annotations: READ_ONLY_ANNOTATIONS,
    description: "Ezra Apple's public identity and links, identical to GET /api/profile data.",
    outputSchema: ProfileSchema,
  }, () => asJson(profile));

  server.registerTool("list_projects", {
    title: "List projects", annotations: READ_ONLY_ANNOTATIONS,
    description: "Compact authored project catalog. Use a slug with get_project to read its entire document in one call.",
    outputSchema: z.object({ projects: z.array(ProjectSummarySchema) }),
  }, () => asJson({ projects: listProjectSummaries() }));

  server.registerTool("get_project", {
    title: "Read project document", annotations: READ_ONLY_ANNOTATIONS,
    description: "One complete project document with its background, experience, engineering decisions, implementation, and public evidence links. Identical to GET /api/projects/:slug data. No depth parameter is needed.",
    inputSchema: z.object({ slug: ProjectSlugSchema.describe("Slug from list_projects, e.g. shoutout") }).strict(),
    outputSchema: ProjectDetailSchema,
  }, ({ slug }) => {
    const project = getProjectDetail(slug);
    if (!project) return {
      isError: true,
      content: [{ type: "text" as const, text: JSON.stringify({ error: `Unknown project: ${slug}`, knownSlugs: listProjectSummaries().map(p => p.slug) }) }],
    };
    return asJson(project);
  });

  server.registerTool("search_work", {
    title: "Search work", annotations: READ_ONLY_ANNOTATIONS,
    description: "Keyword search across complete project documents. Returns at most five matching summaries and matched terms. Read a result with get_project for its full document and evidence.",
    inputSchema: z.object({ query: SearchQuerySchema.describe("2–200 characters, e.g. local AI dictation") }).strict(),
    outputSchema: z.object({ query: z.string(), results: z.array(ProjectSummarySchema.extend({ matchedTerms: z.array(z.string()) })).max(5) }),
  }, ({ query }) => {
    const terms = [...new Set(query.toLowerCase().split(/\s+/))];
    const results = projects.map(({ summary, text }) => {
      const matchedTerms = terms.filter(term => {
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return new RegExp(`\\b${escaped}`).test(text);
      });
      return { ...summary, matchedTerms };
    }).filter(p => p.matchedTerms.length > 0)
      .sort((a, b) => b.matchedTerms.length - a.matchedTerms.length).slice(0, 5);
    return asJson({ query, results });
  });

  server.registerTool("get_resume", {
    title: "Get résumé", annotations: READ_ONLY_ANNOTATIONS,
    description: "Structured public résumé with experience, education, projects, skills, and PDF metadata. Identical to GET /api/resume data.",
    outputSchema: ResumeSchema,
  }, () => asJson(resume));
  return server;
}
