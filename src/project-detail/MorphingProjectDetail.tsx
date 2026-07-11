import { AnimatePresence, m } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";

export type MorphSection<SectionId extends string> = {
  id: SectionId;
  label: string;
  description: string;
};

export function MorphingProjectDetail<SectionId extends string>({
  activeSection,
  highlightedSection,
  hero,
  onSectionChange,
  onSectionHighlight,
  renderSection,
  sections,
  shouldReduceMotion,
}: {
  activeSection: SectionId | null;
  highlightedSection: SectionId;
  hero: ReactNode;
  onSectionChange: (section: SectionId) => void;
  onSectionHighlight: (section: SectionId) => void;
  renderSection: (section: SectionId) => ReactNode;
  sections: MorphSection<SectionId>[];
  shouldReduceMotion: boolean;
}) {
  const moveEase = [0.645, 0.045, 0.355, 1] as const;
  const revealEase = [0.165, 0.84, 0.44, 1] as const;
  const isExploring = activeSection !== null;
  const [hideSupplemental, setHideSupplemental] = useState(isExploring);
  const [centerHeader, setCenterHeader] = useState(isExploring);

  useEffect(() => {
    if (!isExploring || shouldReduceMotion) {
      setHideSupplemental(isExploring);
      setCenterHeader(isExploring);
      return;
    }

    const hideTimer = window.setTimeout(() => setHideSupplemental(true), 440);
    const centerTimer = window.setTimeout(() => setCenterHeader(true), 560);
    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(centerTimer);
    };
  }, [isExploring, shouldReduceMotion]);

  return (
    <m.div className="detail-stage" layout>
      <m.div
        animate={{
          flexGrow: isExploring ? 0 : 1,
          opacity: isExploring ? 0 : 1,
        }}
        aria-hidden={isExploring || undefined}
        className="detail-hero-frame"
        initial={false}
        layout
        transition={{
          flexGrow: {
            delay: isExploring || shouldReduceMotion ? 0 : 0.14,
            duration: shouldReduceMotion ? 0 : isExploring ? 0.42 : 0.34,
            ease: moveEase,
          },
          opacity: {
            delay: isExploring || shouldReduceMotion ? 0 : 0.46,
            duration: shouldReduceMotion ? 0 : isExploring ? 0.09 : 0.18,
            ease: revealEase,
          },
        }}
      >
        {hero}
      </m.div>

      <m.nav
        aria-label="Explore project"
        className="detail-paths"
        data-header-centered={centerHeader}
        data-section-open={isExploring}
        layout
      >
        <AnimatePresence initial={false} mode="popLayout">
          {sections.filter((section) => !activeSection || section.id === activeSection).map((section) => {
            const index = sections.indexOf(section);
            return (
            <m.button
              data-highlighted={highlightedSection === section.id}
              animate={{
                height: isExploring ? 64 : 76,
                opacity: 1,
              }}
              exit={{
                opacity: 0,
                transition: { duration: shouldReduceMotion ? 0 : 0.08, ease: revealEase },
              }}
              initial={{ height: 0, opacity: 0 }}
              key={section.id}
              layout="position"
              onClick={() => onSectionChange(section.id)}
              onFocus={() => onSectionHighlight(section.id)}
              onMouseEnter={() => onSectionHighlight(section.id)}
              transition={{
                height: {
                  delay: !isExploring && !shouldReduceMotion ? 0.12 : 0,
                  duration: shouldReduceMotion ? 0 : isExploring ? 0.42 : 0.32,
                  ease: moveEase,
                },
                opacity: {
                  delay: shouldReduceMotion ? 0 : isExploring ? 0.34 : 0.12,
                  duration: shouldReduceMotion ? 0 : isExploring ? 0.12 : 0.16,
                  ease: revealEase,
                },
                layout: {
                  delay: !isExploring && !shouldReduceMotion ? 0.12 : 0,
                  duration: shouldReduceMotion ? 0 : isExploring ? 0.42 : 0.32,
                  ease: moveEase,
                },
              }}
              type="button"
            >
              <m.span layout="position">{String(index + 1).padStart(2, "0")}</m.span>
              <m.span className="detail-path-copy" layout>
                <strong>{section.label}</strong>
                <AnimatePresence initial={false}>
                  {!hideSupplemental ? (
                    <m.small
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      initial={{ opacity: 0 }}
                      transition={{ duration: shouldReduceMotion ? 0 : 0.1, ease: revealEase }}
                    >
                      {section.description}
                    </m.small>
                  ) : null}
                </AnimatePresence>
              </m.span>
              <AnimatePresence initial={false}>
                {!hideSupplemental ? (
                  <m.i
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    initial={{ opacity: 0 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.1, ease: revealEase }}
                  >→</m.i>
                ) : null}
              </AnimatePresence>
            </m.button>
            );
          })}
        </AnimatePresence>
      </m.nav>

      <m.div
        animate={{
          flexGrow: isExploring ? 1 : 0,
          opacity: isExploring ? 1 : 0,
        }}
        aria-hidden={!isExploring || undefined}
        className="detail-content-frame"
        initial={false}
        layout
        transition={{
          flexGrow: {
            delay: isExploring || shouldReduceMotion ? 0.12 : 0,
            duration: shouldReduceMotion ? 0 : 0.3,
            ease: moveEase,
          },
          opacity: {
            delay: isExploring || shouldReduceMotion ? 0.74 : 0,
            duration: shouldReduceMotion ? 0 : isExploring ? 0.18 : 0.12,
            ease: revealEase,
          },
        }}
      >
        <AnimatePresence initial={false} mode="wait">
          {activeSection ? (
            <m.div
              animate={{ opacity: 1 }}
              className="detail-content"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              key={activeSection}
              transition={{ duration: shouldReduceMotion ? 0 : 0.14 }}
            >
              {renderSection(activeSection)}
            </m.div>
          ) : null}
        </AnimatePresence>
      </m.div>
    </m.div>
  );
}
