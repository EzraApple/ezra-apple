import { spawn, execSync, type ChildProcess } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { profile } from "../content/profile";
import { resume, ResumeSchema } from "../content/resume";
import { writing } from "../content/writing";
import { shareDescription, siteOrigin } from "../content/site";
import { getHomepageContent } from "../content/homepage";
import { getProjectDetail, listProjectSummaries } from "../content/projects";

// The three public surfaces (site, JSON API, MCP) must serve the same
// curated content. These tests boot the built worker and compare every
// surface against the content modules as the single source of truth.

const PORT = Number(process.env.TEST_PORT ?? 4199);
const BASE = `http://127.0.0.1:${PORT}`;
let server: ChildProcess;
let serverLog = "";

async function waitForServer(timeoutMs = 60_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${BASE}/api`);
      if (response.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`preview server did not become ready. output:\n${serverLog}`);
}

let mcpRequestId = 0;

async function mcp(method: string, params: unknown): Promise<any> {
  const response = await fetch(`${BASE}/mcp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: ++mcpRequestId,
      method,
      params,
    }),
  });
  expect(response.headers.get("content-type")).toContain("application/json");
  return response.json();
}

async function mcpTool(name: string, args: Record<string, unknown> = {}) {
  const message = await mcp("tools/call", { name, arguments: args });
  expect(message.result?.content?.[0]?.type).toBe("text");
  return JSON.parse(message.result.content[0].text);
}

beforeAll(async () => {
  // Always rebuild: testing a stale dist against fresh content modules
  // produces false mismatches (and could mask real ones).
  const productionEnv = { ...process.env, NODE_ENV: "production" };
  execSync("npm run build", { stdio: "inherit", env: productionEnv });
  server = spawn(
    process.execPath,
    [
      "node_modules/vite/bin/vite.js",
      "preview",
      "--host",
      "127.0.0.1",
      "--port",
      String(PORT),
      "--strictPort",
    ],
    { stdio: ["ignore", "pipe", "pipe"], env: productionEnv },
  );
  server.stdout?.on("data", (chunk) => (serverLog += chunk));
  server.stderr?.on("data", (chunk) => (serverLog += chunk));
  await waitForServer();
}, 120_000);

afterAll(() => {
  server?.kill("SIGTERM");
});

describe("content source", () => {
  it("authors a valid catalog", () => {
    const summaries = listProjectSummaries();
    expect(summaries.length).toBeGreaterThan(0);
    const slugs = summaries.map((project) => project.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const summary of summaries) {
      const detail = getProjectDetail(summary.slug);
      expect(detail, `detail for ${summary.slug}`).toBeDefined();
    }
  });
});

