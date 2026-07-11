import { Hono } from "hono";
import { getProjectDetail, getProjectsResponse } from "../content/projects";

const app = new Hono();
const publicCache =
  "public, max-age=0, s-maxage=300, stale-while-revalidate=86400";

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

export default app;
