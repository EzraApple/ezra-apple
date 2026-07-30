import { useReducedMotion } from "motion/react";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type PointerEvent,
} from "react";

type SceneMode = "2d" | "3d";
type Guess = {
  rank: number;
  similarity: number;
  word: string;
  x: number;
  y: number;
  z: number;
};

const MODE_KEY = "ezra-apple:cosmic-mode";
const MODE_EVENT = "ezra-apple:cosmic-mode-change";
const TARGET = "music";

type SourcePosition = {
  rank: number;
  x: number;
  y: number;
  z: number;
};

const WORD_COUNT = 317_000;

// Mirrors Cosmic Hot Potato's answer-relative public-puzzle transform.
function spiralPosition({ rank, x, y, z }: SourcePosition) {
  if (rank === 0) return { x: 0, y: 0, z: 0 };
  const rankDistance = rank / (WORD_COUNT - 1);
  const radius = 0.035 + Math.pow(rankDistance, 0.55) * 0.88;
  const baseAngle = Math.atan2(y, x);
  const angle = baseAngle + radius * Math.PI * 3.35 + z * 0.95;
  const armWave = Math.sin(angle * 3 - radius * 9 + z * 4);
  const armRadius = radius * (1 + armWave * 0.08);
  const depthWave = Math.sin(angle * 2 + radius * 7) * 0.16 * (1 - rankDistance);

  return {
    x: Math.cos(angle) * armRadius,
    y: Math.sin(angle) * armRadius,
    z: Math.max(-1, Math.min(1, z * 0.46 + depthWave)),
  };
}

// Similarities and source positions come from Cosmic Hot Potato's normalized
// GloVe dataset and deterministic UMAP projection. The public game then bends
// those positions around the answer with spiralPosition.
const SOURCE_GUESS_POCKET = [
  { word: "song", rank: 14, similarity: 0.7985, x: -0.066, y: -0.002, z: -0.462 },
  { word: "concert", rank: 18, similarity: 0.7768, x: -0.074, y: -0.052, z: -0.438 },
  { word: "artist", rank: 20, similarity: 0.7755, x: -0.077, y: -0.021, z: -0.422 },
  { word: "sound", rank: 38, similarity: 0.7472, x: -0.124, y: 0.038, z: -0.465 },
  { word: "piano", rank: 40, similarity: 0.7451, x: -0.059, y: -0.047, z: -0.531 },
  { word: "video", rank: 85, similarity: 0.6985, x: -0.045, y: 0.058, z: -0.307 },
  { word: "language", rank: 281, similarity: 0.6007, x: -0.164, y: -0.017, z: -0.239 },
  { word: "game", rank: 1434, similarity: 0.4584, x: 0.161, y: 0.096, z: 0.315 },
  { word: "city", rank: 2117, similarity: 0.4159, x: 0.194, y: 0.182, z: -0.108 },
  { word: "planet", rank: 7009, similarity: 0.259, x: 0.233, y: 0.255, z: -0.059 },
  { word: "river", rank: 6543, similarity: 0.2708, x: 0.251, y: 0.348, z: -0.168 },
  { word: "potato", rank: 15860, similarity: 0.1068, x: 0.2, y: 0.579, z: -0.38 },
];

const GUESS_POCKET: Guess[] = SOURCE_GUESS_POCKET.map((guess) => ({
  ...guess,
  ...spiralPosition(guess),
}));

const CLUSTER_ANGLES = [-2.72, -1.34, -0.16, 1.08, 2.28];
const CLUSTER_DEPTHS = [-0.34, 0.18, -0.08, 0.38, -0.22];
const unitNoise = (seed: number) => {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
};

// A legible sample of the game's 30k-point field: uneven UMAP neighborhoods
// become dense pockets along the same rank-driven spiral used by the product.
const FIELD_POINTS = Array.from({ length: 108 }, (_, index) => {
  const cluster = index % CLUSTER_ANGLES.length;
  const clusterProgress = Math.floor(index / CLUSTER_ANGLES.length);
  const sourceAngle =
    CLUSTER_ANGLES[cluster] +
    (unitNoise(index + 19) - 0.5) * (0.28 + cluster * 0.035);
  const sourceRadius = 0.12 + unitNoise(index + 47) * 0.34;
  const sourceZ =
    CLUSTER_DEPTHS[cluster] + (unitNoise(index + 83) - 0.5) * 0.24;
  const rankProgress = (clusterProgress + 1) / 22;
  const rank = Math.round(
    24 +
      Math.pow(rankProgress, 1.72) * 72_000 +
      cluster * 620 +
      unitNoise(index + 113) * 940,
  );

  return {
    ...spiralPosition({
      rank,
      x: Math.cos(sourceAngle) * sourceRadius,
      y: Math.sin(sourceAngle) * sourceRadius,
      z: sourceZ,
    }),
    r: 0.82 + unitNoise(index + 151) * 1.18,
  };
});

