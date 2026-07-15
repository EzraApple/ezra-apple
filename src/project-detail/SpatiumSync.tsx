import { useEffect, useState } from "react";
import {
  CURSOR_COLOR_EVENT,
  loadCursorColor,
  ROOMMATE_COLOR,
} from "./spatium-cursor";

// The System section: two browsers and one PartyKit room between them.
// Messages pulse along the pipes with the protocol's real names; the nodes
// wear Spatium's own card styling — deeper into the app than the hero.

const CURSOR_PATH = "M4 4L10.5 20L12.5 13.5L19 11.5L4 4Z";

function CursorGlyph({ color }: { color: string }) {
  return (
    <svg fill="none" height="14" viewBox="0 0 24 24" width="14">
      <path d={CURSOR_PATH} fill={color} stroke="#fff" strokeWidth="2" />
    </svg>
  );
}

export function SpatiumSync() {
  const [myColor, setMyColor] = useState(loadCursorColor);

  useEffect(() => {
    const onColor = (event: Event) =>
      setMyColor((event as CustomEvent<string>).detail);
    window.addEventListener(CURSOR_COLOR_EVENT, onColor);
    return () => window.removeEventListener(CURSOR_COLOR_EVENT, onColor);
  }, []);

  return (
    <figure aria-hidden="true" className="spatium-sync">
      <div className="spatium-sync-row">
        <div className="spb-card spatium-sync-node">
          <CursorGlyph color={myColor} />
          <strong>you</strong>
          <small>browser</small>
        </div>

        <div className="spatium-sync-pipe">
          <span className="spatium-sync-label">cursor-move · furniture-move →</span>
          <i data-flow="right" />
          <i data-flow="left" style={{ animationDelay: "0.9s" }} />
          <span className="spatium-sync-label is-under">← cursor-update</span>
        </div>

        <div className="spb-card spatium-sync-node is-room">
          <strong>partykit room</strong>
          <small>source of truth · persists via prisma</small>
        </div>

        <div className="spatium-sync-pipe">
          <span className="spatium-sync-label">← furniture-moved</span>
          <i data-flow="left" />
          <i data-flow="right" style={{ animationDelay: "1.1s" }} />
          <span className="spatium-sync-label is-under">cursor-move →</span>
        </div>

        <div className="spb-card spatium-sync-node">
          <CursorGlyph color={ROOMMATE_COLOR} />
          <strong>roommate</strong>
          <small>browser</small>
        </div>
      </div>
      <figcaption className="spatium-sync-caption">
        cursors throttle at 33ms · the room fans every change out to everyone
      </figcaption>
    </figure>
  );
}
