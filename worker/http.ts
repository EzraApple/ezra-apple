import type { MiddlewareHandler } from "hono";

export interface WorkerBindings {
  API_RATE_LIMIT?: RateLimit;
  MCP_RATE_LIMIT?: RateLimit;
  WORKER_VERSION?: { id: string };
  MCP_TRUSTED_ORIGINS?: string;
}

export type WorkerEnvironment = { Bindings: WorkerBindings };

const cacheControl = "public, max-age=0, s-maxage=300";
const noStore = "no-store";
export const maxMcpBodyBytes = 32 * 1024;

function failure(status: number, message: string, headers?: HeadersInit): Response {
  return Response.json(
    { error: message },
    { status, headers: { "Cache-Control": noStore, ...headers } },
  );
}

/** Cloudflare supplies this header at the edge. Local requests omit it and skip limiting. */
export function rateLimit(bindingName: "API_RATE_LIMIT" | "MCP_RATE_LIMIT"): MiddlewareHandler<WorkerEnvironment> {
  return async (context, next) => {
    if (context.req.method === "OPTIONS") return next();
    const clientIp = context.req.header("CF-Connecting-IP");
    if (!clientIp) return next();

    const binding = context.env?.[bindingName];
    if (!binding) return failure(503, "Rate limiting is unavailable");
    let success: boolean;
    try {
      ({ success } = await binding.limit({ key: clientIp }));
    } catch {
      return failure(503, "Rate limiting is unavailable");
    }
    if (!success) {
      return failure(429, "Rate limit exceeded", { "Retry-After": "60" });
    }
    return next();
  };
}

function parseOrigin(value: string): string | undefined {
  try {
    const url = new URL(value);
    if (
      (url.protocol !== "https:" && url.protocol !== "http:") ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash ||
      value !== url.origin
    ) return undefined;
    return url.origin;
  } catch {
    return undefined;
  }
}

/** Missing Origin is valid for non-browser MCP clients. Present Origin is checked before CORS. */
export const mcpOrigin: MiddlewareHandler<WorkerEnvironment> = async (context, next) => {
  const suppliedOrigin = context.req.header("Origin");
  if (suppliedOrigin !== undefined) {
    const origin = parseOrigin(suppliedOrigin);
    const currentOrigin = new URL(context.req.url).origin;
    const trustedOrigins = (context.env?.MCP_TRUSTED_ORIGINS ?? "")
      .split(",")
      .map((value) => parseOrigin(value.trim()))
      .filter((value): value is string => value !== undefined);
    if (!origin || (origin !== currentOrigin && !trustedOrigins.includes(origin))) {
      return failure(403, "Origin is not allowed");
    }
  }

  await next();
  context.header("Cache-Control", noStore);
  if (suppliedOrigin !== undefined) {
    context.header("Access-Control-Allow-Origin", suppliedOrigin);
    context.header("Access-Control-Expose-Headers", "Retry-After");
    context.header("Vary", "Origin");
    if (context.req.method === "OPTIONS") {
      context.header("Access-Control-Allow-Methods", "POST, OPTIONS");
      context.header("Access-Control-Allow-Headers", "Content-Type, mcp-protocol-version");
      context.header("Access-Control-Max-Age", "600");
    }
  }
};

export async function readBoundedJson(request: Request): Promise<{ value?: unknown; error?: Response }> {
  if (!request.headers.get("Content-Type")?.includes("application/json")) {
    return { error: failure(415, "Content-Type must be application/json") };
  }
  const length = request.headers.get("Content-Length");
  if (length && Number(length) > maxMcpBodyBytes) {
    return { error: failure(413, "MCP request body exceeds 32 KiB") };
  }

  const reader = request.body?.getReader();
  if (!reader) return { error: failure(400, "Invalid JSON body") };
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxMcpBodyBytes) {
        await reader.cancel();
        return { error: failure(413, "MCP request body exceeds 32 KiB") };
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    const value: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    if (Array.isArray(value)) return { error: failure(400, "MCP batches are unavailable") };
    return { value };
  } catch {
    return { error: failure(400, "Invalid JSON body") };
  }
}

async function hash(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function matchesEtag(header: string | undefined, etag: string): boolean {
  return (header ?? "")
    .split(",")
    .some((candidate) => candidate.trim() === "*" || candidate.trim().replace(/^W\//, "") === etag);
}

function conditionalResponse(response: Response, ifNoneMatch?: string): Response {
  const etag = response.headers.get("ETag");
  if (etag && matchesEtag(ifNoneMatch, etag)) {
    const headers = new Headers(response.headers);
    headers.delete("Content-Length");
    return new Response(null, { status: 304, headers });
  }
  return response;
}

function withCacheStatus(response: Response, status: string): Response {
  const headers = new Headers(response.headers);
  headers.set("Cache-Status", status);
  return new Response(response.body, { status: response.status, headers });
}

/** Only named public GET routes use this middleware; query strings do not change their representation. */
export const publicGetCache: MiddlewareHandler<WorkerEnvironment> = async (context, next) => {
  if (context.req.method !== "GET") return next();
  const requestUrl = new URL(context.req.url);
  const version = context.env?.WORKER_VERSION?.id;
  // Local Vite can retain a synthetic Worker version across hot reloads.
  const localHost = ["localhost", "127.0.0.1", "[::1]"].includes(requestUrl.hostname);
  const cache = localHost || typeof caches === "undefined"
    ? undefined
    : (caches as CacheStorage & { default?: Cache }).default;
  const cacheUrl = new URL(requestUrl.origin + requestUrl.pathname);
  // Some Cloudflare cache configurations key URL components without the host.
  // Keep the normalized origin in the query as well because /api and /llms.txt contain absolute URLs.
  cacheUrl.searchParams.set("content-origin", requestUrl.origin);
  if (version) cacheUrl.searchParams.set("content-version", version);
  const key = new Request(cacheUrl.toString(), { method: "GET" });
  let cacheAvailable = Boolean(cache && version);

  if (cache && version) {
    try {
      const cached = await cache.match(key);
      if (cached) return withCacheStatus(conditionalResponse(cached, context.req.header("If-None-Match")), "portfolio; hit");
    } catch {
      // Cache unavailability must not make curated public data unavailable.
      cacheAvailable = false;
    }
  }

  await next();
  if (context.res.status !== 200) return;
  const body = await context.res.clone().text();
  const headers = new Headers(context.res.headers);
  headers.set("Cache-Control", cacheControl);
  headers.set("ETag", `"${await hash(body)}"`);
  const response = new Response(context.res.body, { status: 200, headers });
  context.res = withCacheStatus(
    conditionalResponse(response, context.req.header("If-None-Match")),
    cacheAvailable ? "portfolio; fwd=uri-miss" : "portfolio; fwd=bypass",
  );

  if (cache && cacheAvailable) {
    // Store the full representation, including ETag, even when this client got 304.
    try {
      await cache.put(key, new Response(body, { status: 200, headers }));
    } catch {
      // The cache is an optimization; a failure cannot change the response.
    }
  }
};
