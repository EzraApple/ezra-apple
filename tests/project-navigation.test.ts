import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

const script = readFileSync(new URL("../public/project-navigation.js", import.meta.url), "utf8");

function clickReturnLink(referrer: string, length = 2, modifiers = {}) {
  const back = vi.fn();
  const preventDefault = vi.fn();
  let click: (event: unknown) => void = () => {};
  runInNewContext(script, {
    document: { referrer, querySelector: () => ({ addEventListener: (_: string, handler: typeof click) => { click = handler; } }) },
    history: { length, back },
    location: { origin: "https://ezraapple.dev" },
    URL,
  });
  click({ button: 0, preventDefault, ...modifiers });
  return { back, preventDefault };
}

describe("project return navigation", () => {
  it("returns to the existing homepage entry, including anchored visits", () => {
    for (const referrer of ["https://ezraapple.dev/", "https://ezraapple.dev/?from=github#projects"]) {
      const result = clickReturnLink(referrer);
      expect(result.preventDefault).toHaveBeenCalledOnce();
      expect(result.back).toHaveBeenCalledOnce();
    }
  });

  it("keeps the homepage fallback for direct, external, and other-page visits", () => {
    for (const [referrer, length] of [
      ["", 2],
      ["https://example.com/", 2],
      ["https://ezraapple.dev/resume/", 2],
      ["https://ezraapple.dev/", 1],
    ] as const) {
      const result = clickReturnLink(referrer, length);
      expect(result.preventDefault).not.toHaveBeenCalled();
      expect(result.back).not.toHaveBeenCalled();
    }
  });

  it("preserves modified clicks and new-tab gestures", () => {
    for (const modifiers of [{ metaKey: true }, { ctrlKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) {
      const result = clickReturnLink("https://ezraapple.dev/", 2, modifiers);
      expect(result.preventDefault).not.toHaveBeenCalled();
      expect(result.back).not.toHaveBeenCalled();
    }
  });
});
