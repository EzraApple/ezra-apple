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
  similarity: number;
  word: string;
  x: number;
  y: number;
  z: number;
};

const MODE_KEY = "ezra-apple:cosmic-mode";
const MODE_EVENT = "ezra-apple:cosmic-mode-change";
const TARGET = "music";

// Similarities and positions come from Cosmic Hot Potato's normalized GloVe
// 50d dataset and its deterministic UMAP projection.
const GUESS_POCKET: Guess[] = [
  { word: "song", similarity: 0.7985, x: -0.066, y: -0.002, z: -0.462 },
  { word: "concert", similarity: 0.7768, x: -0.074, y: -0.052, z: -0.438 },
  { word: "artist", similarity: 0.7755, x: -0.077, y: -0.021, z: -0.422 },
  { word: "sound", similarity: 0.7472, x: -0.124, y: 0.038, z: -0.465 },
  { word: "piano", similarity: 0.7451, x: -0.059, y: -0.047, z: -0.531 },
  { word: "video", similarity: 0.6985, x: -0.045, y: 0.058, z: -0.307 },
  { word: "language", similarity: 0.6007, x: -0.164, y: -0.017, z: -0.239 },
  { word: "game", similarity: 0.4584, x: 0.161, y: 0.096, z: 0.315 },
  { word: "city", similarity: 0.4159, x: 0.194, y: 0.182, z: -0.108 },
  { word: "planet", similarity: 0.259, x: 0.233, y: 0.255, z: -0.059 },
  { word: "river", similarity: 0.2708, x: 0.251, y: 0.348, z: -0.168 },
  { word: "potato", similarity: 0.1068, x: 0.2, y: 0.579, z: -0.38 },
];

const FIELD_POINTS = Array.from({ length: 54 }, (_, index) => ({
  x: ((((index * 83) % 101) - 50) / 50) * 0.92,
  y: ((((index * 47) % 97) - 48) / 48) * 0.72,
  z: ((((index * 61) % 89) - 44) / 44) * 0.78,
  r: index % 11 === 0 ? 2 : 1.15,
}));

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

function SemanticField({
  guesses = GUESS_POCKET.slice(0, 4),
  interactive = false,
  labelled = false,
  selectedWord,
}: {
  guesses?: Guess[];
  interactive?: boolean;
  labelled?: boolean;
  selectedWord?: string;
}) {
  const [mode] = useSceneMode();
  const [yaw, setYaw] = useState(-0.52);
  const drag = useRef<{ pointerId: number; x: number; yaw: number } | null>(null);

  const project = (point: { x: number; y: number; z: number }) => {
    if (mode === "2d") {
      return { depth: 0, x: 260 + point.x * 208, y: 140 + point.y * 132 };
    }
    const rotatedX = point.x * Math.cos(yaw) - point.z * Math.sin(yaw);
    const depth = point.x * Math.sin(yaw) + point.z * Math.cos(yaw);
    return {
      depth,
      x: 260 + rotatedX * 196,
      y: 140 + point.y * 118 - depth * 46,
    };
  };

  const onPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if (!interactive || mode !== "3d") return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { pointerId: event.pointerId, x: event.clientX, yaw };
  };
  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    setYaw(drag.current.yaw + (event.clientX - drag.current.x) / 170);
  };
  const endDrag = (event: PointerEvent<SVGSVGElement>) => {
    if (drag.current?.pointerId === event.pointerId) drag.current = null;
  };

  return (
    <svg
      aria-label={labelled ? "Semantic map around the hidden word" : undefined}
      aria-hidden={labelled ? undefined : true}
      className="cosmic-field"
      data-interactive={interactive}
      data-mode={mode}
      onPointerCancel={endDrag}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      role={labelled ? "img" : undefined}
      viewBox="0 0 520 280"
    >
      {mode === "2d" ? (
        <g className="cosmic-grid cosmic-grid-2d">
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
      <circle className="cosmic-target" cx="260" cy="140" r="10" />
      <circle className="cosmic-target-ring" cx="260" cy="140" r="34" />
      {guesses.map((guess) => {
        const projected = project(guess);
        const isSelected = selectedWord === guess.word;
        return (
          <g className="cosmic-guess-point" data-selected={isSelected} key={guess.word}>
            <line x1="260" x2={projected.x} y1="140" y2={projected.y} />
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
          ? "drag to orbit x · y · z"
          : mode === "3d"
            ? "perspective x · y · z"
            : "flat x · y projection"}
      </text>
    </svg>
  );
}

export function CosmicHotPotatoScene() {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const [guessCount, setGuessCount] = useState(shouldReduceMotion ? 4 : 2);
  const [mode] = useSceneMode();

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
    <div className="cosmic-scene" data-mode={mode}>
      <header>
        <span>semantic field / daily</span>
        <ModeToggle />
      </header>
      <SemanticField guesses={GUESS_POCKET.slice(0, guessCount)} />
      <footer>
        <span>target · hidden</span>
        <span>{guessCount} {guessCount === 1 ? "guess" : "guesses"} plotted</span>
      </footer>
    </div>
  );
}

export function CosmicHotPotatoExperience() {
  const [input, setInput] = useState("");
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [message, setMessage] = useState("Try song, piano, city, or potato.");

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
    <div className="cosmic-experience">
      <div className="cosmic-map-panel">
        <SemanticField guesses={guesses} interactive labelled />
        <ModeToggle />
      </div>
      <div className="cosmic-console">
        <header>
          <span>puzzle / meaning</span>
          <strong>{guesses.length}</strong>
        </header>
        <ol>
          {guesses.length === 0 ? (
            <li className="cosmic-empty">
              <strong>make your first jump</strong>
              <span>song · piano · city · potato</span>
            </li>
          ) : (
            [...guesses].reverse().map((guess, index) => (
              <li key={guess.word}>
                <span>{String(guesses.length - index).padStart(2, "0")}</span>
                <strong>{guess.word}</strong>
                <i>{guess.similarity.toFixed(4)}</i>
              </li>
            ))
          )}
        </ol>
        <p aria-live="polite">{message}</p>
        <form onSubmit={submit}>
          <label htmlFor="cosmic-guess">guess</label>
          <input
            autoComplete="off"
            id="cosmic-guess"
            onChange={(event) => setInput(event.target.value)}
            placeholder="semantic jump"
            value={input}
          />
          <button disabled={!input.trim()} type="submit">plot</button>
        </form>
      </div>
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
