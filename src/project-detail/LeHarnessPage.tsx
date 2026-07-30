import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type FormEvent } from "react";

type TerminalLine = {
  kind: "assistant" | "meta" | "tool" | "user";
  text: string;
};

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

function responseFor(prompt: string): TerminalLine[] {
  const normalized = prompt.toLowerCase();

  if (normalized === "/help") {
    return [
      { kind: "meta", text: "commands · /model /effort /mcp /help" },
      { kind: "assistant", text: "Slash commands change the session; plain text runs a model turn." },
    ];
  }
  if (normalized === "/model") {
    return [{ kind: "meta", text: "provider · openai · alternates: deepseek, ollama" }];
  }
  if (normalized === "/effort") {
    return [{ kind: "meta", text: "reasoning effort · high" }];
  }
  if (normalized === "/mcp") {
    return [
      { kind: "tool", text: "Load .leharness/mcp.json · completed" },
      { kind: "meta", text: "MCP tools join the same registry as local tools." },
    ];
  }
  if (/event|loop|runtime/.test(normalized)) {
    return [
      { kind: "tool", text: "Read session event log · 12 events" },
      { kind: "assistant", text: "The parent loop stays small: project events, build context, call the model, execute tools, append the result." },
    ];
  }
  if (/background|subagent|task/.test(normalized)) {
    return [
      { kind: "tool", text: "Inspect task projection · 2 durable handles" },
      { kind: "assistant", text: "Long work returns a handle. Completion becomes an event that can wake the parent session later." },
    ];
  }
  if (/compact|context|session/.test(normalized)) {
    return [
      { kind: "tool", text: "Project session from events · completed" },
      { kind: "assistant", text: "Compaction can replace active context without replacing history; the append-only log remains canonical." },
    ];
  }
  if (/tool|mcp/.test(normalized)) {
    return [
      { kind: "tool", text: "Inspect tool registry · bash, read, write, MCP" },
      { kind: "assistant", text: "Tool calls and results enter the same event stream, so the transcript can always explain what ran." },
    ];
  }
  if (/repo|architect|summar/.test(normalized)) {
    return [
      { kind: "tool", text: "List packages · harness, mcp, cli, tui" },
      { kind: "assistant", text: "A channel-agnostic harness kernel sits below thin CLI and TUI products; sessions, tasks, and artifacts live on disk." },
    ];
  }
  return [
    { kind: "tool", text: "Read project boundary · completed" },
    { kind: "assistant", text: "I’d trace the relevant events and tools first, then return the result with the evidence that produced it." },
  ];
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
  const [visibleLines, setVisibleLines] = useState(
    shouldReduceMotion ? SESSION_LINES.length : 3,
  );

  useEffect(() => {
    if (shouldReduceMotion) {
      setVisibleLines(SESSION_LINES.length);
      return;
    }
    const timer = window.setInterval(() => {
      setVisibleLines((current) =>
        Math.min(current + 1, SESSION_LINES.length),
      );
    }, 650);
    return () => window.clearInterval(timer);
  }, [shouldReduceMotion]);

  return (
    <div className="lh-terminal lh-terminal-hero" data-accent="amber">
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
      setLines((current) => [...current, ...responseFor(prompt)]);
      setRunning(false);
    }, 420);
  };

  const chooseCommand = (command: string) => {
    setLines((current) => [
      ...current,
      { kind: "user", text: command },
      ...responseFor(command),
    ]);
    setInput("");
  };

  return (
    <div className="lh-terminal lh-experience" data-accent="amber">
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
    <div className="lh-system" data-accent="amber">
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
  return (
    <div className="lh-origin" data-accent="amber">
      <header>
        <span>leharness / origin.log</span>
        <span>main · public</span>
      </header>
      <div className="lh-origin-story">
        <div className="lh-origin-turn">
          <span>❯ why build a harness from scratch?</span>
          <p>
            <i>⏺</i>
            <strong>
              I wanted to understand harness engineering by building the loop,
              event log, tools, background work, subagents, and compaction myself.
            </strong>
          </p>
        </div>
        <aside className="lh-origin-principle">
          <span>design rule / 01</span>
          <strong>Keep the parent loop visible.</strong>
          <p>Every durable feature should make the runtime easier to inspect, not hide it.</p>
        </aside>
      </div>
      <ol aria-label="LeHarness project history" className="lh-history">
        {MILESTONES.map((milestone) => (
          <li key={`${milestone.date}-${milestone.label}`}>
            <span>{milestone.date}</span>
            <strong>{milestone.label}</strong>
          </li>
        ))}
      </ol>
      <footer>
        <span>name source</span>
        <strong>a dream in Paris</strong>
      </footer>
    </div>
  );
}
