import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

// The ShoutOut hero is a pseudo-demo: the app's wall-crawling mascot (or
// its classic capsule indicator) dictates into a Mac, and the visitor can
// flip the real app settings — overlay style and writing tone. Sprites,
// timing, overlay styles, and tone semantics mirror shoutout main
// (FloatingIndicator.swift, LanguagePassStyle).

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
const TYPE_MS = 40;
const MAX_OFFSET = 132;
const WALK_SPEED_PX_S = 30;

type Overlay = "crab" | "classic";
type Tone = "standard" | "casual" | "formal";

const TONES: { id: Tone; label: string }[] = [
  { id: "standard", label: "Normal" },
  { id: "casual", label: "Casual" },
  { id: "formal", label: "Formal" },
];

// One utterance, three cleanup outcomes — matching the app's tone rules:
// normal balances casing and punctuation, casual stays lowercase with no
// punctuation, formal polishes casing and punctuation.
const DICTATIONS: Record<Tone, string>[] = [
  {
    standard: "Hold to talk, release to paste.",
    casual: "hold to talk release to paste",
    formal: "Hold to talk; release to paste.",
  },
  {
    standard: "Speech becomes clean text, right where you are typing.",
    casual: "speech becomes clean text right where you are typing",
    formal: "Speech becomes clean text precisely where you are typing.",
  },
  {
    standard: "No account, no cloud. Everything stays on this Mac.",
    casual: "no account no cloud everything stays on this mac",
    formal: "No account and no cloud; everything remains on this Mac.",
  },
  {
    standard: "Fillers like um and uh are removed before pasting.",
    casual: "fillers like um and uh are removed before pasting",
    formal: "Fillers such as um and uh are removed before pasting.",
  },
];

const randomBetween = (min: number, max: number) =>
  min + Math.random() * (max - min);

