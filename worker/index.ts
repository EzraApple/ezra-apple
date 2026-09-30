import { StreamableHTTPTransport } from "@hono/mcp";
import { Hono, type MiddlewareHandler } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { profile } from "../content/profile";
import { resume } from "../content/resume";
import {
  getProjectDetail,
  getProjectsResponse,
  listProjectSummaries,
} from "../content/projects";
import { mcpOrigin, publicGetCache, rateLimit, readBoundedJson, type WorkerEnvironment } from "./http";
import { createMcpServer } from "./mcp";

const app = new Hono<WorkerEnvironment>();
const agentGuideLink = '</llms.txt>; rel="describedby"; type="text/plain"';

app.onError((error) => {
  if (error instanceof HTTPException) {
    const response = error.getResponse();
    const headers = new Headers(response.headers);
    headers.set("Cache-Control", "no-store");
    return new Response(response.body, { status: response.status, headers });
  }
  return Response.json({ error: "Internal server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
});

const advertiseAgentGuide: MiddlewareHandler<WorkerEnvironment> = async (context, next) => {
  context.header("Link", agentGuideLink);
  await next();
};

// Browser access to the public read-only API remains open across origins.
const publicCors = cors({ origin: "*", allowMethods: ["GET", "HEAD", "OPTIONS"], exposeHeaders: ["ETag", "Cache-Status", "Retry-After"] });
app.use("/api/*", publicCors, advertiseAgentGuide, rateLimit("API_RATE_LIMIT"), publicGetCache);
app.use("/llms.txt", rateLimit("API_RATE_LIMIT"), publicGetCache);

app.get("/llms.txt", (context) => {
  const origin = new URL(context.req.url).origin;
  const projects = listProjectSummaries()
    .map((project) => `- [${project.name}](${origin}/api/projects/${project.slug}/document): ${project.summary}`)
    .join("\n");
  const guide = [
    `# ${profile.name}`,
    "",
    `> ${profile.headline}`,
    "",
    "## Structured content",
    "",
    `- [API index](${origin}/api): Endpoint map and schema version.`,
    `- [Profile](${origin}/api/profile): Public profile and social links.`,
    `- [Résumé](${origin}/api/resume): Structured experience, education, projects, skills, and PDF metadata.`,
    `- [Résumé PDF](${resume.pdfUrl}): Human-readable document.`,
    `- [Projects](${origin}/api/projects): Ordered project summaries.`,
    `- [MCP](${origin}/mcp): Remote Model Context Protocol server (Streamable HTTP, POST only).`,
    "",
    "The API and MCP server expose the same curated, public, read-only content. No authentication is required.",
    "Start with the API index for JSON endpoints, or connect an MCP client to /mcp and discover its tools.",
    "MCP tools: get_profile, list_projects, get_project(slug), search_work(query), get_resume.",
    "Use get_resume for structured résumé details, or open the linked PDF for the human-readable document.",
    "Use list_projects to find a slug, then get_project for one complete Markdown document, including context, decisions, and evidence links.",
    "Use search_work to find projects by keyword.",
    "",
    "## Example questions",
    "",
    `- How does ShoutOut keep dictation in the app you're using? Read the [project document](${origin}/api/projects/shoutout/document) and check the [public product](https://shoutout.sh).`,
    `- How does Spatium support collaborative editing? Read the [project document](${origin}/api/projects/spatium/document) and inspect its [public source](https://github.com/EzraApple/spatium).`,
    "",
    "## Projects",
    "",
    projects,
    "",
  ].join("\n");

  return context.text(guide, 200, { "Content-Type": "text/plain; charset=utf-8" });
});

app.get("/api", (context) => {
  const origin = new URL(context.req.url).origin;
  return context.json({
    name: "ezra-apple",
    description: "Curated public data behind ezraapple.dev: profile, résumé, and project catalog.",
    endpoints: {
      guide: `${origin}/llms.txt`,
      profile: `${origin}/api/profile`,
      resume: `${origin}/api/resume`,
      projects: `${origin}/api/projects`,
      project: `${origin}/api/projects/:slug`,
      projectDocument: `${origin}/api/projects/:slug/document`,
      mcp: `${origin}/mcp`,
    },
    access: { public: true, readOnly: true, authentication: "none" },
    mcp: {
      transport: "streamable-http",
      tools: ["get_profile", "list_projects", "get_project", "search_work", "get_resume"],
    },
    meta: { schemaVersion: 2, source: "curated" },
  });
});

app.get("/api/profile", (context) =>
  context.json({ data: profile, meta: { schemaVersion: 2, source: "curated" } }),
);

app.get("/api/resume", (context) =>
  context.json({ data: resume, meta: { schemaVersion: 2, source: "curated" } }),
);

app.get("/api/projects", (context) => context.json(getProjectsResponse()));

app.get("/api/projects/:slug/document", (context) => {
  const project = getProjectDetail(context.req.param("slug"));
  if (!project) return context.json({ error: "Project not found" }, 404, { "Cache-Control": "no-store" });
  return context.text(project.document, 200, { "Content-Type": "text/markdown; charset=utf-8" });
});

app.get("/api/projects/:slug", (context) => {
  const project = getProjectDetail(context.req.param("slug"));
  if (!project) return context.json({ error: "Project not found" }, 404, { "Cache-Control": "no-store" });
  return context.json({ data: project, meta: { schemaVersion: 2, source: "curated" } });
});

const apiMethodNotAllowed = () =>
  Response.json(
    { error: "Use GET to read this API endpoint." },
    { status: 405, headers: { Allow: "GET, HEAD, OPTIONS", "Cache-Control": "no-store" } },
  );
app.all("/api", apiMethodNotAllowed);
app.all("/api/profile", apiMethodNotAllowed);
app.all("/api/resume", apiMethodNotAllowed);
app.all("/api/projects", apiMethodNotAllowed);
app.all("/api/projects/:slug/document", apiMethodNotAllowed);
app.all("/api/projects/:slug", apiMethodNotAllowed);

// Unknown API paths answer in JSON instead of falling through to the SPA.
app.all("/api/*", (context) =>
  context.json({ error: "Unknown endpoint. See /api for the index." }, 404, { "Cache-Control": "no-store" }),
);

app.use("/mcp", mcpOrigin, rateLimit("MCP_RATE_LIMIT"));
app.options("/mcp", () =>
  new Response(null, { status: 204, headers: { Allow: "POST, OPTIONS", Link: agentGuideLink } }),
);
app.get("/mcp", (context, next) => {
  // Browser navigation gets setup guidance; MCP event-stream requests stay 405.
  if (!context.req.header("Accept")?.includes("text/html")) return next();
  const origin = new URL(context.req.url).origin;
  return context.text([
    "Ezra Apple — MCP",
    "",
    "Connect your MCP client to:",
    `${origin}/mcp`,
    "",
    "Transport: Streamable HTTP",
    "Authentication: none. Public, read-only content.",
    "",
    "Add this URL as a remote MCP server in your client. Then ask your agent",
    "about my projects, technical decisions, or background.",
    "",
    "Try asking: How does Spatium keep roommates' floor plans in sync?",
    "The agent can find Spatium with list_projects, then read its complete",
    "document with get_project and follow the public source link as evidence.",
    "",
    "Tools: get_profile, list_projects, get_project, search_work, get_resume.",
    "Use get_resume for structured experience, education, skills, and the PDF link.",
    "Each project is available as one complete document.",
    "",
    `JSON API: ${origin}/api`,
    `Agent guide: ${origin}/llms.txt`,
    "",
  ].join("\n"), 200, { "Cache-Control": "no-store", Vary: "Accept", Link: agentGuideLink });
});
app.post("/mcp", async (context) => {
  const parsed = await readBoundedJson(context.req.raw);
  if (parsed.error) return parsed.error;

  const server = createMcpServer();
  const transport = new StreamableHTTPTransport({ enableJsonResponse: true });
  try {
    await server.connect(transport);
    return (await transport.handleRequest(context, parsed.value)) ?? new Response(null, { status: 202 });
  } finally {
    await server.close();
  }
});
app.all("/mcp", () =>
  Response.json(
    { error: "Connect to this stateless MCP server with POST. GET event streams are unavailable." },
    { status: 405, headers: { Allow: "POST, OPTIONS", Link: agentGuideLink, "Cache-Control": "no-store" } },
  ),
);

export default app;
