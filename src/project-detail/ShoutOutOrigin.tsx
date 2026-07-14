import { useState } from "react";
import {
  CRAB_COATS,
  crabFrame,
  loadCoat,
  saveCoat,
  type CrabCoat,
} from "./shoutout-crab";

// The Origin section's personality layer: pick the crab's coat (it follows
// you back to the hero and persists), beside a ladder of real milestones
// from the repo's history.

const MILESTONES = [
  { date: "jun 12", label: "first commit — hold-to-talk prototype, crab on day one" },
  { date: "jun 13", label: "renamed ShoutOut, latency metrics in the pipeline" },
  { date: "jun 18", label: "release candidate; shoutout.sh goes live" },
  { date: "jun 19", label: "0.1.1 — signed, notarized DMG installer" },
  { date: "jul 03", label: "0.1.8 shipped over Sparkle auto-update" },
  { date: "now", label: "still shipping" },
];

export function ShoutOutOrigin() {
  const [coat, setCoat] = useState<CrabCoat>(loadCoat);

  const pick = (next: CrabCoat) => {
    setCoat(next);
    saveCoat(next);
  };

  return (
    <div className="shoutout-origin">
      <div className="shoutout-coats">
        <img
          alt=""
          className="shoutout-coat-preview"
          src={crabFrame(coat, "idle-1")}
        />
        <p className="shoutout-coat-note">
          the wall crab ships in 21 coats · pick yours and it follows you
        </p>
        <div aria-label="Crab coat" className="shoutout-coat-row" role="group">
          {CRAB_COATS.map((option) => (
            <button
              aria-label={`${option} coat`}
              aria-pressed={coat === option}
              data-active={coat === option}
              key={option}
              onClick={() => pick(option)}
              type="button"
            >
              <img alt="" src={crabFrame(option, "idle-1")} />
            </button>
          ))}
        </div>
      </div>

      <ol className="shoutout-ladder">
        {MILESTONES.map((milestone) => (
          <li key={milestone.date}>
            <span>{milestone.date}</span>
            {milestone.label}
          </li>
        ))}
      </ol>
    </div>
  );
}