export function ShoutOutScene() {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const [frame, setFrame] = useState(IDLE_FRAMES[0]);
  const [offset, setOffset] = useState(0);
  const [walkMs, setWalkMs] = useState(0);
  const [typed, setTyped] = useState("");
  const [recording, setRecording] = useState(false);
  const [overlay, setOverlay] = useState<Overlay>("crab");
  const [tone, setTone] = useState<Tone>("standard");
  const overlayRef = useRef<Overlay>("crab");
  const toneRef = useRef<Tone>("standard");
  const cancelled = useRef(false);

  overlayRef.current = overlay;
  toneRef.current = tone;

  useEffect(() => {
    if (shouldReduceMotion) {
      setTyped(DICTATIONS[0][tone]);
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
        if (overlayRef.current === "crab") {
          // Glide to a destination at constant speed: one linear transition
          // while the walk frames tick, so the motion reads as calm walking
          // instead of per-step twitching.
          const distance = randomBetween(55, 150);
          if (
            position + direction * distance > MAX_OFFSET ||
            position + direction * distance < -MAX_OFFSET
          ) {
            direction *= -1;
          }
          const target = Math.min(
            Math.max(position + direction * distance, -MAX_OFFSET),
            MAX_OFFSET,
          );
          const duration =
            (Math.abs(target - position) / WALK_SPEED_PX_S) * 1000;
          setWalkMs(duration);
          setOffset(target);
          const frameCount = Math.max(1, Math.round(duration / IDLE_FRAME_MS));
          for (let tick = 0; tick < frameCount; tick += 1) {
            if (cancelled.current) return;
            setFrame(IDLE_FRAMES[frameIndex % IDLE_FRAMES.length]);
            frameIndex += 1;
            await sleep(IDLE_FRAME_MS);
          }
          position = target;
          setFrame(IDLE_FRAMES[0]);
          // Mostly keep heading the same way; turn around occasionally.
          if (Math.random() < 0.3) direction *= -1;
        } else {
          await sleep(1100);
        }

        await sleep(randomBetween(...PAUSE_RANGE_MS));
        burstsSinceBoom += 1;

        // Occasionally: record and dictate a line in the current tone.
        if (burstsSinceBoom >= 1 && Math.random() < 0.55) {
          burstsSinceBoom = 0;
          setRecording(true);

          if (overlayRef.current === "crab") {
            for (const boomFrame of BOOM_FRAMES) {
              if (cancelled.current) return;
              setFrame(boomFrame);
              await sleep(BOOM_INTRO_FRAME_MS);
            }
            setFrame(HOLD_FRAME);
          }

          const line = DICTATIONS[dictationIndex % DICTATIONS.length];
          dictationIndex += 1;
          const text = line[toneRef.current];
          for (let length = 1; length <= text.length; length += 1) {
            if (cancelled.current) return;
            setTyped(text.slice(0, length));
            await sleep(TYPE_MS);
          }
          await sleep(1050);

          if (overlayRef.current === "crab") {
            for (const boomFrame of [...BOOM_FRAMES].reverse()) {
              if (cancelled.current) return;
              setFrame(boomFrame);
              await sleep(BOOM_OUTRO_FRAME_MS);
            }
            setFrame(IDLE_FRAMES[0]);
          }
          setRecording(false);
          await sleep(randomBetween(1400, 2200));
          setTyped("");
        }
      }
    };

    void run();
    return () => {
      cancelled.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the loop reads
    // overlay and tone through refs; restarting it on toggle would reset the
    // scene.
  }, [shouldReduceMotion]);

  useEffect(() => {
    if (shouldReduceMotion) setTyped(DICTATIONS[0][tone]);
  }, [shouldReduceMotion, tone]);

  const toneLabel = TONES.find((entry) => entry.id === tone)?.label ?? "Normal";

  return (
    <div className="shoutout-scene">
      <div aria-hidden="true" className="shoutout-mac">
        <div className="shoutout-display" data-recording={recording}>
          <div className="shoutout-menubar">
            <span className="shoutout-menu-apple"></span>
            <span className="shoutout-menu-app">ShoutOut</span>
            <span>File</span>
            <span>Edit</span>
            <span>View</span>
            <span>Window</span>
            <span className="shoutout-menu-right">
              {recording ? (
                <svg
                  className="shoutout-menu-mic"
                  fill="none"
                  height="12"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.4"
                  viewBox="0 0 16 16"
                  width="12"
                >
                  <rect height="7" rx="2" width="4" x="6" y="1.5" />
                  <path d="M3.5 7.5a4.5 4.5 0 0 0 9 0M8 12v2.5" />
                </svg>
              ) : (
                "Mon 9:41"
              )}
            </span>
          </div>
          <div className="shoutout-desktop">
            <div className="shoutout-window">
              <div className="shoutout-window-bar">
                <i className="shoutout-light shoutout-light-close" />
                <i className="shoutout-light shoutout-light-min" />
                <i className="shoutout-light shoutout-light-max" />
                <span>notes.md</span>
                <em>{toneLabel} tone · cleanup on</em>
              </div>
              <div className="shoutout-window-body">
                {typed}
                <i className="shoutout-caret" />
              </div>
            </div>

            <div className="shoutout-dock">
              <i className="shoutout-dock-tile">
                <img alt="" src={IDLE_FRAMES[0]} />
              </i>
              <i className="shoutout-dock-tile" />
              <i className="shoutout-dock-tile" />
              <i className="shoutout-dock-tile" />
              <i className="shoutout-dock-tile" />
            </div>

            {overlay === "crab" ? (
              <span
                className="shoutout-crab"
                style={{
                  transform: `translateY(${offset}px)`,
                  transitionDuration: `${Math.round(walkMs)}ms`,
                }}
              >
                <img alt="" src={frame} />
              </span>
            ) : (
              <span className="shoutout-capsule" data-recording={recording}>
                {recording ? (
                  <span className="shoutout-capsule-bars">
                    {Array.from({ length: 9 }, (_, index) => (
                      <i key={index} />
                    ))}
                  </span>
                ) : (
                  <i className="shoutout-capsule-dot" />
                )}
              </span>
            )}
          </div>
        </div>
        <div className="shoutout-chin">
          <i />
        </div>
        <div className="shoutout-foot" />
        <div className="shoutout-base" />
      </div>

      <div aria-label="ShoutOut demo settings" className="shoutout-controls" role="group">
        <div className="shoutout-control">
          <span>Overlay</span>
          <button
            data-active={overlay === "crab"}
            onClick={() => setOverlay("crab")}
            type="button"
          >
            Crab
          </button>
          <button
            data-active={overlay === "classic"}
            onClick={() => setOverlay("classic")}
            type="button"
          >
            Classic
          </button>
        </div>
        <div className="shoutout-control">
          <span>Tone</span>
          {TONES.map((entry) => (
            <button
              data-active={tone === entry.id}
              key={entry.id}
              onClick={() => setTone(entry.id)}
              type="button"
            >
              {entry.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
