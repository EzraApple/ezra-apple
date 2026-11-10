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

I built Switchboard, a local MCP server, to coordinate work across Claude and Codex. An agent can delegate a task to another session, then read its reply without leaving the original conversation.

A shared local daemon manages the connections. It serializes changes within each session, lets unrelated sessions run independently, and indexes conversation text locally for search.

It runs on macOS and is available on npm. It is an early preview: some integrations use private interfaces, and approval forwarding and attachments are not supported.`,
});
