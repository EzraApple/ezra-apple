import { FaEnvelope, FaGithub, FaGlobe, FaLinkedin } from "react-icons/fa6";
import type { IconType } from "react-icons";
import { resume } from "../content/resume";
import formatting from "../content/resume.generated.json";

const contactIcons: Record<string, IconType> = {
  Website: FaGlobe, GitHub: FaGithub, LinkedIn: FaLinkedin, Email: FaEnvelope,
};
const emphasis = new Set(formatting.emphasis);
const emphasisPattern = new RegExp(`(${[...emphasis].sort((a, b) => b.length - a.length)
  .map((value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g");

function Highlights({ items }: { items: string[] }) {
  return <ul className="highlights">{items.map((item) => (
    <li key={item}>{item.split(emphasisPattern).map((part, index) =>
      emphasis.has(part) ? <strong key={index}>{part}</strong> : part,
    )}</li>
  ))}</ul>;
}

export function Resume() {
  return (
    <>
      <nav className="resume-actions" aria-label="Résumé navigation">
        <a href="/">Back to site</a>
        <a href="/resume.pdf" download="Ezra-Apple-Resume.pdf">Download PDF</a>
      </nav>
      <main className="resume-sheet">
        <header className="resume-header">
          <h1>{resume.name}</h1>
          <p>{resume.headline}</p>
          <ul className="resume-contacts" aria-label="Contact links">
            {resume.links.map(({ label, href }) => {
              const Icon = contactIcons[label];
              const text = label === "Email" ? href.replace(/^mailto:/, "")
                : label === "Website" ? new URL(href).hostname : label;
              return <li key={href}><a href={href}>
                {Icon && <Icon aria-hidden="true" />}<span>{text}</span>
              </a></li>;
            })}
          </ul>
        </header>
        <section aria-labelledby="education-title">
          <h2 id="education-title">Education</h2>
          {resume.education.map((entry) => <article key={entry.institution}>
            <div className="entry-heading"><h3>{entry.institution}</h3><span className="entry-date">{entry.date}</span></div>
            <p className="degree">{entry.degree}</p>
          </article>)}
        </section>
        <section aria-labelledby="experience-title">
          <h2 id="experience-title">Experience</h2>
          {resume.experience.map((entry) => <article key={entry.organization}>
            <div className="entry-heading">
              <h3>{entry.href ? <a href={entry.href}>{entry.organization}</a> : entry.organization}<span className="role"><span aria-hidden="true"> | </span>{entry.role}</span></h3>
              <span className="entry-date">{entry.dates}</span>
            </div>
            <Highlights items={entry.highlights} />
          </article>)}
        </section>
        <section aria-labelledby="resume-projects-title">
          <h2 id="resume-projects-title">Projects</h2>
          {resume.projects.map((entry) => <article key={entry.name}>
            <h3>{entry.href ? <a href={entry.href}>{entry.name}</a> : entry.name}<span className="role"><span aria-hidden="true"> | </span>{entry.description}</span></h3>
            <Highlights items={entry.highlights} />
          </article>)}
        </section>
        <section aria-labelledby="skills-title">
          <h2 id="skills-title">Skills</h2>
          <dl className="resume-skills">{resume.skills.map((group) => <div key={group.category}>
            <dt>{group.category}:</dt>{" "}<dd>{group.items.join(", ")}</dd>
          </div>)}</dl>
        </section>
      </main>
    </>
  );
}