describe("site", () => {
  it("preloads the body font and only gives versioned assets immutable caching", async () => {
    const html = await (await fetch(BASE)).text();
    const preload = html.match(/<link\b[^>]*rel="preload"[^>]*>/)?.[0];
    expect(preload).toContain('as="font"');
    expect(preload).toContain('type="font/woff2"');
    expect(preload).toContain("crossorigin");
    const fontPath = preload?.match(/href="([^"]+)"/)?.[1];
    expect(fontPath).toMatch(/^\/assets\/ibm-plex-mono-latin-400-normal-.+\.woff2$/);
    const cssPath = html.match(/href="([^"]+\.css)"/)?.[1];
    expect(cssPath).toBeDefined();
    const css = await (await fetch(`${BASE}${cssPath}`)).text();
    expect(css).toContain(fontPath);
    for (const path of [fontPath, cssPath]) {
      const response = await fetch(`${BASE}${path}`);
      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
    }
    for (const path of ["/", "/resume", "/resume.pdf", "/og.png", "/api/profile"]) {
      const response = await fetch(`${BASE}${path}`);
      expect(response.status, path).toBe(200);
      expect(response.headers.get("cache-control"), path).not.toContain("immutable");
    }
  });

  it("serves the app shell at / and for deep links", async () => {
    for (const path of [
      "/",
      "/projects/shoutout",
      "/projects/shoutout/experience",
    ]) {
      const response = await fetch(`${BASE}${path}`);
      expect(response.status, path).toBe(200);
      const html = await response.text();
      expect(html, path).toContain('id="root"');
    }
  });

  it("serves the complete homepage without client JavaScript", async () => {
    const html = await (await fetch(BASE)).text();
    const rootMarkup = html
      .split('<div id="root">')[1]
      ?.split("</body>")[0];
    expect(rootMarkup).toBeDefined();
    expect(rootMarkup).toContain(`<h1>${profile.name}</h1>`);
    expect(rootMarkup).toContain(`<p class="bio">${profile.headline}</p>`);
    expect(rootMarkup).not.toContain("Decyphr");
    expect(html.replace(/\s+/g, " ")).toContain(
      `property="og:description" content="${shareDescription}"`,
    );
    expect(html.split("</head>")[0]).not.toContain("Decyphr");
    if (writing.length === 0)
      expect(rootMarkup).not.toContain('id="writing-title"');
    for (const essay of writing) {
      expect(rootMarkup).toContain(`href="${essay.href}"`);
      expect(rootMarkup).toContain(essay.title);
      expect(rootMarkup).toContain(essay.description);
    }
    expect(rootMarkup).not.toContain("llms.txt");

    for (const project of getHomepageContent().projects) {
      expect(rootMarkup).toContain(`>${project.label}</${project.links[0] ? "a" : "span"}>`);
      if (project.links[0]) expect(rootMarkup).toContain(`href="${project.links[0].href}"`);
      expect(rootMarkup).toContain(project.summary);
    }

    const speculation = [...html.matchAll(/<script type="speculationrules">([\s\S]*?)<\/script>/g)];
    expect(speculation).toHaveLength(1);
    expect(JSON.parse(speculation[0][1])).toEqual({
      prefetch: [{ where: { href_matches: "/resume/" }, eagerness: "moderate" }],
    });
    expect(html.replace(speculation[0][0], "")).not.toMatch(/<script\b/i);
    expect(html).not.toContain("homepage-data");
    expect(html).not.toContain("__SITE_ORIGIN__");
    expect(html).toContain(`content="${siteOrigin}/og.png"`);
    expect(rootMarkup).toContain('href="/api"><code>/api</code>');
    expect(rootMarkup).toContain('href="/mcp"><code>/mcp</code>');
    const resumeLink = rootMarkup?.match(/<a\b[^>]*href="\/resume\/"[^>]*>/)?.[0];
    expect(resumeLink).toBeDefined();
    expect(resumeLink).toContain('aria-label="Résumé"');
    expect(resumeLink).not.toContain('target=');
    expect(resumeLink).not.toContain('opens in a new tab');
    expect(resumeLink).not.toContain("application/pdf");

  });

  it("serves the complete HTML résumé as a distinct static page", async () => {
    const response = await fetch(`${BASE}/resume/`, { redirect: "manual" });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    const html = await response.text();
    const visibleText = html.replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'");
    expect(html).toContain(`<title>${resume.name}`);
    expect(html).toContain(`href="${siteOrigin}/resume/"`);
    for (const section of ["Education", "Experience", "Projects", "Skills"])
      expect(html).toContain(`>${section}</h2>`);
    expect(visibleText).toContain(resume.headline);
    expect(visibleText).toContain(resume.education[0].institution);
    expect(visibleText).toContain(resume.experience[0].organization);
    expect(visibleText).toContain(resume.projects[0].name);
    expect(html).toContain('href="/resume.pdf"');
    expect(html).not.toContain("Code and agents");
    expect(html).not.toMatch(/<script\b/i);

    const highlights = [
      ...resume.experience.flatMap((entry) => entry.highlights),
      ...resume.projects.flatMap((entry) => entry.highlights),
    ];
    expect(highlights).toHaveLength(14);
    for (const highlight of highlights) expect(visibleText).toContain(highlight);
  });

  it("keeps Decyphr's history without advertising its expired domain", async () => {
    for (const path of ["/resume", "/api/projects", "/api/projects/decyphr", "/llms.txt"]) {
      const response = await fetch(`${BASE}${path}`);
      expect(response.status, path).toBe(200);
      const body = await response.text();
      expect(body, path).toContain("Decyphr");
      expect(body, path).not.toContain("decyphr.ai");
    }
  });
});

