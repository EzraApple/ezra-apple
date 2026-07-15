import "@fontsource-variable/instrument-sans";
import { useEffect, useState } from "react";
import {
  CURSOR_COLOR_EVENT,
  loadCursorColor,
  ROOMMATE_COLOR,
  saveCursorColor,
  SPATIUM_CURSOR_COLORS,
} from "./spatium-cursor";

// The Origin section goes fully inside Spatium: a light blueprint band in
// the app's own styling (Instrument Sans, 2px navy borders, hard offset
// shadows) holding the room card, your cursor color, and the real
// shipping log from the repo history.

const MILESTONES = [
  { date: "dec 06", label: "init" },
  {
    date: "dec 07",
    label: "“hella vibe coded mvp with figma mice and click animations”",
  },
  { date: "dec 07", label: "deployed on vercel before midnight" },
  { date: "dec 12", label: "the full blueprint restyle" },
  { date: "dec 13", label: "inventory, keybindings, live-cursor polish" },
  { date: "move-in", label: "the couch made it" },
];

export function SpatiumOriginBand() {
  const [myColor, setMyColor] = useState(loadCursorColor);

  useEffect(() => {
    const onColor = (event: Event) =>
      setMyColor((event as CustomEvent<string>).detail);
    window.addEventListener(CURSOR_COLOR_EVENT, onColor);
    return () => window.removeEventListener(CURSOR_COLOR_EVENT, onColor);
  }, []);

  const pick = (color: string) => {
    setMyColor(color);
    saveCursorColor(color);
  };

  return (
    <div className="spatium-blueprint">
      <div className="spatium-blueprint-cards">
        <div className="spb-card spatium-room-card">
          <header>
            <strong>room · move-in</strong>
            <span>2 online</span>
          </header>
          <div className="spatium-room-avatars">
            <i style={{ background: myColor }} />
            <i style={{ background: ROOMMATE_COLOR }} />
          </div>
          <p>one link, one floor plan, the same apartment for everyone.</p>
        </div>

        <div className="spb-card spatium-picker-card">
          <header>
            <strong>your cursor</strong>
          </header>
          <div
            aria-label="Cursor color"
            className="spatium-color-row"
            role="group"
          >
            {SPATIUM_CURSOR_COLORS.map((color) => (
              <button
                aria-label={`Cursor color ${color}`}
                aria-pressed={myColor === color}
                data-active={myColor === color}
                key={color}
                onClick={() => pick(color)}
                style={{ background: color }}
                type="button"
              />
            ))}
          </div>
          <p>it follows you through every demo on this page.</p>
        </div>
      </div>

      <ol className="spatium-log">
        {MILESTONES.map((milestone, index) => (
          <li key={index}>
            <span>{milestone.date}</span>
            {milestone.label}
          </li>
        ))}
      </ol>

      <p className="spatium-blueprint-footer">
        vibe coded with claude opus · mit licensed · partykit + vite + prisma
      </p>
    </div>
  );
}
