import { defineProject } from "./schema";

export const leHarness = defineProject({
  slug: "leharness",
  order: 4,
  published: true,
  name: "LeHarness",
  category: "Agent runtime",
  status: "Public source",
  summary: "A command-line agent runtime with event-sourced sessions.",
  tags: [
    "Agent runtime",
    "CLI",
    "Event sourcing",
    "MCP"
  ],
  links: [
    {
      kind: "repository",
      label: "Read the README",
      href: "https://github.com/EzraApple/leharness#readme"
    },
    {
      kind: "package",
      label: "View package",
      href: "https://www.npmjs.com/package/leharness"
    }
  ],
  document: `# LeHarness

A command-line agent runtime with event-sourced sessions.

I built LeHarness to understand how agent runtimes work. The TypeScript core is separate from the terminal interface, so the same agent loop can support other interfaces.

An append-only event log records each session. The runtime rebuilds session state from those events, keeping prompts, tool results, and artifacts in one history. This avoids separate stores that can drift out of sync.

Compaction works in stages as the context budget fills: removing older reasoning, moving large tool outputs to files, and summarizing older turns. Summaries are cached against the original events, so the runtime can reuse them without repeatedly summarizing the same history. The full event log stays intact.

Background tasks and subagents let the parent agent keep working while other work runs. Their results feed back into the event log between model steps, keeping task handling inside the same session model.

The experimental lh command runs interactively or takes a single prompt. It supports OpenAI, DeepSeek, and Ollama, with skills and MCP connections.`,
});