describe("api", () => {
  it("indexes its own endpoints", async () => {
    const index = await (await fetch(`${BASE}/api`)).json();
    expect(index.endpoints.profile).toBe(`${BASE}/api/profile`);
    expect(index.endpoints.resume).toBe(`${BASE}/api/resume`);
    expect(index.endpoints.writing).toBe(`${BASE}/api/writing`);
    expect(index.endpoints.projects).toBe(`${BASE}/api/projects`);
    expect(index.endpoints.mcp).toBe(`${BASE}/mcp`);
  });

  it("serves the authored profile", async () => {
    const body = await (await fetch(`${BASE}/api/profile`)).json();
    expect(body.data).toEqual(profile);
    expect(profile.links.find((link) => link.label === "Résumé")?.href).toBe(profile.resume.pageUrl);
    expect(profile.resume.pdfUrl).toBe(resume.pdfUrl);
    expect(profile.resume.structuredUrl).toBe(`${siteOrigin}/api/resume`);
  });

  it("serves the validated résumé and rejects writes", async () => {
    const response = await fetch(`${BASE}/api/resume`);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toEqual(resume);
    expect(ResumeSchema.parse(body.data)).toEqual(resume);
    expect(body.meta).toEqual({ schemaVersion: 2, source: "curated" });

    const wrongMethod = await fetch(`${BASE}/api/resume`, { method: "POST" });
    expect(wrongMethod.status).toBe(405);
    expect(wrongMethod.headers.get("allow")).toContain("GET");
    expect((await wrongMethod.json()).error).toContain("GET");
  });

  it("links the résumé to the exact served PDF", async () => {
    const expectedHash = createHash("sha256")
      .update(await readFile("public/resume.pdf"))
      .digest("hex");
    expect(resume.pdfSha256).toBe(expectedHash);
    const served = await fetch(`${BASE}${new URL(resume.pdfUrl).pathname}`);
    expect(served.status).toBe(200);
    expect(served.headers.get("content-type")).toContain("application/pdf");
    expect(createHash("sha256").update(Buffer.from(await served.arrayBuffer())).digest("hex"))
      .toBe(expectedHash);
  });

  it("serves the authored catalog in order", async () => {
    const body = await (await fetch(`${BASE}/api/projects`)).json();
    expect(body.data.map((project: any) => project.slug)).toEqual(
      listProjectSummaries().map((project) => project.slug),
    );
    expect(body.meta.count).toBe(listProjectSummaries().length);
  });

  it("keeps homepage writing, profile, API, MCP, and agent discovery aligned", async () => {
    const response = await fetch(`${BASE}/api/writing`);
    expect(response.status).toBe(200);
    expect(response.headers.get("etag")).toBeTruthy();
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    expect(response.headers.get("link")).toContain("/llms.txt");
    const body = await response.json();
    expect(body).toEqual({ data: writing, meta: { schemaVersion: 2, source: "curated", count: writing.length } });
    expect(getHomepageContent().writing).toEqual(body.data);
    expect((await (await fetch(`${BASE}/api/profile`)).json()).data.writing).toEqual(body.data);
    expect((await mcpTool("get_profile")).writing).toEqual(body.data);
    expect((await mcpTool("list_writing")).writing).toEqual(body.data);
    const guide = await (await fetch(`${BASE}/llms.txt`)).text();
    expect(guide).toContain(`${BASE}/api/writing`);
    expect(guide).toContain("list_writing");
    for (const entry of writing) {
      expect(guide).toContain(entry.title);
      expect(guide).toContain(entry.href);
      expect(guide).toContain(entry.publication);
      const search = await mcpTool("search_work", { query: entry.title });
      expect(search.writingResults).toContainEqual({ ...entry, matchedTerms: [...new Set(entry.title.toLowerCase().split(/\s+/))] });
    }
    const cached = await fetch(`${BASE}/api/writing`, { headers: { "If-None-Match": response.headers.get("etag")! } });
    expect(cached.status).toBe(304);
    const write = await fetch(`${BASE}/api/writing`, { method: "POST" });
    expect(write.status).toBe(405);
    expect(write.headers.get("allow")).toContain("GET");
  });

  it("serves every project detail", async () => {
    for (const summary of listProjectSummaries()) {
      const body = await (
        await fetch(`${BASE}/api/projects/${summary.slug}`)
      ).json();
      expect(body.data).toEqual(getProjectDetail(summary.slug));
    }
  });

  it("answers unknown paths in JSON", async () => {
    const missing = await fetch(`${BASE}/api/projects/not-a-project`);
    expect(missing.status).toBe(404);
    expect((await missing.json()).error).toBeDefined();

    const bogus = await fetch(`${BASE}/api/definitely-not-real`);
    expect(bogus.status).toBe(404);
    expect((await bogus.json()).error).toBeDefined();
  });
});

