import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type FormEvent } from "react";

type TerminalAccent = "amber" | "cyan" | "green" | "violet";
type TerminalLine = {
  kind: "assistant" | "meta" | "tool" | "user";
  text: string;
};

const ACCENT_KEY = "ezra-apple:leharness-accent";
const ACCENT_EVENT = "ezra-apple:leharness-accent-change";
const ACCENTS: TerminalAccent[] = ["amber", "cyan", "green", "violet"];

const SESSION_LINES: TerminalLine[] = [
  { kind: "user", text: "summarize this repo" },
  { kind: "assistant", text: "I’ll inspect the project boundary first." },
  { kind: "tool", text: "Read README.md · 4.2 kB" },
  { kind: "tool", text: "List packages · harness, mcp, cli, tui" },
  { kind: "assistant", text: "A small event-sourced loop with durable work around it." },
  { kind: "meta", text: "session projected from 12 events" },
];

const EVENTS = [
  "invocation.received",
  "step.started",
  "model.completed",
  "task.started",
  "artifact.created",
  "task.completed",
] as const;

const MILESTONES = [
  { date: "apr 15", label: "initial research" },
  { date: "apr 22", label: "event log design" },
  { date: "may 02", label: "MVP core harness" },
  { date: "may 28", label: "0.4.0 · MCP + TUI" },
  { date: "jun 10", label: "stable prompt input" },
] as const;

function loadAccent(): TerminalAccent {
  if (typeof window === "undefined") return "amber";
  const saved = window.localStorage.getItem(ACCENT_KEY);
  return ACCENTS.includes(saved as TerminalAccent)
    ? (saved as TerminalAccent)
    : "amber";
}

function saveAccent(accent: TerminalAccent) {
  window.localStorage.setItem(ACCENT_KEY, accent);
  window.dispatchEvent(new CustomEvent(ACCENT_EVENT, { detail: accent }));
}

function useTerminalAccent() {
  const [accent, setAccent] = useState<TerminalAccent>(loadAccent);

  useEffect(() => {
    const onAccent = (event: Event) =>
      setAccent((event as CustomEvent<TerminalAccent>).detail);
    window.addEventListener(ACCENT_EVENT, onAccent);
    return () => window.removeEventListener(ACCENT_EVENT, onAccent);
  }, []);

  return [accent, saveAccent] as const;
}

function TerminalLineView({ line }: { line: TerminalLine }) {
  const glyph = {
    assistant: "⏺",
    meta: "·",
    tool: "⎿",
    user: "❯",
  }[line.kind];

  return (
    <div className="lh-line" data-kind={line.kind}>
      <span>{glyph}</span>
      <p>{line.text}</p>
    </div>
  );
}

export function LeHarnessScene() {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const [accent] = useTerminalAccent();
  const [visibleLines, setVisibleLines] = useState(
    shouldReduceMotion ? SESSION_LINES.length : 1,
  );

  useEffect(() => {
    if (shouldReduceMotion) {
      setVisibleLines(SESSION_LINES.length);
      return;
    }
    const timer = window.setInterval(() => {
      setVisibleLines((current) =>
        current >= SESSION_LINES.length ? 1 : current + 1,
      );
    }, 900);
    return () => window.clearInterval(timer);
  }, [shouldReduceMotion]);

  return (
    <div className="lh-terminal lh-terminal-hero" data-accent={accent}>
      <header>
        <span>lh · main</span>
        <span className="lh-status">openai · high</span>
      </header>
      <div className="lh-transcript" aria-hidden="true">
        {SESSION_LINES.slice(0, visibleLines).map((line, index) => (
          <TerminalLineView key={`${line.kind}-${index}`} line={line} />
        ))}
      </div>
      <div className="lh-prompt" data-running={visibleLines > 1 && visibleLines < SESSION_LINES.length}>
        <span>❯</span>
        <span>{visibleLines === SESSION_LINES.length ? "ask anything" : "running…"}</span>
      </div>
    </div>
  );
}

