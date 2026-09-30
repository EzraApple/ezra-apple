import { cloudflare } from "@cloudflare/vite-plugin";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getHomepageContent } from "./content/homepage";
import { App } from "./src/App";
import { Resume } from "./src/Resume";
import { siteOrigin } from "./content/site";

export default defineConfig({
  // Let the Worker enforce the same route-specific CORS policy locally and deployed.
  server: { cors: false },
  preview: { cors: false },
  environments: {
    client: {
      build: {
        rolldownOptions: {
          input: {
            main: fileURLToPath(new URL("./index.html", import.meta.url)),
            resume: fileURLToPath(new URL("./resume/index.html", import.meta.url)),
          },
        },
      },
    },
  },
  plugins: [
    cloudflare(),
    {
      name: "prerender-pages",
      transformIndexHtml(html, context) {
        if (context.filename.endsWith("/resume/index.html")) {
          const markup = renderToStaticMarkup(createElement(Resume));
          return html
            .replaceAll("__SITE_ORIGIN__", siteOrigin)
            .replace('<div id="root"></div>', `<div id="root">${markup}</div>`);
        }

        const content = getHomepageContent();
        const markup = renderToStaticMarkup(createElement(App, { content }));
        const description = content.profile.headline
          .replace(/&/g, "&amp;")
          .replace(/"/g, "&quot;")
          .replace(/</g, "&lt;");
        return html
          .replaceAll("__PROFILE_DESCRIPTION__", description)
          .replaceAll("__SITE_ORIGIN__", siteOrigin)
          .replace(
            '<div id="root"></div>',
            `<div id="root">${markup}</div>`,
          );
      },
    },
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
});
