// Your multiplayer identity in the Spatium demos: one of the app's real
// cursor palette colors, persisted so your cursor follows you across the
// hero scene and the drag demo.

export const SPATIUM_CURSOR_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
] as const;

const STORAGE_KEY = "spatium-cursor-color";
export const CURSOR_COLOR_EVENT = "spatium-cursor-color";
export const ROOMMATE_COLOR = "#f97316";

export function loadCursorColor(): string {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return (SPATIUM_CURSOR_COLORS as readonly string[]).includes(stored ?? "")
      ? (stored as string)
      : SPATIUM_CURSOR_COLORS[0];
  } catch {
    return SPATIUM_CURSOR_COLORS[0];
  }
}

export function saveCursorColor(color: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, color);
  } catch {
    // storage unavailable; the choice still applies for this visit
  }
  window.dispatchEvent(new CustomEvent(CURSOR_COLOR_EVENT, { detail: color }));
}
