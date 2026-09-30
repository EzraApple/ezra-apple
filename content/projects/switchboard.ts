import { defineProject } from "./schema";

export const switchboard = defineProject({
  slug: "switchboard",
  order: 1,
  published: true,
  name: "Switchboard",
  category: "Agent coordination",
  status: "Open source",
  summary: "Let Claude and Codex find, read, and continue each other’s sessions.",
  tags: ["MCP", "Claude Code", "Codex", "TypeScript", "Local tools"],
  links: [
    {
      kind: "repository",
      label: "Read the README",
      href: "https://github.com/EzraApple/switchboard#readme",
    },
    {
      kind: "package",
      label: "View package",
      href: "https://www.npmjs.com/package/@ezraapple/switchboard",
    },
  ],
  document: `# Switchboard

Let Claude and Codex find, read, and continue each other’s sessions.

## The product

Switchboard is a local MCP server for working across native Claude Code and Codex conversations. Six tools create, search, read, message, rename or archive, and delete sessions. An agent can ask another harness to work on a task, then read its reply in the original conversation.

It runs on macOS with Node.js and the installed, signed-in harnesses. The README includes installation commands for both Claude Code and Codex using the @ezraapple/switchboard package.

## Engineering decisions

A shared local daemon sits behind the MCP clients, with a typed adapter for each harness. It keeps native workers alive across client disconnects and serializes mutations per session, while reads and unrelated sessions can proceed independently.

Conversation search uses a local, rebuildable text index with ranked snippets. It searches titles, working directories, and conversation text without sending transcripts to an embedding service.

Session identity and delivery are explicit. Accepting a message does not mean the work has finished: callers read the session to observe the reply. Partial updates and uncertain outcomes are reported so callers can inspect state before retrying.

## Current limits

Switchboard is an early preview. Some adapters depend on private interfaces, Desktop visibility can lag, and approval forwarding and attachments are unsupported. It resumes native conversations but does not add independent tool-state checkpoints or guarantee recovery of expired remote sessions.

## Evidence

- [Public source and installation](https://github.com/EzraApple/switchboard#readme)
- [Architecture and limitations](https://github.com/EzraApple/switchboard/blob/main/docs/REFERENCE.md)
- [npm package](https://www.npmjs.com/package/@ezraapple/switchboard)`,
});
