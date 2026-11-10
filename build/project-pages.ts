import { readFile } from "node:fs/promises";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Plugin } from "vite";
import { getProjectDetail, listProjectSummaries, type ProjectDetail } from "../content/projects";
import { siteOrigin } from "../content/site";
import { ProjectPage } from "../src/Project";

function escapeAttribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function renderProjectPage(template: string, project: ProjectDetail): string {
  const replacements: Record<string, string> = {
    __PROJECT_TITLE__: escapeAttribute(project.name),
    __PROJECT_DESCRIPTION__: escapeAttribute(project.summary),
    __PROJECT_URL__: `${siteOrigin}/projects/${project.slug}/`,
    __PROJECT_API_URL__: `${siteOrigin}/api/projects/${project.slug}`,
    __SITE_ORIGIN__: siteOrigin,
    __PROJECT_CONTENT__: renderToStaticMarkup(createElement(ProjectPage, { project })),
  };
  return template.replace(/__[A-Z_]+__/g, (key) => replacements[key] ?? key);
}

export function projectPages(): Plugin {
  return {
    name: "project-pages",
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const path = new URL(request.url ?? "/", "http://localhost").pathname;
        const match = path.match(/^\/projects\/([a-z0-9-]+)\/?$/);
        if (!match) return next();
        const project = getProjectDetail(match[1]);
        if (!project) {
          response.statusCode = 404;
          response.end("Project not found");
          return;
        }
        if (!path.endsWith("/")) {
          response.writeHead(301, { Location: `${path}/` });
          response.end();
          return;
        }
        try {
          const template = await readFile(new URL("../projects/index.html", import.meta.url), "utf8");
          const html = await server.transformIndexHtml("/projects/index.html", renderProjectPage(template, project));
          response.setHeader("Content-Type", "text/html; charset=utf-8");
          response.end(html);
        } catch (error) {
          next(error);
        }
      });
    },
    generateBundle: {
      order: "post",
      handler(_, bundle) {
        const template = bundle["projects/index.html"];
        if (!template || template.type !== "asset") return;
        for (const { slug } of listProjectSummaries()) {
          this.emitFile({
            type: "asset",
            fileName: `projects/${slug}/index.html`,
            source: renderProjectPage(String(template.source), getProjectDetail(slug)!),
          });
        }
        delete bundle["projects/index.html"];
      },
    },
  };
}
