import { defineProject } from "./schema";

export const leHarness = defineProject({
  schemaVersion: 1,
  slug: "leharness",
  order: 3,
  published: true,
  name: "LeHarness",
  category: "Agent runtime",
  status: "Open source",
  summary:
    "An agent harness written from scratch to understand loops, event logs, tools, background work, subagents, and compaction from the inside out.",
  tags: ["Agent runtime", "CLI", "Event sourcing", "MCP"],
  links: [
    {
      kind: "package",
      label: "View package",
      href: "https://www.npmjs.com/package/leharness",
    },
    {
      kind: "repository",
      label: "View source",
      href: "https://github.com/EzraApple/leharness",
    },
  ],
  theme: {
    background: "oklch(0.152 0.016 215)",
    surface: "oklch(0.198 0.024 210)",
    foreground: "oklch(0.95 0.02 95)",
    muted: "oklch(0.71 0.04 105)",
    border: "oklch(0.37 0.045 100)",
    accent: "oklch(0.79 0.14 82)",
    accentSoft: "oklch(0.34 0.065 90)",
    titleWeight: 680,
    titleWidth: 78,
  },
  artifact: {
    kind: "log",
    label: "Append-only session",
    caption: "Events remain canonical; prompts, notifications, and artifacts are projections over what happened.",
    items: [
      { label: "invocation.received", detail: "start the run" },
      { label: "model.completed", detail: "record tool calls" },
      { label: "task.started", detail: "continue in background" },
      { label: "artifact.created", detail: "persist large output" },
      { label: "task.completed", detail: "wake the session" },
    ],
  },
  depth: {
    what: {
      headline: "A harness built as a study of the machinery underneath agents.",
      body: "LeHarness keeps the core loop explicit while growing durable sessions, tools, background work, subagents, artifacts, skills, and MCP support around it.",
      highlights: ["Interactive CLI", "Multiple model providers", "Persistent local sessions"],
    },
    experience: {
      headline: "Run it as a TUI or send it one task and leave.",
      body: "The published lh command runs as an interactive TUI or a single one-shot prompt, speaks OpenAI, DeepSeek, and Ollama, and keeps session state under the working directory.",
      highlights: ["lh interactive TUI", "One-shot mode", "OpenAI, DeepSeek, Ollama", "Local session state"],
    },
    decisions: [
      {
        title: "Events are canonical",
        summary: "Session state is rebuilt from an append-only log instead of synchronized across parallel stores.",
      },
      {
        title: "Generic core, thin products",
        summary: "CLI, web, coding-agent, and bot surfaces should sit above the same channel-agnostic loop.",
      },
    ],
    system: {
      headline: "A small parent loop surrounded by durable runtime primitives.",
      body: "The kernel coordinates model steps and tool execution while tasks, subagents, artifacts, and compaction remain explicit services over event-sourced sessions.",
      stack: ["TypeScript", "Node.js", "CLI/TUI", "MCP", "Filesystem state"],
      flow: ["Invocation", "Append events", "Project session", "Run model loop", "Execute or background tools"],
    },
    proof: [
      {
        label: "npm package",
        note: "Installable as leharness with the lh command.",
        href: "https://www.npmjs.com/package/leharness",
      },
      {
        label: "Public source",
        note: "Kernel, CLI, research notes, and feature plans.",
        href: "https://github.com/EzraApple/leharness",
      },
    ],
  },
});
