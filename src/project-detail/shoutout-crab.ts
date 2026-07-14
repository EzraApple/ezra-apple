// One source of truth for the crab's coat: the canonical set lives at
// /shoutout/crab, color variants in subdirectories, choice persisted so the
// visitor's crab follows them across the page.

export const CRAB_COATS = [
  "default",
  "amber",
  "bubblegum",
  "emerald",
  "grape",
  "pearl",
] as const;

export type CrabCoat = (typeof CRAB_COATS)[number];

const STORAGE_KEY = "shoutout-crab-coat";
export const COAT_EVENT = "shoutout-crab-coat";

export function crabFrame(coat: CrabCoat, name: string): string {
  return coat === "default"
    ? `/shoutout/crab/${name}.png`
    : `/shoutout/crab/${coat}/${name}.png`;
}

export function loadCoat(): CrabCoat {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return (CRAB_COATS as readonly string[]).includes(stored ?? "")
      ? (stored as CrabCoat)
      : "default";
  } catch {
    return "default";
  }
}

export function saveCoat(coat: CrabCoat): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, coat);
  } catch {
    // storage unavailable; the choice still applies for this visit
  }
  window.dispatchEvent(new CustomEvent(COAT_EVENT, { detail: coat }));
}
