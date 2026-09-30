import { defineProject } from "./schema";

export const leHarness = defineProject({
  slug: "leharness",
  order: 4,
  published: true,
  name: "LeHarness",
  category: "Agent runtime",
  status: "Open source",
  summary: "An agent runtime with durable, event-sourced sessions.",
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

An agent runtime with durable, event-sourced sessions.

I built LeHarness to understand the machinery underneath agents by making the model loop, tools, and session state explicit.

## The product

The published lh command runs as an interactive TUI or takes one prompt and exits. It supports OpenAI, DeepSeek, and Ollama, with local session state under the working directory. Tools, background work, subagents, artifacts, skills, MCP support, and compaction extend that core loop.

## Engineering decisions

An append-only event log is the source of truth for each session. LeHarness rebuilds the current view from those events, so prompts, notifications, and artifacts do not need parallel stores that can drift apart. The kernel coordinates model steps and tool execution; longer-running tasks and subagents remain explicit services around it.

The TypeScript and Node.js core is designed to serve a CLI now and other interfaces later without putting interface assumptions into the agent loop.

## Evidence

- [npm package](https://www.npmjs.com/package/leharness): Installable as leharness with the lh command.
- [Public source](https://github.com/EzraApple/leharness): Kernel, CLI, research notes, and feature plans.`,
});