function loadMode(): SceneMode {
  if (typeof window === "undefined") return "3d";
  return window.localStorage.getItem(MODE_KEY) === "2d" ? "2d" : "3d";
}

function saveMode(mode: SceneMode) {
  window.localStorage.setItem(MODE_KEY, mode);
  window.dispatchEvent(new CustomEvent(MODE_EVENT, { detail: mode }));
}

function useSceneMode() {
  const [mode, setMode] = useState<SceneMode>(loadMode);

  useEffect(() => {
    const onMode = (event: Event) =>
      setMode((event as CustomEvent<SceneMode>).detail);
    window.addEventListener(MODE_EVENT, onMode);
    return () => window.removeEventListener(MODE_EVENT, onMode);
  }, []);

  return [mode, saveMode] as const;
}

function ModeToggle() {
  const [mode, setMode] = useSceneMode();
  return (
    <div aria-label="Semantic map mode" className="cosmic-mode-toggle" role="group">
      {(["2d", "3d"] as const).map((option) => (
        <button
          aria-pressed={mode === option}
          key={option}
          onClick={() => setMode(option)}
          type="button"
        >
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function temperatureFor(similarity: number) {
  if (similarity >= 0.77) return "very-hot";
  if (similarity >= 0.68) return "hot";
  if (similarity >= 0.45) return "warm";
  if (similarity >= 0.25) return "tepid";
  return "cold";
}

function SemanticField({
  guesses = GUESS_POCKET.slice(0, 4),
  interactive = false,
  labelled = false,
  focusNonce = 0,
  selectedWord,
}: {
  guesses?: Guess[];
  interactive?: boolean;
  labelled?: boolean;
  focusNonce?: number;
  selectedWord?: string;
}) {
  const [mode] = useSceneMode();
  const [yaw, setYaw] = useState(-0.52);
  const [pitch, setPitch] = useState(-0.18);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{
    panX: number;
    panY: number;
    pitch: number;
    pointerId: number;
    x: number;
    y: number;
    yaw: number;
  } | null>(null);

  useEffect(() => {
    setYaw(-0.52);
    setPitch(-0.18);
    setPan({ x: 0, y: 0 });
  }, [focusNonce]);

  const center = mode === "2d"
    ? { x: 260 + pan.x, y: 140 + pan.y }
    : { x: 260, y: 140 };

  const project = (point: { x: number; y: number; z: number }) => {
    if (mode === "2d") {
      return {
        depth: 0,
        x: center.x + point.x * 208,
        y: center.y + point.y * 132,
      };
    }
    const rotatedX = point.x * Math.cos(yaw) - point.z * Math.sin(yaw);
    const yawDepth = point.x * Math.sin(yaw) + point.z * Math.cos(yaw);
    const rotatedY = point.y * Math.cos(pitch) - yawDepth * Math.sin(pitch);
    const depth = point.y * Math.sin(pitch) + yawDepth * Math.cos(pitch);
    return {
      depth,
      x: 260 + rotatedX * 196,
      y: 140 + rotatedY * 118 - depth * 38,
    };
  };

  const onPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if (!interactive) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      panX: pan.x,
      panY: pan.y,
      pitch,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      yaw,
    };
  };
  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.current.x;
    const deltaY = event.clientY - drag.current.y;
    if (mode === "3d") {
      setYaw(drag.current.yaw + deltaX / 170);
      setPitch(Math.max(-0.78, Math.min(0.78, drag.current.pitch + deltaY / 190)));
      return;
    }
    setPan({
      x: Math.max(-150, Math.min(150, drag.current.panX + deltaX)),
      y: Math.max(-90, Math.min(90, drag.current.panY + deltaY)),
    });
  };
  const endDrag = (event: PointerEvent<SVGSVGElement>) => {
    if (drag.current?.pointerId === event.pointerId) drag.current = null;
  };

  return (
    <svg
      aria-label={labelled || interactive ? "Draggable semantic map around the hidden word" : undefined}
      aria-hidden={labelled || interactive ? undefined : true}
      className="cosmic-field"
      data-interactive={interactive}
      data-mode={mode}
      onPointerCancel={endDrag}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      role={labelled || interactive ? "img" : undefined}
      viewBox="0 0 520 280"
    >
      {mode === "2d" ? (
        <g className="cosmic-grid cosmic-grid-2d" transform={`translate(${pan.x} ${pan.y})`}>
          {[-160, -80, 0, 80, 160].map((offset) => (
            <line key={`v-${offset}`} x1={260 + offset} x2={260 + offset} y1="34" y2="246" />
          ))}
          {[-80, -40, 0, 40, 80].map((offset) => (
            <line key={`h-${offset}`} x1="56" x2="464" y1={140 + offset} y2={140 + offset} />
          ))}
        </g>
      ) : (
        <g className="cosmic-grid cosmic-grid-3d">
          <path d="M260 140 L54 224 M260 140 L466 224 M260 140 L260 30" />
          <ellipse cx="260" cy="163" rx="86" ry="28" />
          <ellipse cx="260" cy="179" rx="154" ry="49" />
        </g>
      )}
      <g className="cosmic-cloud">
        {FIELD_POINTS.map((point, index) => {
          const projected = project(point);
          return (
            <circle
              cx={projected.x}
              cy={projected.y}
              key={index}
              opacity={mode === "3d" ? 0.22 + (projected.depth + 1) * 0.18 : 0.32}
              r={point.r * (mode === "3d" ? 1.1 + projected.depth * 0.34 : 1)}
            />
          );
        })}
      </g>
      <circle className="cosmic-target" cx={center.x} cy={center.y} r="10" />
      <circle className="cosmic-target-ring" cx={center.x} cy={center.y} r="34" />
      {guesses.map((guess) => {
        const projected = project(guess);
        const isSelected = selectedWord === guess.word;
        return (
          <g
            className="cosmic-guess-point"
            data-selected={isSelected}
            data-temperature={temperatureFor(guess.similarity)}
            key={guess.word}
          >
            <line x1={center.x} x2={projected.x} y1={center.y} y2={projected.y} />
            <circle
              cx={projected.x}
              cy={projected.y}
              r={(isSelected ? 7 : 4) + guess.similarity * 3}
            />
            {labelled ? (
              <text x={projected.x + 10} y={projected.y - 8}>
                {guess.word} · {(guess.similarity * 100).toFixed(0)}
              </text>
            ) : null}
          </g>
        );
      })}
      <text className="cosmic-mode-note" x="18" y="264">
        {mode === "3d" && interactive
          ? "drag to orbit · horizontal + vertical"
          : mode === "3d"
            ? "perspective x · y · z"
            : interactive
              ? "drag to pan · flat x · y"
              : "flat x · y projection"}
      </text>
    </svg>
  );
}

function CosmicGamePanel({
  compact = false,
  guesses,
  input = "",
  message = "Try a broad noun, place, or idea.",
  onCenter,
  onInput,
  onReset,
  onSubmit,
}: {
  compact?: boolean;
  guesses: Guess[];
  input?: string;
  message?: string;
  onCenter?: () => void;
  onInput?: (value: string) => void;
  onReset?: () => void;
  onSubmit?: (event: FormEvent) => void;
}) {
  const [chronological, setChronological] = useState(true);
  const best = [...guesses].sort((a, b) => a.rank - b.rank)[0];
  const ordered = chronological
    ? guesses
    : [...guesses].sort((a, b) => b.similarity - a.similarity);
  const buckets = ["cold", "tepid", "warm", "hot", "very-hot"].map((temperature) =>
    guesses.filter((guess) => temperatureFor(guess.similarity) === temperature).length,
  );
  const maxBucket = Math.max(1, ...buckets);

  return (
    <aside className="cosmic-game-panel" data-compact={compact}>
      <header className="cosmic-panel-header">
        <div>
          <span>Semantic vector field</span>
          <strong>Cosmic Hot Potato</strong>
          <small>30,000-word map</small>
        </div>
        <div className="cosmic-panel-actions">
          <ModeToggle />
          <button aria-label="Center view" disabled={!onCenter} onClick={onCenter} type="button">⌖</button>
          <button aria-label="Reset puzzle progress" disabled={!onReset} onClick={onReset} type="button">↻</button>
        </div>
      </header>
      <div className="cosmic-day-band">
        <span>‹</span>
        <div><small>Today</small><strong>Portfolio puzzle</strong><i>target hidden</i></div>
        <span>›</span>
      </div>
      <div className="cosmic-metrics">
        <div><strong>{guesses.length}</strong><span>guesses</span></div>
        <div><strong>{best ? `#${best.rank}` : "--"}</strong><span>best rank</span></div>
        <div><strong>{best ? best.similarity.toFixed(3) : "--"}</strong><span>similarity</span></div>
      </div>
      <div className="cosmic-panel-controls">
        <div><span>12-word demo pocket</span><small>vectors ready</small></div>
        <button onClick={() => setChronological((current) => !current)} type="button">
          ⇅ {chronological ? "Timeline" : "Closest"}
        </button>
      </div>
      <div className="cosmic-spectrum">
        <header><span>guess spectrum</span><span>{guesses.length} sampled</span></header>
        <div>
          {buckets.map((count, index) => (
            <i
              data-temperature={["cold", "tepid", "warm", "hot", "very-hot"][index]}
              key={index}
              style={{ "--bar-height": `${Math.max(12, (count / maxBucket) * 100)}%` } as CSSProperties}
            />
          ))}
        </div>
        <footer><span>cold</span><span>target</span></footer>
      </div>
      <ol className="cosmic-guess-list">
        {ordered.length === 0 ? (
          <li className="cosmic-panel-empty"><strong>No guesses yet</strong><span>Try song, piano, city, or potato.</span></li>
        ) : (
          ordered.slice(compact ? -3 : -5).map((guess, index) => (
            <li
              data-latest={index === ordered.slice(compact ? -3 : -5).length - 1}
              data-temperature={temperatureFor(guess.similarity)}
              key={guess.word}
            >
              <span>{guess.word}</span>
              <strong>#{guess.rank}</strong>
              <i>{guess.similarity.toFixed(4)}</i>
            </li>
          ))
        )}
      </ol>
      <form className="cosmic-guess-form" onSubmit={onSubmit ?? ((event) => event.preventDefault())}>
        <p aria-live="polite">{message}</p>
        <div>
          <input
            autoComplete="off"
            disabled={!onInput}
            onChange={(event) => onInput?.(event.target.value)}
            placeholder="Enter a word"
            value={input}
          />
          <button disabled={!onSubmit || !input.trim()} type="submit">Guess ↗</button>
        </div>
      </form>
    </aside>
  );
}

export function CosmicHotPotatoScene() {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const [guessCount, setGuessCount] = useState(shouldReduceMotion ? 4 : 2);
  const [mode] = useSceneMode();
  const [focusNonce, setFocusNonce] = useState(0);

  useEffect(() => {
    if (shouldReduceMotion) {
      setGuessCount(4);
      return;
    }
    const timer = window.setInterval(
      () => setGuessCount((count) => Math.min(count + 1, 4)),
      720,
    );
    return () => window.clearInterval(timer);
  }, [shouldReduceMotion]);

  return (
    <div className="cosmic-scene cosmic-game-shell" data-mode={mode}>
      <div className="cosmic-game-map">
        <SemanticField
          focusNonce={focusNonce}
          guesses={GUESS_POCKET.slice(0, guessCount)}
          interactive
        />
        <span className="cosmic-map-math">Map math · 50D → UMAP → 3D</span>
      </div>
      <CosmicGamePanel
        compact
        guesses={GUESS_POCKET.slice(0, guessCount)}
        onCenter={() => setFocusNonce((current) => current + 1)}
        onReset={() => setGuessCount(shouldReduceMotion ? 4 : 0)}
      />
    </div>
  );
}

export function CosmicHotPotatoExperience() {
  const [input, setInput] = useState("");
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [message, setMessage] = useState("Try song, piano, city, or potato.");
  const [focusNonce, setFocusNonce] = useState(0);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const word = input.trim().toLowerCase();
    if (!word) return;
    if (word === TARGET) {
      setMessage("Correct · the target was music.");
      setInput("");
      return;
    }
    const guess = GUESS_POCKET.find((candidate) => candidate.word === word);
    if (!guess) {
      setMessage("That word is outside this small portfolio pocket.");
      return;
    }
    setGuesses((current) =>
      current.some((candidate) => candidate.word === word)
        ? current
        : [...current, guess],
    );
    setMessage(`${word} · cos θ ${guess.similarity.toFixed(4)}`);
    setInput("");
  };

  return (
    <div className="cosmic-experience cosmic-game-shell">
      <div className="cosmic-game-map">
        <SemanticField focusNonce={focusNonce} guesses={guesses} interactive labelled />
        <span className="cosmic-map-math">drag to orbit · scroll to inspect depth</span>
      </div>
      <CosmicGamePanel
        guesses={guesses}
        input={input}
        message={message}
        onCenter={() => setFocusNonce((current) => current + 1)}
        onInput={setInput}
        onReset={() => {
          setGuesses([]);
          setMessage("Puzzle reset. Try a broad noun, place, or idea.");
        }}
        onSubmit={submit}
      />
    </div>
  );
}

export function CosmicHotPotatoSystem() {
  const [mode] = useSceneMode();
  const [selectedWord, setSelectedWord] = useState("song");
  const selected = GUESS_POCKET.find((guess) => guess.word === selectedWord) ?? GUESS_POCKET[0];
  const dimensions = [
    { label: "d07", guess: selected.x, target: -0.08 },
    { label: "d18", guess: selected.y, target: -0.01 },
    { label: "d31", guess: selected.z, target: -0.49 },
    { label: "rest", guess: selected.similarity, target: 1 },
  ];
  const angle = Math.acos(selected.similarity);
  const endpoint = {
    x: 34 + Math.cos(angle) * 145,
    y: 126 - Math.sin(angle) * 96,
  };
  const arcEnd = {
    x: 34 + Math.cos(angle) * 42,
    y: 126 - Math.sin(angle) * 42,
  };

  return (
    <div className="cosmic-system" data-mode={mode}>
      <div className="cosmic-vectors">
        <header><span>50d vector sample</span><strong>{selected.word}</strong></header>
        <div className="cosmic-vector-words">
          {GUESS_POCKET.slice(0, 4).map((guess) => (
            <button
              aria-pressed={selected.word === guess.word}
              key={guess.word}
              onClick={() => setSelectedWord(guess.word)}
              type="button"
            >
              {guess.word}
            </button>
          ))}
        </div>
        <div className="cosmic-vector-bars">
          {dimensions.map((dimension, index) => (
            <div data-warm={index === 3} key={dimension.label}>
              <span>{dimension.label}</span>
              <i style={{ "--guess-size": `${Math.max(8, Math.abs(dimension.guess) * 100)}%` } as CSSProperties} />
              <i style={{ "--target-size": `${Math.max(8, Math.abs(dimension.target) * 100)}%` } as CSSProperties} />
              <small>{dimension.guess.toFixed(2)}</small>
            </div>
          ))}
        </div>
        <p><span /> guess vector <i /> hidden target</p>
      </div>
      <div className="cosmic-angle">
        <svg aria-label="Angle between guess and target vectors" role="img" viewBox="0 0 220 160">
          <line className="cosmic-angle-target" x1="34" x2="196" y1="126" y2="126" />
          <line x1="34" x2={endpoint.x} y1="126" y2={endpoint.y} />
          <path d={`M76 126 A42 42 0 0 0 ${arcEnd.x} ${arcEnd.y}`} />
          <circle cx="34" cy="126" r="4" />
          <text x="72" y="108">θ</text>
        </svg>
        <strong>cos θ = {selected.similarity.toFixed(4)}</strong>
        <span>scored locally</span>
      </div>
      <div className="cosmic-projection">
        <header>
          <span>UMAP projection</span>
          <ModeToggle />
        </header>
        <SemanticField
          guesses={GUESS_POCKET.slice(0, 5)}
          interactive
          labelled
          selectedWord={selected.word}
        />
        <p>30,000 points in-browser · 317,000+ words score server-side</p>
      </div>
    </div>
  );
}

export function CosmicHotPotatoOrigin() {
  return (
    <div className="cosmic-origin">
      <div>
        <span>why a map?</span>
        <h2>Similarity should feel like a place, not another number.</h2>
        <p>
          A daily Semantle-style game became an excuse to make the embedding
          itself playable: guesses orbit a hidden answer and meaning acquires
          direction, depth, and temperature.
        </p>
      </div>
      <dl>
        <div><dt>jun 11</dt><dd>date-scoped daily puzzles shipped</dd></div>
        <div><dt>50d</dt><dd>Stanford GloVe 6B vectors</dd></div>
        <div><dt>UMAP</dt><dd>24 neighbors · cosine distance</dd></div>
        <div><dt>runtime</dt><dd>no embedding service</dd></div>
      </dl>
    </div>
  );
}
