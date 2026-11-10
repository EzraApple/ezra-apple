export function StructuredAccess() {
  return (
    <ul className="project-list" aria-label="Machine-readable endpoints">
      <li>
        <a className="endpoint-url" href="/api"><code>/api</code></a>
        <span className="project-separator" aria-hidden="true"> / </span>{" "}
        <span className="item-description">
          Start here. GET this URL for all available routes.
        </span>
      </li>
      <li>
        <a className="endpoint-url" href="/mcp"><code>/mcp</code></a>
        <span className="project-separator" aria-hidden="true"> / </span>{" "}
        <span className="item-description">
          Connect an MCP client using Streamable HTTP. No authentication required.
        </span>
      </li>
    </ul>
  );
}
