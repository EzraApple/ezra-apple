import { FaGithub, FaLinkedinIn, FaXTwitter } from "react-icons/fa6";
import { LuFileText, LuMapPin } from "react-icons/lu";
import type { IconType } from "react-icons";
import type { HomepageContent } from "../content/homepage";
import { StructuredAccess } from "./StructuredAccess";

const SOCIAL_ICONS: Partial<Record<string, IconType>> = {
  GitHub: FaGithub,
  X: FaXTwitter,
  LinkedIn: FaLinkedinIn,
  Résumé: LuFileText,
};

export function App({ content }: { content: HomepageContent }) {
  const { headline, headlineLink } = content.profile;
  const linkStart = headline.indexOf(headlineLink.text);

  return (
    <>
      <a className="skip-link" href="#projects">
        Skip to projects
      </a>
      <main className="homepage">
        <header className="intro">
          <h1>{content.profile.name}</h1>
          <p className="bio">
            {headline.slice(0, linkStart)}
            <a href={headlineLink.href} aria-label={headlineLink.label}>
              {headlineLink.text}
            </a>
            {headline.slice(linkStart + headlineLink.text.length)}
          </p>
          <p className="location">
            <LuMapPin aria-hidden="true" />
            <span>Based in {content.profile.location}</span>
          </p>
          <nav className="social-links" aria-label="Find Ezra online">
            {content.profile.links.map(({ label, href }) => {
              const Icon = SOCIAL_ICONS[label];
              return (
                <a
                  key={label}
                  href={label === "Résumé" ? "/resume" : href}
                  aria-label={label === "Résumé" ? "Résumé (opens in a new tab)" : label}
                  title={label === "Résumé" ? "Résumé (opens in a new tab)" : undefined}
                  target={label === "Résumé" ? "_blank" : undefined}
                  rel={label === "Résumé" ? "noopener noreferrer" : "me"}
                  className={Icon ? undefined : "text-link"}
                >
                  {Icon ? <Icon aria-hidden="true" /> : label}
                </a>
              );
            })}
          </nav>
        </header>

        {content.writing.length > 0 && (
          <section className="writing" aria-labelledby="writing-title">
            <h2 id="writing-title">Writing</h2>
            <ul className="writing-list">
              {content.writing.map((essay) => (
                <li key={essay.href}>
                  <a href={essay.href}>{essay.title}</a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section id="projects" aria-labelledby="projects-title">
          <h2 id="projects-title">Projects</h2>
          <ul className="project-list">
            {content.projects.map((project) => (
              <li key={project.slug} id={project.slug}>
                <span className="project-name">
                  {project.links[0] ? (
                    <a href={project.links[0].href}>{project.label}</a>
                  ) : (
                    <span>{project.label}</span>
                  )}
                  <span className="project-separator" aria-hidden="true"> / </span>
                </span>{" "}
                <span className="item-description">{project.summary}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="access-title">
          <h2 id="access-title">Code and agents</h2>
          <StructuredAccess />
        </section>
      </main>
    </>
  );
}
