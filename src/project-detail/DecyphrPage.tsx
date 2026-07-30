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

type WorkflowNode = "web" | "source" | "dub" | "poll" | "retrieve" | "lip-sync" | "deliver";
const WORKFLOW: WorkflowNode[] = ["web", "source", "dub", "poll", "retrieve", "lip-sync", "deliver"];
const RETRY_WORKFLOW: WorkflowNode[] = ["web", "source", "dub", "poll", "dub", "poll", "retrieve", "lip-sync", "deliver"];

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
  const completed = new Set(sequence.slice(0, activeStep));
  const workflowComplete = activeStep === sequence.length - 1;
  const retrying = sequence === RETRY_WORKFLOW && activeStep >= 4 && activeStep <= 5;
  const nodes: { id: WorkflowNode; label: string; detail: string; x: number; y: number; width: number }[] = [
    { id: "web", label: "WEB APP", detail: "upload + status", x: 18, y: 116, width: 140 },
    { id: "source", label: "S3 SOURCE", detail: "durable media", x: 190, y: 116, width: 120 },
    { id: "dub", label: "DUB", detail: "Lambda", x: 352, y: 96, width: 104 },
    { id: "poll", label: "POLL", detail: "wait + retry", x: 480, y: 96, width: 104 },
    { id: "retrieve", label: "RETRIEVE", detail: "translated audio", x: 608, y: 96, width: 112 },
    { id: "lip-sync", label: "LIP-SYNC", detail: "Lambda", x: 480, y: 194, width: 104 },
    { id: "deliver", label: "RESULT", detail: "S3 + web state", x: 824, y: 116, width: 148 },
  ];

  return (
    <div className="decyphr-system">
      <header>
        <span>one upload · one durable state machine</span>
        <div className="decyphr-workflow-actions">
          <button onClick={() => replay(false)} type="button">run clean</button>
          <button onClick={() => replay(true)} type="button">simulate retry</button>
        </div>
      </header>
      <div className="decyphr-workflow-canvas">
        <svg aria-label="Decyphr durable video localization workflow" role="img" viewBox="0 0 990 320">
          <defs>
            <marker id="decyphr-arrow" markerHeight="6" markerWidth="7" orient="auto" refX="6" refY="3">
              <path d="M0 0 L7 3 L0 6 Z" />
            </marker>
          </defs>
          <rect className="decyphr-machine-boundary" height="258" width="414" x="330" y="28" />
          <text className="decyphr-machine-label" x="352" y="55">AWS STEP FUNCTIONS · DURABLE JOB</text>
          <g className="decyphr-workflow-paths">
            <path d="M158 151 H190" />
            <path d="M310 151 H352" />
            <path d="M456 131 H480" />
            <path d="M584 131 H608" />
            <path d="M664 166 V216 H584" />
            <path d="M584 229 C700 229 714 151 824 151" />
            <path className="decyphr-retry-path" data-active={retrying} d="M532 96 C532 64 404 64 404 96" />
            <path className="decyphr-status-path" d="M898 186 V292 H88 V186" />
          </g>
          <text className="decyphr-status-label" x="412" y="307">status events return to the product</text>
          {nodes.map((node) => (
            <g
              className="decyphr-workflow-node"
              data-active={activeNode === node.id}
              data-complete={completed.has(node.id)}
              key={node.id}
              transform={`translate(${node.x} ${node.y})`}
            >
              <rect height="70" width={node.width} />
              <circle cx="16" cy="17" r="4" />
              <text className="decyphr-node-label" x="16" y="39">{node.label}</text>
              <text className="decyphr-node-detail" x="16" y="56">{node.detail}</text>
            </g>
          ))}
        </svg>
      </div>
      <ol className="decyphr-mobile-workflow" aria-label="Decyphr workflow states">
        {nodes.map((node) => (
          <li
            data-active={activeNode === node.id}
            data-complete={completed.has(node.id)}
            key={node.id}
          >
            <i />
            <span>
              <strong>{node.label}</strong>
              <small>{node.detail}</small>
            </span>
            <em>
              {activeNode === node.id
                ? workflowComplete
                  ? "done"
                  : retrying
                  ? "retrying"
                  : "running"
                : completed.has(node.id)
                  ? "done"
                  : "queued"}
            </em>
          </li>
        ))}
      </ol>
      <div className="decyphr-workflow-caption">
        <p aria-live="polite">
          {retrying
            ? "The job is still the same job: Step Functions waits, retries dubbing, and keeps web status current."
            : `${activeNode} · ${workflowComplete ? "workflow complete" : "state persisted"}`}
        </p>
        <span>product state</span><i /> <span>durable media work</span><b />
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
