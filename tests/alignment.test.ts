import { spawn, execSync, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { profile } from "../content/profile";
import {
  getProjectDetail,
  listProjectSummaries,
} from "../content/projects";

// The three public surfaces (site, JSON API, MCP) must serve the same
// curated content. These tests boot the built worker and compare every
// surface against the content modules as the single source of truth.

const PORT = 4199;
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
  throw new Error(
    `preview server did not become ready. output:\n${serverLog}`,
  );
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
  const body = await response.text();
  const dataLine = body
    .split("\n")
    .find((line) => line.startsWith("data: "));
  if (!dataLine) throw new Error(`no SSE data in MCP response: ${body}`);
  return JSON.parse(dataLine.slice("data: ".length));
}

async function mcpTool(name: string, args: Record<string, unknown> = {}) {
  const message = await mcp("tools/call", { name, arguments: args });
  expect(message.result?.content?.[0]?.type).toBe("text");
  return JSON.parse(message.result.content[0].text);
}

beforeAll(async () => {
  if (!existsSync("dist")) {
    execSync("npm run build", { stdio: "inherit" });
  }
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
    { stdio: ["ignore", "pipe", "pipe"] },
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
      expect(detail?.links.length).toBeGreaterThan(0);
    }
  });
});

describe("site", () => {
  it("serves the app shell at / and for deep links", async () => {
    for (const path of ["/", "/projects/shoutout", "/projects/shoutout/experience"]) {
      const response = await fetch(`${BASE}${path}`);
      expect(response.status, path).toBe(200);
      const html = await response.text();
      expect(html, path).toContain('id="root"');
    }
  });
});

describe("api", () => {
  it("indexes its own endpoints", async () => {
    const index = await (await fetch(`${BASE}/api`)).json();
    expect(index.endpoints.profile).toBe(`${BASE}/api/profile`);
    expect(index.endpoints.projects).toBe(`${BASE}/api/projects`);
    expect(index.endpoints.mcp).toBe(`${BASE}/mcp`);
  });

  it("serves the authored profile", async () => {
    const body = await (await fetch(`${BASE}/api/profile`)).json();
    expect(body.data).toEqual(profile);
  });

  it("serves the authored catalog in order", async () => {
    const body = await (await fetch(`${BASE}/api/projects`)).json();
    expect(body.data.map((project: any) => project.slug)).toEqual(
      listProjectSummaries().map((project) => project.slug),
    );
    expect(body.meta.count).toBe(listProjectSummaries().length);
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
      "list_decisions",
      "list_projects",
      "search_work",
    ]);
  });

  it("serves the same profile as the API and content", async () => {
    const result = await mcpTool("get_profile");
    expect(result.name).toBe(profile.name);
    expect(result.headline).toBe(profile.headline);
    expect(result.links).toEqual(profile.links);
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

  it("serves full and depth-sliced project dossiers", async () => {
    const slug = listProjectSummaries()[0].slug;
    const detail = getProjectDetail(slug);

    const full = await mcpTool("get_project", { slug });
    expect(full.name).toBe(detail?.name);
    expect(Object.keys(full.depth).sort()).toEqual([
      "decisions",
      "experience",
      "proof",
      "system",
      "what",
    ]);

    const sliced = await mcpTool("get_project", { slug, depth: "decisions" });
    expect(Object.keys(sliced.depth)).toEqual(["decisions"]);
    expect(sliced.depth.decisions).toEqual(detail?.depth.decisions);
  });

  it("recovers helpfully from unknown slugs", async () => {
    const result = await mcpTool("get_project", { slug: "not-a-project" });
    expect(result.error).toBeDefined();
    expect(result.knownSlugs).toEqual(
      listProjectSummaries().map((project) => project.slug),
    );
  });

  it("aggregates decisions across all projects", async () => {
    const result = await mcpTool("list_decisions");
    const expected = listProjectSummaries().flatMap(
      (summary) => getProjectDetail(summary.slug)?.depth.decisions ?? [],
    );
    expect(result.decisions.length).toBe(expected.length);
  });

  it("finds projects by keyword", async () => {
    const result = await mcpTool("search_work", { query: "dictation" });
    expect(
      result.results.map((entry: any) => entry.slug),
    ).toContain("shoutout");
  });
});
