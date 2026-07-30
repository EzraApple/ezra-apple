import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

type Language = "Arabic" | "French" | "Japanese" | "Spanish";

const LANGUAGE_KEY = "ezra-apple:decyphr-language";
const LANGUAGE_EVENT = "ezra-apple:decyphr-language-change";
const LANGUAGES: {
  dir?: "rtl";
  id: Language;
  lang: string;
  text: string;
}[] = [
  { id: "Spanish", lang: "es", text: "Un video puede llegar a más de una audiencia." },
  { id: "French", lang: "fr", text: "Une vidéo peut toucher plusieurs publics." },
  { id: "Japanese", lang: "ja", text: "一本の動画で、複数の視聴者に届けられます。" },
  { id: "Arabic", lang: "ar", dir: "rtl", text: "يمكن لفيديو واحد أن يصل إلى أكثر من جمهور." },
];

const PIPELINE = [
  "upload",
  "dub",
  "retrieve audio",
  "lip-sync",
  "deliver",
] as const;

function loadLanguage(): Language {
  if (typeof window === "undefined") return "Spanish";
  const saved = window.localStorage.getItem(LANGUAGE_KEY);
  return LANGUAGES.some((language) => language.id === saved)
    ? (saved as Language)
    : "Spanish";
}

function saveLanguage(language: Language) {
  window.localStorage.setItem(LANGUAGE_KEY, language);
  window.dispatchEvent(new CustomEvent(LANGUAGE_EVENT, { detail: language }));
}

function useLanguage() {
  const [language, setLanguage] = useState<Language>(loadLanguage);
  useEffect(() => {
    const onLanguage = (event: Event) =>
      setLanguage((event as CustomEvent<Language>).detail);
    window.addEventListener(LANGUAGE_EVENT, onLanguage);
    return () => window.removeEventListener(LANGUAGE_EVENT, onLanguage);
  }, []);
  return [language, saveLanguage] as const;
}

function LanguagePicker({ compact = false }: { compact?: boolean }) {
  const [language, setLanguage] = useLanguage();
  return (
    <div
      aria-label="Translation language"
      className="decyphr-language-picker"
      data-compact={compact}
      role="group"
    >
      {LANGUAGES.map((option) => (
        <button
          aria-pressed={language === option.id}
          key={option.id}
          onClick={() => setLanguage(option.id)}
          type="button"
        >
          {option.id}
        </button>
      ))}
    </div>
  );
}

function TranslationCard({
  state = "ready",
}: {
  state?: "processing" | "ready" | "source";
}) {
  const [language] = useLanguage();
  const selected = LANGUAGES.find((option) => option.id === language) ?? LANGUAGES[0];
  return (
    <div className="decyphr-translation-card">
      <div>
        <span>Original · English</span>
        <p>One video can speak to more than one audience.</p>
      </div>
      <i aria-hidden="true">↓</i>
      <div
        className="decyphr-translated"
        data-state={state}
        key={`${selected.id}-${state}`}
      >
        <span>{state === "ready" ? "Translated" : "Output"} · {selected.id}</span>
        {state === "ready" ? (
          <p dir={selected.dir} lang={selected.lang}>{selected.text}</p>
        ) : (
          <p>
            {state === "processing"
              ? "Preserving voice, timing, and delivery…"
              : "Choose a language, then localize the source."}
          </p>
        )}
      </div>
    </div>
  );
}

export function DecyphrScene() {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const [stage, setStage] = useState(shouldReduceMotion ? 2 : 0);

  useEffect(() => {
    if (shouldReduceMotion) {
      setStage(2);
      return;
    }
    const timer = window.setInterval(
      () => setStage((current) => Math.min(current + 1, 2)),
      720,
    );
    return () => window.clearInterval(timer);
  }, [shouldReduceMotion]);

  return (
    <div className="decyphr-scene">
      <header>
        <span>Product launch.mp4</span>
        <span className="decyphr-processing" data-ready={stage === 2}>
          <i /> {stage === 2 ? "Ready" : stage === 1 ? "Processing" : "Queued"}
        </span>
      </header>
      <div className="decyphr-video">
        <span className="decyphr-play">▶</span>
        <TranslationCard state={stage === 2 ? "ready" : stage === 1 ? "processing" : "source"} />
      </div>
      <LanguagePicker compact />
    </div>
  );
}

