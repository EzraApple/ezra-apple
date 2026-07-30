import { useReducedMotion } from "motion/react";
import { useEffect, useState, type FormEvent } from "react";

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

// These similarities and source positions are calculated directly from the
// normalized GloVe 50d vectors in Cosmic Hot Potato's generated dataset.
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

const FIELD_POINTS = Array.from({ length: 42 }, (_, index) => ({
  x: 40 + ((index * 83) % 430),
  y: 24 + ((index * 47) % 230),
  r: index % 9 === 0 ? 2 : 1,
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
  labelled = false,
}: {
  guesses?: Guess[];
  labelled?: boolean;
}) {
  const [mode] = useSceneMode();

  return (
    <svg
      aria-label={labelled ? "Semantic map around the hidden word" : undefined}
      aria-hidden={labelled ? undefined : true}
      className="cosmic-field"
      data-mode={mode}
      role={labelled ? "img" : undefined}
      viewBox="0 0 520 280"
    >
      <g className="cosmic-cloud">
        {FIELD_POINTS.map((point, index) => (
          <circle cx={point.x} cy={point.y} key={index} r={point.r} />
        ))}
      </g>
      <circle className="cosmic-target" cx="260" cy="140" r="10" />
      <circle className="cosmic-target-ring" cx="260" cy="140" r="34" />
      {guesses.map((guess) => {
        const distance = (1 - guess.similarity) * 210;
        const angle = Math.atan2(guess.y, guess.x);
        const depthOffset = mode === "3d" ? guess.z * 46 : 0;
        const x = 260 + Math.cos(angle) * distance + depthOffset;
        const y = 140 + Math.sin(angle) * distance * (mode === "3d" ? 0.56 : 0.82);
        return (
          <g className="cosmic-guess-point" key={guess.word}>
            <line x1="260" x2={x} y1="140" y2={y} />
            <circle cx={x} cy={y} r={4 + guess.similarity * 3} />
            {labelled ? <text x={x + 9} y={y + 4}>{guess.word}</text> : null}
          </g>
        );
      })}
    </svg>
  );
}

export function CosmicHotPotatoScene() {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const [guessCount, setGuessCount] = useState(shouldReduceMotion ? 4 : 1);
  const [mode] = useSceneMode();

  useEffect(() => {
    if (shouldReduceMotion) {
      setGuessCount(4);
      return;
    }
    const timer = window.setInterval(
      () => setGuessCount((count) => (count >= 4 ? 1 : count + 1)),
      1200,
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
        <span>{guessCount} guesses plotted</span>
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
        <SemanticField guesses={guesses} labelled />
        <ModeToggle />
      </div>
      <div className="cosmic-console">
        <header>
          <span>puzzle / meaning</span>
          <strong>{guesses.length}</strong>
        </header>
        <ol>
          {[...guesses].reverse().map((guess, index) => (
            <li key={guess.word}>
              <span>{String(guesses.length - index).padStart(2, "0")}</span>
              <strong>{guess.word}</strong>
              <i>{guess.similarity.toFixed(4)}</i>
            </li>
          ))}
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
  const vectorA = [0.31, -0.12, 0.48, 0.08, "…", 0.27];
  const vectorB = [0.28, -0.09, 0.42, 0.14, "…", 0.19];

  return (
    <div className="cosmic-system" data-mode={mode}>
      <div className="cosmic-vectors">
        <header>50d normalized vectors</header>
        <div><span>guess</span>{vectorA.map((value, index) => <i key={index}>{value}</i>)}</div>
        <div><span>target</span>{vectorB.map((value, index) => <i key={index}>{value}</i>)}</div>
      </div>
      <div className="cosmic-angle">
        <svg aria-label="Angle between guess and target vectors" role="img" viewBox="0 0 240 160">
          <line x1="28" x2="190" y1="132" y2="38" />
          <line x1="28" x2="212" y1="132" y2="112" />
          <path d="M76 104 A58 58 0 0 1 88 125" />
          <circle cx="28" cy="132" r="4" />
          <text x="92" y="102">cos θ</text>
        </svg>
        <strong>score every guess locally</strong>
      </div>
      <div className="cosmic-projection">
        <header>
          <span>UMAP projection</span>
          <ModeToggle />
        </header>
        <SemanticField guesses={GUESS_POCKET.slice(0, 5)} />
        <p>30,000 points in-browser · 317,000+ words score server-side</p>
      </div>
    </div>
  );
}

export function CosmicHotPotatoOrigin() {
  const [mode] = useSceneMode();
  return (
    <div className="cosmic-origin" data-mode={mode}>
      <div>
        <span>why a map?</span>
        <h2>Similarity should feel like a place, not another number.</h2>
        <p>
          A daily Semantle-style game became an excuse to make the embedding
          itself playable: guesses orbit a hidden answer and meaning acquires
          direction, depth, and temperature.
        </p>
        <ModeToggle />
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
