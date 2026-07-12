import { StreamableHTTPTransport } from "@hono/mcp";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { profile } from "../content/profile";
import { getProjectDetail, getProjectsResponse } from "../content/projects";
import { createMcpServer } from "./mcp";

const app = new Hono();
const publicCache =
  "public, max-age=0, s-maxage=300, stale-while-revalidate=86400";

// Public read-only data: any origin may call the API or connect to MCP.
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "mcp-session-id", "mcp-protocol-version"],
    exposeHeaders: ["mcp-session-id"],
  }),
);

app.get("/api", (context) => {
  const origin = new URL(context.req.url).origin;
  context.header("Cache-Control", publicCache);
  return context.json({
    name: "ezra-apple",
    description:
      "Curated public data behind ezraapple.dev: profile and project catalog.",
    endpoints: {
      profile: `${origin}/api/profile`,
      projects: `${origin}/api/projects`,
      project: `${origin}/api/projects/:slug`,
      mcp: `${origin}/mcp`,
    },
    meta: { schemaVersion: 1, source: "curated" },
  });
});

app.get("/api/profile", (context) => {
  context.header("Cache-Control", publicCache);
  return context.json({
    data: profile,
    meta: { schemaVersion: 1, source: "curated" },
  });
});

app.get("/api/projects", (context) => {
  context.header("Cache-Control", publicCache);
  return context.json(getProjectsResponse());
});

app.get("/api/projects/:slug", (context) => {
  const project = getProjectDetail(context.req.param("slug"));

  if (!project) {
    return context.json({ error: "Project not found" }, 404);
  }

  context.header("Cache-Control", publicCache);
  return context.json({
    data: project,
    meta: { schemaVersion: 1, source: "curated" },
  });
});

// Unknown API paths answer in JSON instead of falling through to the SPA.
app.all("/api/*", (context) =>
  context.json({ error: "Unknown endpoint. See /api for the index." }, 404),
);

// Remote MCP over Streamable HTTP. Stateless: each request builds a fresh
// server over the same in-repo content the site renders.
app.all("/mcp", async (context) => {
  const origin = new URL(context.req.url).origin;
  const server = createMcpServer(origin);
  const transport = new StreamableHTTPTransport();
  await server.connect(transport);
  return transport.handleRequest(context);
});

export default app;
