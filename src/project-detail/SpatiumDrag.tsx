import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import {
  CURSOR_COLOR_EVENT,
  loadCursorColor,
  ROOMMATE_COLOR,
} from "./spatium-cursor";

// The Experience section: you drag the furniture yourself. Grab a piece,
// drop it anywhere — it snaps to the same 24px grid the app uses — while
// the roommate keeps tidying on their side of the room. The panel itself
// dresses in Spatium's blueprint styling: one step deeper into the app.

const GRID = 24;
const VB_W = 640;
const VB_H = 320;
const CURSOR_PATH = "M4 4L10.5 20L12.5 13.5L19 11.5L4 4Z";
const STEP_MS = 90;

type Piece = {
  id: string;
  label: string;
  shape: "rect" | "circle";
  w: number;
  h: number;
};

const PIECES: Piece[] = [
  { id: "couch", label: "couch", shape: "rect", w: 120, h: 42 },
  { id: "table", label: "table", shape: "circle", w: 56, h: 56 },
  { id: "bed", label: "bed", shape: "rect", w: 84, h: 108 },
];

const INITIAL: Record<string, { x: number; y: number }> = {
  couch: { x: 72, y: 120 },
  table: { x: 264, y: 192 },
  bed: { x: 480, y: 72 },
};

const randomBetween = (min: number, max: number) =>
  min + Math.random() * (max - min);
