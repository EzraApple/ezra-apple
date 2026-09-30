import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { describe, expect, it } from "vitest";
import { getProjectDetail, listProjectSummaries } from "../content/projects";
import { resume, ResumeSchema } from "../content/resume";
import { writing } from "../content/writing";
import app from "../worker/index";

const origin = "https://ezra.example";

function parseToolResult(result: Awaited<ReturnType<Client["callTool"]>>) {
  const text = result.content.find((part) => part.type === "text");
  expect(text?.type).toBe("text");
  const value = JSON.parse(text!.text);
  if (!result.isError) expect(result.structuredContent).toEqual(value);
  return value;
}

describe("MCP client", () => {
  it("connects through Streamable HTTP and calls every advertised tool", async () => {
    const transport = new StreamableHTTPClientTransport(new URL(`${origin}/mcp`), {
      fetch: (input, init) => app.request(new Request(input, init)),
    });
    const client = new Client({ name: "integration-test", version: "1.0.0" });

    try {
      await client.connect(transport);
      expect(client.getServerVersion()?.name).toBe("ezra-apple");
      expect(transport.sessionId).toBeUndefined();
      expect(client.getInstructions()).toContain("complete Markdown document");

      const index = await (await app.request(`${origin}/api`)).json();
      expect(index.access).toEqual({
        public: true,
        readOnly: true,
        authentication: "none",
      });
      expect(index.mcp.transport).toBe("streamable-http");
      expect(index.meta.schemaVersion).toBe(2);
      expect(index.endpoints.resume).toBe(`${origin}/api/resume`);

      const tools = await client.listTools();
      expect(tools.tools.map((tool) => tool.name)).toEqual(index.mcp.tools);
      for (const tool of tools.tools) {
        expect(tool.outputSchema).toBeDefined();
        expect(tool.annotations?.readOnlyHint).toBe(true);
        expect(tool.annotations?.openWorldHint).toBe(false);
      }

      const profile = await client.callTool({ name: "get_profile" });
      expect(profile.isError).not.toBe(true);
      expect(parseToolResult(profile).name).toBe("Ezra Apple");
      expect(parseToolResult(profile).writing).toEqual(writing);

      const writingResult = await client.callTool({ name: "list_writing" });
      expect(writingResult.isError).not.toBe(true);
      const apiWriting = await (await app.request(`${origin}/api/writing`)).json();
      expect(parseToolResult(writingResult).writing).toEqual(apiWriting.data);
      expect(apiWriting.data).toEqual(writing);
      const articleSearch = await client.callTool({ name: "search_work", arguments: { query: "infrastructure Replo" } });
      expect(parseToolResult(articleSearch).writingResults).toContainEqual({ ...writing[0], matchedTerms: ["infrastructure", "replo"] });

      const resumeTool = tools.tools.find((tool) => tool.name === "get_resume");
      expect(resumeTool?.outputSchema?.properties).toHaveProperty("experience");
      expect(resumeTool?.outputSchema?.properties).toHaveProperty("pdfSha256");
      const resumeResult = await client.callTool({ name: "get_resume" });
      expect(resumeResult.isError).not.toBe(true);
      const apiResume = await (await app.request(`${origin}/api/resume`)).json();
      expect(parseToolResult(resumeResult)).toEqual(apiResume.data);
      expect(ResumeSchema.parse(apiResume.data)).toEqual(resume);

      const projects = await client.callTool({ name: "list_projects" });
      const apiProjects = await (await app.request(`${origin}/api/projects`)).json();
      expect(parseToolResult(projects).projects).toEqual(apiProjects.data);

      const slug = listProjectSummaries()[0].slug;
      const project = await client.callTool({ name: "get_project", arguments: { slug } });
      expect(parseToolResult(project)).toEqual(getProjectDetail(slug));

      const search = await client.callTool({ name: "search_work", arguments: { query: "dictation" } });
      expect(parseToolResult(search).results.some((result: { slug: string }) => result.slug === "shoutout")).toBe(true);

      for (const name of ["get_project"]) {
        const missing = await client.callTool({ name, arguments: { slug: "not-a-project" } });
        expect(missing.isError).toBe(true);
        expect(parseToolResult(missing).knownSlugs).toEqual(
          listProjectSummaries().map((project) => project.slug),
        );
      }

      for (const arguments_ of [{ slug, depth: "decisions" }, { slug: "x".repeat(81) }, { slug: "../private" }]) {
        const invalid = await client.callTool({ name: "get_project", arguments: arguments_ });
        expect(invalid.isError).toBe(true);
      }
      for (const query of ["  ", "a", "x".repeat(201)]) {
        const invalid = await client.callTool({ name: "search_work", arguments: { query } });
        expect(invalid.isError).toBe(true);
      }
      const normalized = await client.callTool({ name: "search_work", arguments: { query: "  dictation  " } });
      expect(parseToolResult(normalized).query).toBe("dictation");
    } finally {
      await client.close();
    }
  });

  it("allows same-origin MCP preflights and advertises the guide", async () => {
    const response = await app.request(
      new Request(`${origin}/mcp`, {
        method: "OPTIONS",
        headers: {
          Origin: origin,
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": "Content-Type,mcp-protocol-version",
        },
      }),
    );
    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe(origin);
    expect(response.headers.get("access-control-allow-methods")).toContain("POST");
    expect(response.headers.get("access-control-allow-headers")).toContain("mcp-protocol-version");

    const guide = await (await app.request(`${origin}/llms.txt`)).text();
    expect(guide).toContain("No authentication is required.");
    expect(guide).toContain("get_project(slug)");
    expect(guide).toContain(`${origin}/api/resume`);
    expect(guide).toContain("get_resume");
    expect(guide).toContain(resume.pdfUrl);
  });
});
