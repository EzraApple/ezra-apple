import { afterEach, describe, expect, it, vi } from "vitest";
import app from "../worker/index";
import { maxMcpBodyBytes, type WorkerBindings } from "../worker/http";

const origin = "https://ezra.example";

function request(path: string, init?: RequestInit, env?: WorkerBindings) {
  return app.request(new Request(`${origin}${path}`, init), undefined, env);
}

function mcpBody() {
  return JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2025-03-26",
      capabilities: {},
      clientInfo: { name: "http-test", version: "1" },
    },
  });
}

afterEach(() => vi.unstubAllGlobals());

describe("Worker HTTP boundaries", () => {
  it("uses separate Cloudflare per-IP limiters and returns retry metadata", async () => {
    const apiLimit = { limit: vi.fn().mockResolvedValue({ success: false }) };
    const mcpLimit = { limit: vi.fn().mockResolvedValue({ success: false }) };
    const env = { API_RATE_LIMIT: apiLimit, MCP_RATE_LIMIT: mcpLimit };
    const headers = { "CF-Connecting-IP": "192.0.2.1" };

    for (const path of ["/api", "/mcp"]) {
      const response = await request(path, { headers }, env);
      expect(response.status).toBe(429);
      expect(response.headers.get("Retry-After")).toBe("60");
      expect(response.headers.get("Cache-Control")).toBe("no-store");
    }
    expect(apiLimit.limit).toHaveBeenCalledWith({ key: "192.0.2.1" });
    expect(mcpLimit.limit).toHaveBeenCalledWith({ key: "192.0.2.1" });

    // Local requests have no Cloudflare-provided IP and need no in-memory limiter.
    expect((await request("/api")).status).toBe(200);
    expect((await request("/api", { headers })).status).toBe(503);
    const failed = await request("/api", { headers }, { API_RATE_LIMIT: { limit: () => Promise.reject(new Error("failed")) } });
    expect(failed.status).toBe(503);
    expect(failed.headers.get("Cache-Control")).toBe("no-store");

    apiLimit.limit.mockResolvedValue({ success: true });
    expect((await request("/api", { headers }, env)).status).toBe(200);
    const calls = apiLimit.limit.mock.calls.length;
    expect((await request("/api", { method: "OPTIONS", headers }, env)).status).toBe(204);
    expect(apiLimit.limit).toHaveBeenCalledTimes(calls);
  });

  it("bounds MCP bodies by actual bytes without Content-Length", async () => {
    const oversized = new Request(`${origin}/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: `${mcpBody()}${" ".repeat(maxMcpBodyBytes)}`,
    });
    expect(oversized.headers.get("Content-Length")).toBeNull();
    const response = await app.request(oversized);
    expect(response.status).toBe(413);
    expect(response.headers.get("Cache-Control")).toBe("no-store");

    const lengthResponse = await request("/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": String(maxMcpBodyBytes + 1) },
      body: mcpBody(),
    });
    expect(lengthResponse.status).toBe(413);

    const batches = await request("/mcp", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: `[${mcpBody()}]`,
    });
    expect(batches.status).toBe(400);

    const malformed = await request("/mcp", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: "{" ,
    });
    expect(malformed.status).toBe(400);
    const wrongType = await request("/mcp", {
      method: "POST", headers: { "Content-Type": "text/plain" }, body: mcpBody(),
    });
    expect(wrongType.status).toBe(415);

    const invalidMessage = await request("/mcp", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
    });
    expect(invalidMessage.status).toBe(400);
    expect((await invalidMessage.json()).error.code).toBeDefined();

    const unsupportedProtocol = await request("/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json", "mcp-protocol-version": "1900-01-01" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }),
    });
    expect(unsupportedProtocol.status).toBe(404); // @hono/mcp's unsupported-version status.
    expect((await unsupportedProtocol.json()).error.message).toContain("Unsupported protocol version");

    const badAccept = await request("/mcp", {
      method: "POST", headers: { "Content-Type": "application/json", Accept: "image/png" }, body: mcpBody(),
    });
    expect(badAccept.status).toBe(406);

    const normal = await request("/mcp", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: mcpBody(),
    });
    expect(normal.status).toBe(200);
    expect(normal.headers.get("Content-Type")).toContain("application/json");
    expect(normal.headers.get("Cache-Control")).toBe("no-store");
    expect((await normal.json()).result.serverInfo.name).toBe("ezra-apple");
  });

  it("explains MCP methods and checks present Origin before preflight or POST", async () => {
    const get = await request("/mcp");
    expect(get.status).toBe(405);
    expect(get.headers.get("Allow")).toBe("POST, OPTIONS");
    expect((await get.json()).error).toContain("POST");

    const options = await request("/mcp", { method: "OPTIONS", headers: { Origin: origin } });
    expect(options.status).toBe(204);
    expect(options.headers.get("Access-Control-Allow-Origin")).toBe(origin);
    expect(options.headers.get("Access-Control-Allow-Methods")).toContain("POST");

    for (const rejectedOrigin of ["null", "https://evil.example", "https://evil.example/path", "not-a-url"]) {
      const rejected = await request("/mcp", { method: "OPTIONS", headers: { Origin: rejectedOrigin } });
      expect(rejected.status, rejectedOrigin).toBe(403);
      expect(rejected.headers.get("Access-Control-Allow-Origin")).toBeNull();
    }
    const rejectedPost = await request("/mcp", {
      method: "POST", headers: { Origin: "https://evil.example", "Content-Type": "application/json" }, body: mcpBody(),
    });
    expect(rejectedPost.status).toBe(403);

    const trusted = await request("/mcp", { method: "OPTIONS", headers: { Origin: "https://agent.example" } }, {
      MCP_TRUSTED_ORIGINS: "https://agent.example, https://another.example",
    });
    expect(trusted.status).toBe(204);
    expect(trusted.headers.get("Access-Control-Allow-Origin")).toBe("https://agent.example");
    expect((await request("/mcp", { method: "OPTIONS" })).status).toBe(204);
  });

  it("caches only successful public GETs with host and version isolation, then honors ETags", async () => {
    const entries = new Map<string, Response>();
    const cache = {
      match: vi.fn(async (key: Request) => entries.get(key.url)?.clone()),
      put: vi.fn(async (key: Request, response: Response) => { entries.set(key.url, response.clone()); }),
    };
    vi.stubGlobal("caches", { default: cache });
    const apiRate = { limit: vi.fn().mockResolvedValue({ success: true }) };
    const v1 = { WORKER_VERSION: { id: "deployment-one" }, API_RATE_LIMIT: apiRate };
    const cacheHeaders = { Origin: "https://other.example", "CF-Connecting-IP": "192.0.2.2" };
    const first = await request("/api?ignored=1", { headers: cacheHeaders }, v1);
    expect(first.status).toBe(200);
    expect(first.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(first.headers.get("Access-Control-Expose-Headers")).toContain("ETag");
    expect(first.headers.get("Cache-Status")).toBe("portfolio; fwd=uri-miss");
    expect(first.headers.get("Link")).toContain("/llms.txt");
    const etag = first.headers.get("ETag");
    expect(etag).toMatch(/^"[0-9a-f]{64}"$/);
    expect(cache.put).toHaveBeenCalledTimes(1);

    const same = await request("/api?ignored=2", { headers: cacheHeaders }, v1);
    expect(same.status).toBe(200);
    expect(same.headers.get("Cache-Status")).toBe("portfolio; hit");
    expect(same.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(cache.put).toHaveBeenCalledTimes(1);
    expect(apiRate.limit).toHaveBeenCalledTimes(2); // A cache hit still spends a rate-limit token.

    const conditional = await request("/api", { headers: { "If-None-Match": `W/${etag}` } }, v1);
    expect(conditional.status).toBe(304);
    expect(conditional.headers.get("Cache-Status")).toBe("portfolio; hit");
    expect(conditional.headers.get("ETag")).toBe(etag);
    expect(await conditional.text()).toBe("");

    await request("/api", undefined, { WORKER_VERSION: { id: "deployment-two" } });
    await app.request(new Request("https://other.example/api"), undefined, v1);
    expect(cache.put).toHaveBeenCalledTimes(3);
    expect([...entries.keys()]).toEqual(expect.arrayContaining([
      `${origin}/api?content-origin=https%3A%2F%2Fezra.example&content-version=deployment-one`,
      `${origin}/api?content-origin=https%3A%2F%2Fezra.example&content-version=deployment-two`,
      "https://other.example/api?content-origin=https%3A%2F%2Fother.example&content-version=deployment-one",
    ]));

    const unknown = await request("/api/no-such-route", undefined, v1);
    expect(unknown.status).toBe(404);
    expect(unknown.headers.get("Cache-Control")).toBe("no-store");
    expect(cache.put).toHaveBeenCalledTimes(3);
    const document = await request("/api/projects/shoutout/document", undefined, v1);
    expect(document.headers.get("Content-Type")).toContain("text/markdown");
    expect((await document.text()).length).toBeGreaterThan(100);

    const noVersion = await request("/api/profile");
    expect(noVersion.headers.get("Cache-Status")).toBe("portfolio; fwd=bypass");
    expect(cache.put).toHaveBeenCalledTimes(4); // Document was cached; no-version request was not.

    cache.match.mockRejectedValueOnce(new Error("cache unavailable"));
    const fallback = await request("/api/profile", undefined, v1);
    expect(fallback.status).toBe(200);
    expect(fallback.headers.get("Cache-Status")).toBe("portfolio; fwd=bypass");

    cache.put.mockRejectedValueOnce(new Error("cache write unavailable"));
    const writeFailure = await request("/llms.txt", undefined, { WORKER_VERSION: { id: "new-deployment" } });
    expect(writeFailure.status).toBe(200);
  });
});
