import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

// The ShoutOut hero: the app's actual wall-crawling mascot climbing the
// edge of a screen, occasionally raising its boom mic while dictated text
// lands in the field — the product, acted out. Timing constants mirror
// FloatingIndicator.swift in the ShoutOut source.

const IDLE_FRAMES = Array.from(
  { length: 10 },
  (_, index) => `/shoutout/crab/idle-${index + 1}.png`,
);
const BOOM_FRAMES = Array.from(
  { length: 5 },
  (_, index) => `/shoutout/crab/recording-intro-${index + 1}.png`,
);

const IDLE_FRAME_MS = 95;
const BOOM_FRAME_MS = 90;
const STRIDE_MS = 100;
const PAUSE_RANGE_MS: [number, number] = [420, 900];
const TYPE_MS = 42;
const MAX_OFFSET = 62;

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
    for (const src of [...IDLE_FRAMES, ...BOOM_FRAMES]) {
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
        // A burst of strides along the screen edge.
        const steps = 8 + Math.floor(Math.random() * 7);
        for (let step = 0; step < steps; step += 1) {
          if (cancelled.current) return;
          position += direction * randomBetween(1.5, 3);
          position = Math.min(Math.max(position, -MAX_OFFSET), MAX_OFFSET);
          if (Math.abs(position) >= MAX_OFFSET - 2) direction *= -1;
          frameIndex += 1;
          setOffset(position);
          setFrame(IDLE_FRAMES[frameIndex % IDLE_FRAMES.length]);
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
            await sleep(BOOM_FRAME_MS);
          }

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
            await sleep(BOOM_FRAME_MS);
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
      <div className="shoutout-monitor">
        <div className="shoutout-screen" data-recording={recording}>
          <span className="shoutout-field">
            {typed}
            <i className="shoutout-caret" />
          </span>
          <span
            className="shoutout-crab"
            style={{ transform: `translateY(${offset}px)` }}
          >
            <img alt="" src={frame} />
          </span>
        </div>
        <div className="shoutout-stand" />
        <div className="shoutout-base" />
      </div>
    </div>
  );
}
