import { marked } from "marked";
import type { ProjectDetail } from "../content/projects";

function renderDocumentBody(project: ProjectDetail): string {
  const tokens = marked.lexer(project.document);
  // The page header presents the document's title and summary once.
  if (tokens[0]?.type === "heading" && tokens[0].depth === 1) tokens.shift();
  while (tokens[0]?.type === "space") tokens.shift();
  const lead = tokens[0];
  if (lead?.type === "paragraph") {
    const text = lead.tokens?.map((token) => "text" in token ? token.text : token.raw).join("") ?? lead.text;
    if (text === project.summary) tokens.shift();
  }
  // Documents are reviewed, checked-in content, never visitor input. Markdown
  // renders at build time and does not add a parser or JavaScript to the page.
  return marked.parser(tokens);
}

export function ProjectPage({ project }: { project: ProjectDetail }) {
  return (
    <main className="project-page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <a href="/">Ezra Apple</a>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{project.name}</span>
      </nav>
      <article>
        <header className="project-header">
          <h1>{project.name}</h1>
          <p className="project-summary">{project.summary}</p>
          <p className="project-status">{project.status} · {project.category}</p>
          <nav className="project-links" aria-label={`${project.name} links`}>
            {project.links.map((link) => <a key={link.href} href={link.href}>{link.label}</a>)}
          </nav>
        </header>
        <div className="project-document" dangerouslySetInnerHTML={{ __html: renderDocumentBody(project) }} />
      </article>
      <footer className="project-footer"><a data-project-back="" href="/#projects">Back to projects</a></footer>
    </main>
  );
}
