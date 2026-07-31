import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties } from "react";

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

type WorkflowNode = "web" | "source" | "dub" | "poll" | "retrieve" | "lip-sync" | "deliver";
const WORKFLOW: WorkflowNode[] = ["web", "source", "dub", "poll", "retrieve", "lip-sync", "deliver"];
const RETRY_WORKFLOW: WorkflowNode[] = ["web", "source", "dub", "poll", "dub", "poll", "retrieve", "lip-sync", "deliver"];
const WORKFLOW_META: Record<WorkflowNode, { detail: string; label: string; type: string }> = {
  web: { detail: "project + content rows", label: "Create project", type: "PRODUCT" },
  source: { detail: "object-created trigger", label: "Upload source to S3", type: "EVENT" },
  dub: { detail: "ElevenLabs job", label: "StartDubbingJob", type: "LAMBDA" },
  poll: { detail: "30 s durable wait", label: "CheckDubbingStatus", type: "WAIT" },
  retrieve: { detail: "audio into durable storage", label: "RetrieveDubbedAudio", type: "LAMBDA" },
  "lip-sync": { detail: "Sync Labs job + polling", label: "StartLipSyncJob", type: "LAMBDA" },
  deliver: { detail: "video + database status", label: "RetrieveLipsyncedVideo", type: "RESULT" },
};

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
  const [language, setLanguage] = useLanguage();
  const [sequence, setSequence] = useState<WorkflowNode[]>(WORKFLOW);
  const [activeStep, setActiveStep] = useState<number>(WORKFLOW.length - 1);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearInterval(timer.current), []);

  const replay = (withRetry = false) => {
    const nextSequence = withRetry ? RETRY_WORKFLOW : WORKFLOW;
    window.clearInterval(timer.current);
    setSequence(nextSequence);
    if (shouldReduceMotion) {
      setActiveStep(nextSequence.length - 1);
      return;
    }
    setActiveStep(0);
    let step = 0;
    timer.current = window.setInterval(() => {
      step = Math.min(step + 1, nextSequence.length - 1);
      setActiveStep(step);
      if (step >= nextSequence.length - 1) window.clearInterval(timer.current);
    }, 430);
  };

  const activeNode = sequence[activeStep];
  const workflowComplete = activeStep === sequence.length - 1;
  const retrying = sequence === RETRY_WORKFLOW && activeStep >= 4 && activeStep <= 5;
  const retryCount = sequence
    .slice(0, activeStep + 1)
    .filter((node) => node === "dub").length - 1;
  const progress = Math.round(((activeStep + 1) / sequence.length) * 100);

  return (
    <div className="decyphr-system">
      <header>
        <span>execution / Product-launch.mp4</span>
        <strong data-complete={workflowComplete}>
          <i /> {workflowComplete ? "SUCCEEDED" : retrying ? "RETRYING" : "RUNNING"}
        </strong>
        <div className="decyphr-workflow-actions">
          <button onClick={() => replay(false)} type="button">run clean</button>
          <button onClick={() => replay(true)} type="button">simulate retry</button>
        </div>
      </header>
      <div className="decyphr-execution-body">
        <section className="decyphr-execution-trace">
          <div className="decyphr-trace-heading">
            <span>AWS STEP FUNCTIONS</span>
            <strong>{String(activeStep + 1).padStart(2, "0")} / {String(sequence.length).padStart(2, "0")}</strong>
          </div>
          <ol aria-label="Decyphr state machine execution">
            {sequence.map((node, index) => {
              const state = index < activeStep ? "complete" : index === activeStep ? "active" : "queued";
              const attempt = node === "dub" || node === "poll"
                ? sequence.slice(0, index + 1).filter((item) => item === "dub").length
                : 0;
              return (
                <li data-state={state} key={`${node}-${index}`}>
                  <i />
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <strong>{WORKFLOW_META[node].label}</strong>
                    <small>{WORKFLOW_META[node].detail}</small>
                  </div>
                  <em>{attempt > 1 ? `TRY ${attempt}` : WORKFLOW_META[node].type}</em>
                </li>
              );
            })}
          </ol>
        </section>
        <aside className="decyphr-execution-inspector">
          <div className="decyphr-language-heading">
            <span>LANGUAGE EXECUTIONS</span>
            <strong>{LANGUAGES.length} PARALLEL</strong>
          </div>
          <div className="decyphr-language-runs">
            {LANGUAGES.map((option) => (
              <button
                aria-pressed={language === option.id}
                key={option.id}
                onClick={() => setLanguage(option.id)}
                type="button"
              >
                <span><i /> {option.id}</span>
                <em>{workflowComplete ? "ready" : retrying ? "retrying" : `${progress}%`}</em>
                <b style={{ "--decyphr-progress": `${progress}%` } as CSSProperties} />
              </button>
            ))}
          </div>
          <dl className="decyphr-execution-input">
            <div><dt>project type</dt><dd>VIDEO_TRANSLATION</dd></div>
            <div><dt>language</dt><dd>{LANGUAGES.find((item) => item.id === language)?.lang ?? "es"}</dd></div>
            <div><dt>dubbing retry</dt><dd>{Math.max(0, retryCount)} / 3</dd></div>
            <div><dt>status source</dt><dd>Postgres</dd></div>
          </dl>
        </aside>
      </div>
      <div className="decyphr-workflow-caption">
        <p aria-live="polite">
          {retrying
            ? "Attempt 02 stays inside the same execution; the durable wait resumes without restarting the product job."
            : workflowComplete
              ? `${language} output persisted · product status is ready`
              : `${WORKFLOW_META[activeNode].label} · state persisted`}
        </p>
        <span>web app polls every 5 s</span><i /> <span>database remains product truth</span><b />
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
