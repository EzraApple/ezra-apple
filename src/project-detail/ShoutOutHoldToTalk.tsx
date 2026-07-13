import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

// The Experience section's centerpiece: the visitor performs ShoutOut's
// gesture themselves. Hold the key (pointer or Space) and release to paste;
// a quick double-tap latches hands-free with commit and cancel controls,
// mirroring the app's shortcut state machine.

const HOLD_MIN_MS = 260;
const DOUBLE_TAP_WINDOW_MS = 380;

const PASTES = [
  "You can just talk, and it lands as clean text.",
  "This line pasted the moment you let go.",
  "Fillers like um and uh never reach the page.",
  "Double-tap latches hands-free; the check commits.",
];

type Mode = "idle" | "holding" | "await-tap" | "hands-free";

export function ShoutOutHoldToTalk() {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const [mode, setMode] = useState<Mode>("idle");
  const [typed, setTyped] = useState("");
  const [receipt, setReceipt] = useState<string | null>(null);
  const downAt = useRef(0);
  const recordStart = useRef(0);
  const tapTimer = useRef<number | undefined>(undefined);
  const pasteIndex = useRef(0);
  const typeToken = useRef(0);

  const recording = mode === "holding" || mode === "hands-free";

  useEffect(
    () => () => {
      window.clearTimeout(tapTimer.current);
      typeToken.current += 1;
    },
    [],
  );

  const paste = (capturedMs: number) => {
    const line = PASTES[pasteIndex.current % PASTES.length];
    pasteIndex.current += 1;
    const token = ++typeToken.current;
    const transcribe = Math.round(180 + Math.random() * 220);
    const cleanup = Math.round(90 + Math.random() * 110);
    const insert = Math.round(4 + Math.random() * 9);
    setReceipt(
      `capture ${(capturedMs / 1000).toFixed(1)}s · whisperkit ${transcribe}ms · cleanup ${cleanup}ms · paste ${insert}ms`,
    );
    if (shouldReduceMotion) {
      setTyped(line);
      return;
    }
    setTyped("");
    let visible = 0;
    const tick = () => {
      if (token !== typeToken.current) return;
      visible += 2;
      setTyped(line.slice(0, visible));
      if (visible < line.length) window.setTimeout(tick, 16);
    };
    tick();
  };

  const press = () => {
    window.clearTimeout(tapTimer.current);
    if (mode === "await-tap") {
      recordStart.current = performance.now();
      setMode("hands-free");
      return;
    }
    if (mode === "hands-free") return;
    downAt.current = performance.now();
    recordStart.current = downAt.current;
    setMode("holding");
  };

  const release = () => {
    if (mode !== "holding") return;
    if (performance.now() - downAt.current < HOLD_MIN_MS) {
      setMode("await-tap");
      tapTimer.current = window.setTimeout(
        () => setMode("idle"),
        DOUBLE_TAP_WINDOW_MS,
      );
      return;
    }
    paste(performance.now() - recordStart.current);
    setMode("idle");
  };

  return (
    <div className="shoutout-key-demo" data-recording={recording}>
      <div className="shoutout-key-row">
        <button
          aria-label="Hold to dictate, release to paste; double-tap for hands-free"
          aria-pressed={mode === "hands-free"}
          className="shoutout-keycap"
          data-pressed={recording}
          onKeyDown={(event) => {
            if (event.repeat) return;
            if (event.key === " " || event.key === "Enter") {
              event.preventDefault();
              press();
            }
          }}
          onKeyUp={(event) => {
            if (event.key === " " || event.key === "Enter") {
              event.preventDefault();
              release();
            }
          }}
          onPointerDown={press}
          onPointerLeave={release}
          onPointerUp={release}
          type="button"
        >
          <svg
            aria-hidden="true"
            fill="none"
            height="32"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.3"
            viewBox="0 0 24 24"
            width="32"
          >
            <circle cx="12" cy="12" r="8" />
            <ellipse cx="12" cy="12" rx="3.6" ry="8" />
            <path d="M4.5 12h15" />
          </svg>
          <span className="shoutout-keycap-fn">fn</span>
        </button>

        <div className="shoutout-key-field">
          <span aria-live="polite" className="shoutout-key-text">
            {typed}
            <i className="shoutout-caret" data-recording={recording} />
          </span>
          {mode === "hands-free" ? (
            <span className="shoutout-key-actions">
              <button
                aria-label="Cancel dictation"
                onClick={() => setMode("idle")}
                type="button"
              >
                ✕
              </button>
              <button
                aria-label="Commit dictation"
                onClick={() => {
                  paste(performance.now() - recordStart.current);
                  setMode("idle");
                }}
                type="button"
              >
                ✓
              </button>
            </span>
          ) : recording ? (
            <span aria-hidden="true" className="shoutout-key-level">
              <i />
              <i />
              <i />
              <i />
              <i />
            </span>
          ) : null}
        </div>
      </div>
      {receipt && !recording ? (
        <p className="shoutout-key-receipt">{receipt}</p>
      ) : null}
      <p className="shoutout-key-hint">
        hold to talk · release to paste · double-tap for hands-free
      </p>
    </div>
  );
}
