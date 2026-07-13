import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

// The ShoutOut hero: the app's current wall-crawling mascot climbing the
// edge of a Mac display, occasionally raising its boom mic while a
// dictated line lands in the focused window — the product, acted out.
// Frames and timing mirror apps/macos/Sources/Views/FloatingIndicator.swift
// on shoutout main.

const IDLE_FRAMES = Array.from(
  { length: 4 },
  (_, index) => `/shoutout/crab/idle-${index + 1}.png`,
);
const BOOM_FRAMES = Array.from(
  { length: 6 },
  (_, index) => `/shoutout/crab/recording-intro-${index + 1}.png`,
);
const HOLD_FRAME = "/shoutout/crab/recording-hold.png";

const IDLE_FRAME_MS = 130;
const BOOM_INTRO_FRAME_MS = 68;
const BOOM_OUTRO_FRAME_MS = 46;
const PAUSE_RANGE_MS: [number, number] = [520, 880];
const TYPE_MS = 42;
const MAX_OFFSET = 118;

const DICTATIONS = [
  "hold to talk, release to paste.",
  "speech becomes clean text.",
  "no account, no cloud.",
  "the transcript lands formatted.",
];

const randomBetween = (min: number, max: number) =>
  min + Math.random() * (max - min);

export function ShoutOutScene() {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const [frame, setFrame] = useState(IDLE_FRAMES[0]);
  const [offset, setOffset] = useState(0);
  const [typed, setTyped] = useState("");
  const [recording, setRecording] = useState(false);
  const cancelled = useRef(false);

  useEffect(() => {
    if (shouldReduceMotion) {
      setTyped(DICTATIONS[0]);
      return;
    }

    cancelled.current = false;
    for (const src of [...IDLE_FRAMES, ...BOOM_FRAMES, HOLD_FRAME]) {
      new Image().src = src;
    }

    const sleep = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    const run = async () => {
      let frameIndex = 0;
      let position = 0;
      let direction = Math.random() < 0.5 ? -1 : 1;
      let burstsSinceBoom = 0;
      let dictationIndex = 0;

      while (!cancelled.current) {
        // A burst of strides along the display edge.
        const steps = 8 + Math.floor(Math.random() * 7);
        for (let step = 0; step < steps; step += 1) {
          if (cancelled.current) return;
          position += direction * randomBetween(3.2, 5.4);
          position = Math.min(Math.max(position, -MAX_OFFSET), MAX_OFFSET);
          if (Math.abs(position) >= MAX_OFFSET - 2) direction *= -1;
          setOffset(position);
          setFrame(IDLE_FRAMES[frameIndex % IDLE_FRAMES.length]);
          frameIndex += 1;
          await sleep(IDLE_FRAME_MS);
        }

        await sleep(randomBetween(...PAUSE_RANGE_MS));
        if (Math.random() < 0.5) direction *= -1;
        burstsSinceBoom += 1;

        // Occasionally: raise the boom and dictate a line.
        if (burstsSinceBoom >= 2 && Math.random() < 0.55) {
          burstsSinceBoom = 0;
          setRecording(true);

          for (const boomFrame of BOOM_FRAMES) {
            if (cancelled.current) return;
            setFrame(boomFrame);
            await sleep(BOOM_INTRO_FRAME_MS);
          }
          setFrame(HOLD_FRAME);

          const line = DICTATIONS[dictationIndex % DICTATIONS.length];
          dictationIndex += 1;
          for (let length = 1; length <= line.length; length += 1) {
            if (cancelled.current) return;
            setTyped(line.slice(0, length));
            await sleep(TYPE_MS);
          }
          await sleep(950);

          for (const boomFrame of [...BOOM_FRAMES].reverse()) {
            if (cancelled.current) return;
            setFrame(boomFrame);
            await sleep(BOOM_OUTRO_FRAME_MS);
          }
          setRecording(false);
          setFrame(IDLE_FRAMES[0]);
          await sleep(randomBetween(1400, 2200));
          setTyped("");
        }
      }
    };

    void run();
    return () => {
      cancelled.current = true;
    };
  }, [shouldReduceMotion]);

  return (
    <div aria-hidden="true" className="shoutout-scene">
      <div className="shoutout-mac">
        <div className="shoutout-display" data-recording={recording}>
          <div className="shoutout-menubar">
            <span className="shoutout-menu-apple"></span>
            <span className="shoutout-menu-app">ShoutOut</span>
            <span>File</span>
            <span>Edit</span>
            <span>View</span>
            <span className="shoutout-menu-right">
              {recording ? "● rec" : "9:41"}
            </span>
          </div>
          <div className="shoutout-desktop">
            <div className="shoutout-window">
              <div className="shoutout-window-bar">
                <i className="shoutout-light shoutout-light-close" />
                <i className="shoutout-light shoutout-light-min" />
                <i className="shoutout-light shoutout-light-max" />
                <span>notes.md</span>
              </div>
              <div className="shoutout-window-body">
                {typed}
                <i className="shoutout-caret" />
              </div>
            </div>
            <span
              className="shoutout-crab"
              style={{ transform: `translateY(${offset}px)` }}
            >
              <img alt="" src={frame} />
            </span>
          </div>
        </div>
        <div className="shoutout-chin">
          <i />
        </div>
        <div className="shoutout-foot" />
        <div className="shoutout-base" />
      </div>
    </div>
  );
}
