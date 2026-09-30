import { defineProject } from "./schema";

export const shoutout = defineProject({
  slug: "shoutout",
  order: 0,
  published: true,
  name: "ShoutOut",
  category: "Local AI product",
  status: "Shipping",
  summary: "Local dictation for your Mac, wherever you type.",
  tags: [
    "macOS",
    "Swift",
    "Local AI",
    "Product"
  ],
  links: [
    {
      kind: "product",
      label: "Visit ShoutOut",
      href: "https://shoutout.sh"
    }
  ],
  document: `# ShoutOut

Local dictation for your Mac, wherever you type.

My Wispr Flow subscription lapsed, so I built a working version in a week. ShoutOut has grown into a native Mac app for getting spoken ideas into the field already in front of you. The crab has been there since day one.

## The product

Hold Fn/Globe to talk or use hands-free mode. ShoutOut transcribes speech locally, formats it for the focused field, and inserts it without a separate copy-and-paste step.

## Engineering decisions

The Swift and SwiftUI app coordinates audio capture, WhisperKit transcription on Core ML, cleanup validation, and insertion into the active app. Speech and cleanup stay on the Mac in the normal product path. When a rewrite risks changing meaning, ShoutOut keeps the original transcript.

The app ships as a signed and notarized DMG with Sparkle updates. Keeping capture, transcription, cleanup, and insertion in one local flow makes dictation usable wherever the cursor is, while validation limits unwanted edits.

## Evidence

- [Public product](https://shoutout.sh): Download, product details, and current release information. ShoutOut is shipping.`,
});
