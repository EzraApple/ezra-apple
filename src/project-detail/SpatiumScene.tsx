import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

// The Spatium hero: two cursors sharing one floor plan, dragging furniture
// that snaps to the grid on release — the product's multiplayer moment on
// loop. Cursor arrow, palette order, grid size, and update cadence mirror
// the spatium repo (cursor.tsx, CURSOR_COLORS, GRID_SIZE, THROTTLE_MS).

const GRID = 24;
const STEP_MS = 90;
const CURSOR_PATH = "M4 4L10.5 20L12.5 13.5L19 11.5L4 4Z";

type Piece = {
  id: string;
  label: string;
  shape: "rect" | "circle";
  w: number;
  h: number;
  // region the piece may wander within (keeps furniture in its room)
  region: { x: number; y: number; w: number; h: number };
};

const PIECES: Piece[] = [
  { id: "couch", label: "couch", shape: "rect", w: 120, h: 42, region: { x: 48, y: 96, w: 288, h: 264 } },
  { id: "table", label: "table", shape: "circle", w: 60, h: 60, region: { x: 48, y: 96, w: 288, h: 264 } },
  { id: "bed", label: "bed", shape: "rect", w: 84, h: 120, region: { x: 396, y: 72, w: 240, h: 168 } },
  { id: "desk", label: "desk", shape: "rect", w: 96, h: 36, region: { x: 396, y: 288, w: 240, h: 96 } },
  { id: "fridge", label: "fridge", shape: "rect", w: 42, h: 42, region: { x: 552, y: 288, w: 84, h: 96 } },
];

const INITIAL_POSITIONS: Record<string, { x: number; y: number }> = {
  couch: { x: 72, y: 144 },
  table: { x: 240, y: 240 },
  bed: { x: 456, y: 96 },
  desk: { x: 420, y: 312 },
  fridge: { x: 576, y: 312 },
};

type Actor = {
  name: string;
  color: string;
};

// First two joiners get the palette's first two colors, like the party
// server's round-robin assignment.
const ACTORS: Actor[] = [
  { name: "ezra", color: "#ef4444" },
  { name: "roommate", color: "#f97316" },
];

const randomBetween = (min: number, max: number) =>
  min + Math.random() * (max - min);

const snap = (value: number) => Math.round(value / GRID) * GRID;

