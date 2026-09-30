export function StructuredAccess() {
  return (
    <ul className="project-list" aria-label="Machine-readable endpoints">
      <li>
        <a className="endpoint-url" href="/api"><code>/api</code></a>
        <span className="project-separator" aria-hidden="true"> / </span>{" "}
        <span className="item-description">
          Read my profile and project documents. Start here for the JSON API.
        </span>
      </li>
      <li>
        <a className="endpoint-url" href="/mcp"><code>/mcp</code></a>
        <span className="project-separator" aria-hidden="true"> / </span>{" "}
        <span className="item-description">
          Query the same material through your agent's MCP client.
        </span>
      </li>
    </ul>
  );
}