export function LeHarnessExperience() {
  const [accent] = useTerminalAccent();
  const [input, setInput] = useState("");
  const [lines, setLines] = useState<TerminalLine[]>([
    { kind: "meta", text: "lh · session ready" },
  ]);
  const [running, setRunning] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const commands = ["/model", "/effort", "/mcp", "/help"];

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const prompt = input.trim();
    if (!prompt || running) return;
    setLines((current) => [...current, { kind: "user", text: prompt }]);
    setInput("");
    setRunning(true);
    timer.current = window.setTimeout(() => {
      setLines((current) => [
        ...current,
        { kind: "tool", text: "Read project context · completed" },
        {
          kind: "assistant",
          text: `I’d start “${prompt.slice(0, 42)}${prompt.length > 42 ? "…" : ""}” by making the loop and its evidence explicit.`,
        },
      ]);
      setRunning(false);
    }, 650);
  };

  const chooseCommand = (command: string) => {
    const message = {
      "/model": "model switched · openai/gpt-5",
      "/effort": "reasoning effort · high",
      "/mcp": "MCP servers · project configuration loaded",
      "/help": "commands · /model /effort /mcp /compact",
    }[command] ?? command;
    setLines((current) => [...current, { kind: "meta", text: message }]);
    setInput("");
  };

  return (
    <div className="lh-terminal lh-experience" data-accent={accent}>
      <header>
        <span>interactive session</span>
        <span>{running ? "running" : "ready"}</span>
      </header>
      <div className="lh-transcript">
        {lines.slice(-5).map((line, index) => (
          <TerminalLineView key={`${line.kind}-${index}-${line.text}`} line={line} />
        ))}
      </div>
      <span aria-live="polite" className="lh-live-status">
        {lines.at(-1)?.text}
      </span>
      {input.startsWith("/") ? (
        <div className="lh-command-menu">
          {commands
            .filter((command) => command.startsWith(input))
            .map((command) => (
              <button key={command} onClick={() => chooseCommand(command)} type="button">
                <span>{command}</span>
                <small>select</small>
              </button>
            ))}
        </div>
      ) : null}
      <form className="lh-live-prompt" data-running={running} onSubmit={submit}>
        <label htmlFor="lh-demo-prompt">❯</label>
        <input
          autoComplete="off"
          disabled={running}
          id="lh-demo-prompt"
          onChange={(event) => setInput(event.target.value)}
          placeholder="ask the harness · try /help"
          value={input}
        />
        <button disabled={!input.trim() || running} type="submit">
          send
        </button>
      </form>
    </div>
  );
}

export function LeHarnessSystem() {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const [accent] = useTerminalAccent();
  const [eventCount, setEventCount] = useState<number>(EVENTS.length);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearInterval(timer.current), []);

  const replay = () => {
    window.clearInterval(timer.current);
    if (shouldReduceMotion) {
      setEventCount(EVENTS.length);
      return;
    }
    setEventCount(0);
    let count = 0;
    timer.current = window.setInterval(() => {
      count = Math.min(count + 1, EVENTS.length);
      setEventCount(count);
      if (count >= EVENTS.length) window.clearInterval(timer.current);
    }, 260);
  };

  return (
    <div className="lh-system" data-accent={accent}>
      <div className="lh-loop">
        <span>one small loop</span>
        {["invocation", "project session", "model step", "execute tools"].map((step, index) => (
          <div data-active={eventCount > index} key={step}>
            <i>{String(index + 1).padStart(2, "0")}</i>
            <strong>{step}</strong>
          </div>
        ))}
      </div>
      <div className="lh-event-log">
        <header>
          <span>.leharness/events.jsonl</span>
          <button onClick={replay} type="button">replay from log</button>
        </header>
        <ol>
          {EVENTS.map((event, index) => (
            <li data-visible={index < eventCount} key={event}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {event}
            </li>
          ))}
        </ol>
        <p>transcript · tasks · artifacts = projections</p>
      </div>
    </div>
  );
}

export function LeHarnessOrigin() {
  const [accent, setAccent] = useTerminalAccent();

  return (
    <div className="lh-origin" data-accent={accent}>
      <div className="lh-motd">
        <span>leharness / motd</span>
        <pre aria-label="LeHarness wordmark">{`╭─ lh ─────────────────╮
│ the machinery, open │
╰─────────────────────╯`}</pre>
        <p>
          I wanted to understand harness engineering by building the loop,
          event log, tools, background work, subagents, and compaction myself.
          The name came from a dream in Paris.
        </p>
        <div aria-label="Terminal accent" className="lh-accent-picker" role="group">
          {ACCENTS.map((option) => (
            <button
              aria-label={`${option} terminal accent`}
              aria-pressed={accent === option}
              data-accent={option}
              key={option}
              onClick={() => setAccent(option)}
              type="button"
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      <ol className="lh-history">
        {MILESTONES.map((milestone) => (
          <li key={`${milestone.date}-${milestone.label}`}>
            <span>{milestone.date}</span>
            <strong>{milestone.label}</strong>
          </li>
        ))}
      </ol>
    </div>
  );
}
