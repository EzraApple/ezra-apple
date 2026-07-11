import { defineProject } from "./schema";

export const shoutout = defineProject({
  schemaVersion: 1,
  slug: "shoutout",
  order: 0,
  published: true,
  name: "ShoutOut",
  category: "Local AI product",
  status: "Shipping",
  summary:
    "A local-first macOS dictation app that turns speech into clean text inside the app you are already using.",
  tags: ["macOS", "Swift", "Local AI", "Product"],
  links: [
    {
      kind: "product",
      label: "Visit ShoutOut",
      href: "https://shoutout.sh",
    },
  ],
  theme: {
    background: "oklch(0.145 0.018 254)",
    surface: "oklch(0.19 0.026 254)",
    foreground: "oklch(0.95 0.016 248)",
    muted: "oklch(0.69 0.035 250)",
    border: "oklch(0.35 0.045 250)",
    accent: "oklch(0.72 0.15 235)",
    accentSoft: "oklch(0.31 0.08 243)",
  },
  artifact: {
    kind: "flow",
    label: "Dictation pipeline",
    caption: "Hold, speak, release. The useful complexity stays out of the way.",
    items: [
      { label: "01", detail: "Listen globally" },
      { label: "02", detail: "Transcribe locally" },
      { label: "03", detail: "Clean conservatively" },
      { label: "04", detail: "Paste in context" },
    ],
  },
  depth: {
    what: {
      headline: "Dictation that behaves like a native input method.",
      body: "ShoutOut records from a global shortcut, runs its normal transcription path locally, and inserts the result into the focused app.",
      highlights: ["No account required", "Local transcription", "Works across macOS"],
    },
    experience: {
      headline: "Press, speak, and stay in flow.",
      body: "The product is designed around the app already in front of you, with hands-free and hold-to-talk modes plus careful paste formatting.",
      highlights: ["Fn/Globe shortcut", "Hands-free mode", "Context-aware insertion"],
    },
    decisions: [
      {
        title: "Local by default",
        summary: "Speech and cleanup stay on the Mac in the normal product path.",
      },
      {
        title: "Conservative cleanup",
        summary: "When a rewrite risks changing meaning, the original transcript wins.",
      },
    ],
    system: {
      headline: "A native pipeline from hotkey to focused field.",
      body: "A Swift macOS app coordinates recording, WhisperKit transcription, optional cleanup, validation, and smart insertion.",
      stack: ["Swift", "SwiftUI", "WhisperKit", "Core ML", "Sparkle"],
      flow: ["Global shortcut", "Audio capture", "Local transcription", "Validation", "Smart paste"],
    },
    proof: [
      {
        label: "Public product",
        note: "Download, product details, and current release information.",
        href: "https://shoutout.sh",
      },
    ],
  },
});