describe("agent discovery", () => {
  it("serves a plain-text guide to the live structured endpoints", async () => {
    const response = await fetch(`${BASE}/llms.txt`);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toMatch(/^text\/plain/);

    const guide = await response.text();
    expect(guide).toContain(`# ${profile.name}`);
    expect(guide).toContain(profile.headline);
    for (const endpoint of [
      `${BASE}/api`,
      `${BASE}/api/profile`,
      `${BASE}/api/resume`,
      `${BASE}/api/projects`,
      `${BASE}/mcp`,
    ]) {
      expect(guide).toContain(`](${endpoint})`);
    }
    for (const project of listProjectSummaries()) {
      expect(guide).toContain(
        `[${project.name}](${BASE}/api/projects/${project.slug}/document): ${project.summary}`,
      );
    }
  });

  it("advertises the guide from the API", async () => {
    for (const path of ["/api", "/api/profile", "/api/resume", "/api/projects"]) {
      const response = await fetch(`${BASE}${path}`);
      expect(response.headers.get("link"), path).toContain(
        '</llms.txt>; rel="describedby"; type="text/plain"',
      );
    }
  });

  it("advertises the guide from the homepage document", async () => {
    const html = await (await fetch(BASE)).text();
    const links = html.match(/<link\b[^>]*>/g) ?? [];
    expect(
      links.some(
        (link) =>
          link.includes('rel="describedby"') &&
          link.includes('href="/llms.txt"'),
      ),
    ).toBe(true);
    expect(html).toContain('name="agent-access"');
    expect(html).toContain('<aside hidden id="agent-access">');
    expect(html).toContain('<a href="/api">JSON API endpoint index</a>');
    expect(html).toContain('<a href="/mcp">MCP endpoint (Streamable HTTP)</a>');
    expect(html).toContain('href="/api" type="application/json"');
  });
});

