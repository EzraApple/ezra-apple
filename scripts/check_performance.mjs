import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";

const root = new URL("../dist/client/", import.meta.url);
const html = await readFile(new URL("index.html", root), "utf8");
const withoutSpeculationRules = html.replace(
  /<script type="speculationrules">([\s\S]*?)<\/script>/g,
  (_, rules) => {
    JSON.parse(rules);
    return "";
  },
);
assert(!/<script\b/i.test(withoutSpeculationRules), "The homepage must ship without executable JavaScript.");

// Measure the initial page, not social images or linked documents. Gzip text;
// count already-compressed fonts/images as-is. This is a repeatable payload
// budget, not a browser timing or a claim about CDN compression settings.
const assets = new Set();
for (const tag of html.matchAll(/<(?:link|img)\b[^>]*>/gi)) {
  const value = tag[0];
  if (value.startsWith("<link") && !/rel="(?:stylesheet|preload|icon)"/.test(value)) continue;
  const path = value.match(/(?:href|src)="([^"]+)"/)?.[1];
  assert(path, `Missing asset URL: ${value}`);
  assets.add(path);
}

const sizes = { html: gzipSync(html).length, css: 0, fonts: 0, other: 0 };
for (const path of assets) {
  assert(path.startsWith("/") && !path.startsWith("//"), `Expected a self-hosted asset: ${path}`);
  const bytes = await readFile(new URL(`.${path}`, root));
  if (path.endsWith(".css")) {
    sizes.css += gzipSync(bytes).length;
    for (const match of bytes.toString().matchAll(/url\(["']?([^\s)"']+)["']?\)/g)) {
      const url = new URL(match[1], `https://site.example${path}`);
      assert.equal(url.origin, "https://site.example", `Expected a self-hosted asset: ${url}`);
      assets.add(url.pathname);
    }
  } else if (path.endsWith(".woff2")) {
    sizes.fonts += bytes.length;
  } else {
    sizes.other += path.endsWith(".svg") ? gzipSync(bytes).length : bytes.length;
  }
}
sizes.total = Object.values(sizes).reduce((sum, size) => sum + size, 0);
const limits = { html: 6 * 1024, css: 3 * 1024, fonts: 36 * 1024, other: 8 * 1024, total: 45 * 1024 };
for (const [kind, size] of Object.entries(sizes)) {
  console.log(`${kind}: ${size} / ${limits[kind]} bytes`);
  assert(size <= limits[kind], `${kind} exceeds the homepage payload budget`);
}