export function DecyphrExperience() {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const [language] = useLanguage();
  const [activeStep, setActiveStep] = useState(-1);
  const [status, setStatus] = useState("Choose a language, then localize the source.");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearInterval(timer.current), []);
  useEffect(() => {
    window.clearInterval(timer.current);
    setActiveStep(-1);
    setStatus("Choose a language, then localize the source.");
  }, [language]);

  const run = () => {
    window.clearInterval(timer.current);
    if (shouldReduceMotion) {
      setActiveStep(3);
      setStatus(`${language} version ready to publish.`);
      return;
    }
    setActiveStep(0);
    setStatus(`Localizing Product launch.mp4 into ${language}.`);
    let step = 0;
    timer.current = window.setInterval(() => {
      step += 1;
      setActiveStep(step);
      if (step >= 3) {
        window.clearInterval(timer.current);
        setStatus(`${language} version ready to publish.`);
      }
    }, 520);
  };

  return (
    <div className="decyphr-experience">
      <div className="decyphr-source">
        <header><span>source</span><strong>01:24</strong></header>
        <div className="decyphr-source-frame">
          <span>Product launch.mp4</span>
          <i>English · 1080p</i>
        </div>
        <TranslationCard
          state={activeStep === 3 ? "ready" : activeStep >= 0 ? "processing" : "source"}
        />
      </div>
      <div className="decyphr-job">
        <span>Target language</span>
        <LanguagePicker />
        <ol>
          {["Upload source", "Preserve voice", "Lip-sync result", "Ready"].map((step, index) => (
            <li data-active={index <= activeStep} key={step}>
              <i>{String(index + 1).padStart(2, "0")}</i>
              <strong>{step}</strong>
              <span>{index < activeStep || activeStep === 3 ? "done" : index === activeStep ? "running" : "queued"}</span>
            </li>
          ))}
        </ol>
        <p aria-live="polite">{status}</p>
        <button onClick={run} type="button">localize video</button>
      </div>
    </div>
  );
}

export function DecyphrSystem() {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const [activeStep, setActiveStep] = useState<number>(PIPELINE.length);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearInterval(timer.current), []);

  const replay = () => {
    window.clearInterval(timer.current);
    if (shouldReduceMotion) {
      setActiveStep(PIPELINE.length);
      return;
    }
    setActiveStep(0);
    let step = 0;
    timer.current = window.setInterval(() => {
      step = Math.min(step + 1, PIPELINE.length);
      setActiveStep(step);
      if (step >= PIPELINE.length) window.clearInterval(timer.current);
    }, 380);
  };

  return (
    <div className="decyphr-system">
      <header>
        <span>one upload · one durable job</span>
        <button onClick={replay} type="button">replay workflow</button>
      </header>
      <div className="decyphr-boundary">
        <span>product</span>
        <div className="decyphr-pipeline">
          {PIPELINE.map((step, index) => (
            <div data-active={index <= activeStep} key={step}>
              <i>{String(index + 1).padStart(2, "0")}</i>
              <strong>{step}</strong>
            </div>
          ))}
        </div>
        <p>
          Web state stayed visible while AWS Step Functions owned the
          long-running media work, retries, retrieval, and failure updates.
        </p>
      </div>
    </div>
  );
}

export function DecyphrOrigin() {
  const [language] = useLanguage();
  return (
    <div className="decyphr-origin">
      <div className="decyphr-origin-copy">
        <span>founder project</span>
        <h2>We built the complete loop before demand had earned the machinery.</h2>
        <p>
          I co-founded Decyphr, built the product end to end, and ran it through
          a small creator beta. The product worked: upload, orchestration,
          progress, delivery, usage, and failure handling. The sharper lesson
          was that infrastructure certainty is not product validation.
        </p>
        <LanguagePicker />
      </div>
      <div className="decyphr-receipt">
        <header><span>current direction</span><strong>{language}</strong></header>
        <TranslationCard />
        <dl>
          <div><dt>program</dt><dd>UC Berkeley SkyDeck Pad-13</dd></div>
          <div><dt>test</dt><dd>closed creator beta</dd></div>
          <div><dt>lesson</dt><dd>complexity must follow demand</dd></div>
          <div><dt>next</dt><dd>lighter public validation surface</dd></div>
        </dl>
      </div>
    </div>
  );
}