const snap = (value: number) => Math.round(value / GRID) * GRID;
const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function SpatiumDrag() {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const svgRef = useRef<SVGSVGElement>(null);
  const [positions, setPositions] = useState(INITIAL);
  const [dragging, setDragging] = useState<string | null>(null);
  const [snapped, setSnapped] = useState<string | null>(null);
  const [log, setLog] = useState("> drag a piece · release to snap");
  const [myColor, setMyColor] = useState(loadCursorColor);
  const [mate, setMate] = useState({ x: 540, y: 250, dragging: false });
  const grabOffset = useRef({ x: 0, y: 0 });
  const draggingRef = useRef<string | null>(null);
  const positionsRef = useRef({ ...INITIAL });
  const cancelled = useRef(false);

  useEffect(() => {
    const onColor = (event: Event) =>
      setMyColor((event as CustomEvent<string>).detail);
    window.addEventListener(CURSOR_COLOR_EVENT, onColor);
    return () => window.removeEventListener(CURSOR_COLOR_EVENT, onColor);
  }, []);

  const toSvg = (clientX: number, clientY: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: ((clientX - rect.left) * VB_W) / rect.width,
      y: ((clientY - rect.top) * VB_H) / rect.height,
    };
  };

  const applyPosition = (id: string, x: number, y: number) => {
    positionsRef.current[id] = { x, y };
    setPositions({ ...positionsRef.current });
  };

  const startDrag = (id: string, clientX: number, clientY: number) => {
    const point = toSvg(clientX, clientY);
    const pos = positionsRef.current[id];
    grabOffset.current = { x: point.x - pos.x, y: point.y - pos.y };
    draggingRef.current = id;
    setDragging(id);
  };

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const id = draggingRef.current;
      if (!id) return;
      const piece = PIECES.find((entry) => entry.id === id);
      if (!piece) return;
      const point = toSvg(event.clientX, event.clientY);
      applyPosition(
        id,
        clamp(point.x - grabOffset.current.x, 8, VB_W - 8 - piece.w),
        clamp(point.y - grabOffset.current.y, 8, VB_H - 8 - piece.h),
      );
    };
    const onUp = () => {
      const id = draggingRef.current;
      if (!id) return;
      draggingRef.current = null;
      const pos = positionsRef.current[id];
      const snappedPos = { x: snap(pos.x), y: snap(pos.y) };
      applyPosition(id, snappedPos.x, snappedPos.y);
      setDragging(null);
      setSnapped(id);
      setLog(
        `> furniture-move · ${id} · snapped to (${snappedPos.x}, ${snappedPos.y})`,
      );
      window.setTimeout(() => setSnapped((current) =>
        current === id ? null : current,
      ), 600);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  // The roommate keeps tidying: drifts around and occasionally nudges a
  // piece you are not holding by a grid cell or two.
  useEffect(() => {
    if (shouldReduceMotion) return;
    cancelled.current = false;
    const sleep = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));
    const mateRef = { x: 540, y: 250 };

    const glide = async (tx: number, ty: number, draggingId?: string) => {
      while (!cancelled.current) {
        const dx = tx - mateRef.x;
        const dy = ty - mateRef.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 5) return;
        const step = Math.min(22, distance);
        mateRef.x += (dx / distance) * step + randomBetween(-1, 1);
        mateRef.y += (dy / distance) * step + randomBetween(-1, 1);
        setMate({ x: mateRef.x, y: mateRef.y, dragging: Boolean(draggingId) });
        if (draggingId) {
          const piece = PIECES.find((entry) => entry.id === draggingId);
          if (piece) {
            applyPosition(
              draggingId,
              clamp(mateRef.x - piece.w / 2, 8, VB_W - 8 - piece.w),
              clamp(mateRef.y - piece.h / 2, 8, VB_H - 8 - piece.h),
            );
          }
        }
        await sleep(STEP_MS);
      }
    };

    const run = async () => {
      await sleep(1500);
      while (!cancelled.current) {
        await sleep(randomBetween(2600, 5200));
        const candidates = PIECES.filter(
          (piece) => piece.id !== draggingRef.current,
        );
        const piece =
          candidates[Math.floor(Math.random() * candidates.length)];
        const from = positionsRef.current[piece.id];
        await glide(from.x + piece.w / 2, from.y + piece.h / 2);
        if (cancelled.current) return;
        if (draggingRef.current === piece.id) continue;

        const target = {
          x: clamp(
            from.x + GRID * Math.round(randomBetween(-2, 2)),
            8,
            VB_W - 8 - piece.w,
          ),
          y: clamp(
            from.y + GRID * Math.round(randomBetween(-2, 2)),
            8,
            VB_H - 8 - piece.h,
          ),
        };
        await glide(target.x + piece.w / 2, target.y + piece.h / 2, piece.id);
        if (cancelled.current) return;
        applyPosition(piece.id, snap(positionsRef.current[piece.id].x), snap(positionsRef.current[piece.id].y));
        setMate((current) => ({ ...current, dragging: false }));
        setSnapped(piece.id);
        setLog(`> furniture-moved · ${piece.id} · roommate`);
        await sleep(600);
        setSnapped((current) => (current === piece.id ? null : current));
        await glide(randomBetween(60, 580), randomBetween(50, 270));
      }
    };

    void run();
    return () => {
      cancelled.current = true;
    };
  }, [shouldReduceMotion]);

  return (
    <div className="spatium-drag">
      <div className="spatium-drag-panel">
        <svg
          fill="none"
          ref={svgRef}
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              height={GRID}
              id="spatium-drag-grid"
              patternUnits="userSpaceOnUse"
              width={GRID}
            >
              <path
                className="spb-grid-line"
                d={`M ${GRID} 0 L 0 0 0 ${GRID}`}
              />
            </pattern>
          </defs>
          <rect fill="url(#spatium-drag-grid)" height={VB_H} width={VB_W} />

          {PIECES.map((piece) => {
            const pos = positions[piece.id];
            return (
              <g
                className="spb-piece"
                data-dragging={dragging === piece.id}
                data-snapped={snapped === piece.id}
                key={piece.id}
                onPointerDown={(event) => {
                  event.preventDefault();
                  startDrag(piece.id, event.clientX, event.clientY);
                }}
                style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
              >
                {piece.shape === "circle" ? (
                  <circle cx={piece.w / 2} cy={piece.h / 2} r={piece.w / 2} />
                ) : (
                  <rect height={piece.h} rx="4" width={piece.w} />
                )}
                <text textAnchor="middle" x={piece.w / 2} y={piece.h / 2 + 3.5}>
                  {piece.label}
                </text>
              </g>
            );
          })}

          <g
            className="spatium-cursor"
            style={{ transform: `translate(${mate.x}px, ${mate.y}px)` }}
          >
            <path
              d={CURSOR_PATH}
              fill={ROOMMATE_COLOR}
              stroke="#fff"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
            <g transform="translate(14, 22)">
              <rect fill={ROOMMATE_COLOR} height="15" rx="3" width="68" />
              <text className="spatium-cursor-name" x="5" y="11">
                roommate
              </text>
            </g>
          </g>
        </svg>

        <span className="spb-you" style={{ color: myColor }}>
          <svg fill="none" height="13" viewBox="0 0 24 24" width="13">
            <path
              d={CURSOR_PATH}
              fill="currentColor"
              stroke="#fff"
              strokeWidth="2"
            />
          </svg>
          you
        </span>
      </div>
      <p className="spatium-drag-log">{log}</p>
    </div>
  );
}