export function SpatiumScene() {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const [positions, setPositions] = useState(INITIAL_POSITIONS);
  const [cursors, setCursors] = useState([
    { x: 180, y: 200 },
    { x: 500, y: 180 },
  ]);
  const [dragging, setDragging] = useState<string | null>(null);
  const [snapped, setSnapped] = useState<string | null>(null);
  const [ripple, setRipple] = useState<{ x: number; y: number; color: string; key: number } | null>(null);
  const cancelled = useRef(false);

  useEffect(() => {
    if (shouldReduceMotion) return;
    cancelled.current = false;

    const sleep = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    const positionsRef = { ...INITIAL_POSITIONS };
    const cursorsRef = [
      { x: 180, y: 200 },
      { x: 500, y: 180 },
    ];

    const setCursor = (index: number, x: number, y: number) => {
      cursorsRef[index] = { x, y };
      setCursors([...cursorsRef.map((c) => ({ ...c }))]);
    };

    // Glide a cursor toward a point in throttled steps, with the idle
    // cursor drifting slightly so the room always feels alive.
    const glide = async (index: number, tx: number, ty: number) => {
      const other = 1 - index;
      while (!cancelled.current) {
        const { x, y } = cursorsRef[index];
        const dx = tx - x;
        const dy = ty - y;
        const distance = Math.hypot(dx, dy);
        if (distance < 6) return;
        const step = Math.min(26, distance);
        setCursor(
          index,
          x + (dx / distance) * step + randomBetween(-1.5, 1.5),
          y + (dy / distance) * step + randomBetween(-1.5, 1.5),
        );
        if (Math.random() < 0.3) {
          const idle = cursorsRef[other];
          setCursor(
            other,
            idle.x + randomBetween(-4, 4),
            idle.y + randomBetween(-4, 4),
          );
        }
        await sleep(STEP_MS);
      }
    };

    const run = async () => {
      let turn = 0;
      await sleep(800);

      while (!cancelled.current) {
        const actorIndex = turn % 2;
        turn += 1;

        const piece = PIECES[Math.floor(Math.random() * PIECES.length)];
        const from = positionsRef[piece.id];
        const grabX = from.x + piece.w / 2;
        const grabY = from.y + piece.h / 2;

        await glide(actorIndex, grabX, grabY);
        if (cancelled.current) return;

        // click: the ripple every collaborator sees
        setRipple({
          x: grabX,
          y: grabY,
          color: ACTORS[actorIndex].color,
          key: Date.now(),
        });
        setDragging(piece.id);
        await sleep(260);

        // drag to a new raw (off-grid) spot inside the piece's room
        const targetX = randomBetween(
          piece.region.x,
          piece.region.x + piece.region.w - piece.w,
        );
        const targetY = randomBetween(
          piece.region.y,
          piece.region.y + piece.region.h - piece.h,
        );

        const steps = 10 + Math.floor(Math.random() * 6);
        for (let step = 1; step <= steps; step += 1) {
          if (cancelled.current) return;
          const t = step / steps;
          const x = from.x + (targetX - from.x) * t;
          const y = from.y + (targetY - from.y) * t;
          positionsRef[piece.id] = { x, y };
          setPositions({ ...positionsRef });
          setCursor(actorIndex, x + piece.w / 2, y + piece.h / 2);
          await sleep(STEP_MS);
        }

        // release: snap to the grid
        positionsRef[piece.id] = { x: snap(targetX), y: snap(targetY) };
        setPositions({ ...positionsRef });
        setDragging(null);
        setSnapped(piece.id);
        await sleep(600);
        setSnapped(null);

        // wander off before the next turn
        await glide(
          actorIndex,
          randomBetween(120, 600),
          randomBetween(120, 360),
        );
        await sleep(randomBetween(700, 1600));
      }
    };

    void run();
    return () => {
      cancelled.current = true;
    };
  }, [shouldReduceMotion]);

  return (
    <div aria-hidden="true" className="spatium-scene">
      <div className="spatium-frame">
        <div className="spatium-presence">
          {ACTORS.map((actor) => (
            <span key={actor.name}>
              <i style={{ background: actor.color }} />
              {actor.name}
            </span>
          ))}
        </div>

        <svg fill="none" viewBox="0 0 700 432" xmlns="http://www.w3.org/2000/svg">
          {/* grid */}
          <defs>
            <pattern height={GRID} id="spatium-grid" patternUnits="userSpaceOnUse" width={GRID}>
              <path className="spatium-grid-line" d={`M ${GRID} 0 L 0 0 0 ${GRID}`} />
            </pattern>
          </defs>
          <rect fill="url(#spatium-grid)" height="384" width="612" x="36" y="60" />

          {/* apartment walls: living room left, bedroom + kitchen right */}
          <path className="spatium-wall" d="M 36 60 H 648 V 444" />
          <path className="spatium-wall" d="M 36 60 V 384 H 300" />
          <path className="spatium-wall" d="M 384 384 H 648" />
          <path className="spatium-wall" d="M 372 60 V 168" />
          <path className="spatium-wall" d="M 372 240 V 276 H 456" />
          <path className="spatium-wall" d="M 528 276 H 648" />

          <text className="spatium-room-label" x="52" y="84">living room</text>
          <text className="spatium-room-label" x="388" y="84">bedroom</text>
          <text className="spatium-room-label" x="388" y="300">kitchen</text>

          {/* furniture */}
          {PIECES.map((piece) => {
            const pos = positions[piece.id];
            const isDragging = dragging === piece.id;
            const isSnapped = snapped === piece.id;
            return (
              <g
                className="spatium-piece"
                data-dragging={isDragging}
                data-snapped={isSnapped}
                key={piece.id}
                style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
              >
                {piece.shape === "circle" ? (
                  <circle cx={piece.w / 2} cy={piece.h / 2} r={piece.w / 2} />
                ) : (
                  <rect height={piece.h} rx="3" width={piece.w} />
                )}
                <text textAnchor="middle" x={piece.w / 2} y={piece.h / 2 + 3}>
                  {piece.label}
                </text>
              </g>
            );
          })}

          {/* click ripple */}
          {ripple ? (
            <circle
              className="spatium-ripple"
              cx={ripple.x}
              cy={ripple.y}
              key={ripple.key}
              r="6"
              style={{ stroke: ripple.color }}
            />
          ) : null}

          {/* cursors */}
          {ACTORS.map((actor, index) => (
            <g
              className="spatium-cursor"
              key={actor.name}
              style={{
                transform: `translate(${cursors[index].x}px, ${cursors[index].y}px)`,
              }}
            >
              <path
                d={CURSOR_PATH}
                fill={actor.color}
                stroke="#fff"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
              <g transform="translate(14, 22)">
                <rect fill={actor.color} height="15" rx="3" width={actor.name.length * 6.4 + 10} />
                <text className="spatium-cursor-name" x="5" y="11">
                  {actor.name}
                </text>
              </g>
            </g>
          ))}
        </svg>
      </div>
      <p className="spatium-caption">two cursors, one floor plan · furniture snaps on release</p>
    </div>
  );
}