describe("HTTP integration", () => {
  it("enforces the Worker origin policy and makes MCP GET finite", async () => {
    const get = await fetch(`${BASE}/mcp`);
    expect(get.status).toBe(405);
    expect(get.headers.get("allow")).toContain("POST");
    const browser = await fetch(`${BASE}/mcp`, { headers: { Accept: "text/html,application/xhtml+xml,*/*;q=0.8" } });
    expect(browser.status).toBe(200);
    expect(browser.headers.get("content-type")).toContain("text/plain");
    expect(browser.headers.get("cache-control")).toBe("no-store");
    expect(await browser.text()).toContain(`Connect your MCP client to:\n${BASE}/mcp`);
    const stream = await fetch(`${BASE}/mcp`, { headers: { Accept: "text/event-stream" } });
    expect(stream.status).toBe(405);
    for (const method of ["OPTIONS", "POST"]) {
      const untrusted = await fetch(`${BASE}/mcp`, {
        method, headers: { Origin: "https://untrusted.example" },
      });
      expect(untrusted.status).toBe(403);
    }
    const allowed = await fetch(`${BASE}/mcp`, { method: "OPTIONS", headers: { Origin: BASE } });
    expect(allowed.status).toBe(204);
    expect(allowed.headers.get("access-control-allow-origin")).toBe(BASE);
  });

  it("revalidates the served project document with ETags", async () => {
    const path = `${BASE}/api/projects/shoutout/document`;
    const first = await fetch(path);
    const etag = first.headers.get("etag");
    expect(etag).toBeTruthy();
    const unchanged = await fetch(path, { headers: { "If-None-Match": etag! } });
    expect(unchanged.status).toBe(304);
    expect(await unchanged.text()).toBe("");
  });
});

describe("mcp", () => {
  it("initializes and lists the expected tools", async () => {
    const init = await mcp("initialize", {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "ci", version: "1.0" },
    });
    expect(init.result.serverInfo.name).toBe("ezra-apple");

    const list = await mcp("tools/list", {});
    const names = list.result.tools.map((tool: any) => tool.name).sort();
    expect(names).toEqual([
      "get_profile",
      "get_project",
      "get_resume",
      "list_projects",
      "list_writing",
      "search_work",
    ]);
  });

  it("serves the same profile as the API and content", async () => {
    const result = await mcpTool("get_profile");
    expect(result.name).toBe(profile.name);
    expect(result.headline).toBe(profile.headline);
    expect(result.links).toEqual(profile.links);
  });

  it("serves the same validated résumé through MCP and the API", async () => {
    const result = await mcpTool("get_resume");
    const api = await (await fetch(`${BASE}/api/resume`)).json();
    expect(result).toEqual(resume);
    expect(result).toEqual(api.data);
    expect(ResumeSchema.parse(result)).toEqual(resume);
  });

  it("lists the same projects as the API, without theme or artifact", async () => {
    const result = await mcpTool("list_projects");
    expect(result.projects.map((project: any) => project.slug)).toEqual(
      listProjectSummaries().map((project) => project.slug),
    );
    for (const project of result.projects) {
      expect(project.theme).toBeUndefined();
      expect(project.artifact).toBeUndefined();
    }
  });

  it("serves identical complete project documents through API and MCP", async () => {
    for (const { slug } of listProjectSummaries()) {
      const full = await mcpTool("get_project", { slug });
      const api = await (await fetch(`${BASE}/api/projects/${slug}`)).json();
      const markdown = await (await fetch(`${BASE}/api/projects/${slug}/document`)).text();
      expect(full).toEqual(api.data);
      expect(full).toEqual(getProjectDetail(slug));
      expect(full.document).toBe(markdown);
      expect(full.document).toContain("## Evidence");
      expect(full).not.toHaveProperty("depth");
      expect(full).not.toHaveProperty("theme");
      expect(full).not.toHaveProperty("artifact");
    }
  });

  it("recovers helpfully from unknown slugs", async () => {
    const result = await mcpTool("get_project", { slug: "not-a-project" });
    expect(result.error).toBeDefined();
    expect(result.knownSlugs).toEqual(
      listProjectSummaries().map((project) => project.slug),
    );
  });

  it("finds projects by keyword", async () => {
    const result = await mcpTool("search_work", { query: "dictation" });
    expect(result.results.map((entry: any) => entry.slug)).toContain(
      "shoutout",
    );
  });
});
