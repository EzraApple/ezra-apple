import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

// The System section's diagram, kept deliberately simple: audio flows to
// one local model, through LM cleanup, and out to the paste — all inside
// one boundary. A pulse travels the pipe; sometimes the validator rejects
// the cleanup and the pulse visibly takes the bypass, because when a
// rewrite risks the meaning, the original transcript wins.

const MAIN_PATH = "M 34 150 H 668";
const BYPASS_PATH =
  "M 34 150 H 330 C 380 150 380 74 445 74 C 510 74 510 150 560 150 H 668";
const BYPASS_ARC = "M 330 150 C 380 150 380 74 445 74 C 510 74 510 150 560 150";
const PULSE_MS = 3000;

export function ShoutOutPipeline() {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const [bypassing, setBypassing] = useState(false);
  const motionRef = useRef<(SVGElement & { beginElement?: () => void }) | null>(
    null,
  );

  useEffect(() => {
    if (shouldReduceMotion) return;
    let cancelled = false;
    const timers: number[] = [];

    const cycle = () => {
      if (cancelled) return;
      const takeBypass = Math.random() < 0.34;
      motionRef.current?.setAttribute(
        "path",
        takeBypass ? BYPASS_PATH : MAIN_PATH,
      );
      setBypassing(takeBypass);
      motionRef.current?.beginElement?.();
      timers.push(window.setTimeout(() => setBypassing(false), PULSE_MS));
      timers.push(
        window.setTimeout(cycle, PULSE_MS + 900 + Math.random() * 1400),
      );
    };

    timers.push(window.setTimeout(cycle, 900));
    return () => {
      cancelled = true;
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, [shouldReduceMotion]);

  return (
    <figure aria-hidden="true" className="shoutout-pipeline" data-bypass={bypassing}>
      <svg fill="none" viewBox="0 0 700 232" xmlns="http://www.w3.org/2000/svg">
        {/* the boundary: everything happens inside this box */}
        <rect className="sp-boundary" height="196" rx="14" width="676" x="12" y="18" />
        <rect className="sp-tag-bg" height="14" width="66" x="30" y="11" />
        <text className="sp-tag" x="36" y="22">THIS MAC</text>

        {/* main pipe */}
        <path className="sp-pipe" d="M 34 150 H 668" />
        {/* bypass: raw transcript routes around cleanup */}
        <path className="sp-bypass" d={BYPASS_ARC} />

        {/* nodes */}
        {[
          { x: 60, label: "audio" },
          { x: 210, label: "whisperkit" },
          { x: 390, label: "lm cleanup" },
          { x: 560, label: "paste" },
        ].map((node) => (
          <g key={node.label}>
            <rect className="sp-node" height="42" rx="8" width="108" x={node.x - 26} y="129" />
            <text className="sp-label" textAnchor="middle" x={node.x + 28} y="154.5">
              {node.label}
            </text>
          </g>
        ))}

        {/* bypass caption */}
        <text className="sp-bypass-label" textAnchor="middle" x="445" y="58">
          if a rewrite risks the meaning, the original wins
        </text>

        {/* the traveling utterance */}
        {!shouldReduceMotion ? (
          <circle className="sp-pulse" r="4.5">
            <animateMotion
              begin="indefinite"
              dur={`${PULSE_MS}ms`}
              fill="freeze"
              path={MAIN_PATH}
              ref={motionRef as never}
            />
          </circle>
        ) : (
          <circle className="sp-pulse" cx="34" cy="150" r="4.5" />
        )}
      </svg>
      <figcaption className="sp-caption">nothing leaves this box.</figcaption>
    </figure>
  );
}
