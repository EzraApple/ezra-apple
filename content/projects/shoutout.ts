import { shoutoutArticleUrl } from "../writing";
import { defineProject } from "./schema";

export const shoutout = defineProject({
  slug: "shoutout",
  order: 0,
  published: true,
  name: "ShoutOut",
  category: "Local AI product",
  status: "Shipping",
  summary: "Local dictation for macOS that types into the active app.",
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
    },
    {
      kind: "repository",
      label: "GitHub",
      href: "https://github.com/EzraApple/shoutout"
    }
  ],
  document: `# ShoutOut

Local dictation for macOS that types into the active app.

Hold Fn/Globe to dictate into the app you’re using, or double-tap for hands-free recording. Transcription runs on your Mac and streams while you talk, reducing the wait after you release the shortcut. A custom dictionary helps with names, and searchable history keeps past dictations accessible.

My Wispr Flow subscription lapsed, so I built a working version in a week, starting from [Inputalk](https://github.com/sebi75/inputalk), an MIT-licensed macOS dictation app. The app is written in Swift and SwiftUI.

For cleanup, I fine-tuned BERT Mini to predict which words to keep or delete. It removes likely fillers and repetitions rather than generating a new sentence. Cleanup is optional and runs locally through Core ML.

The app ships as a signed and notarized Mac app with automatic updates.

[Read how I got ShoutOut’s median dictation wait down to 187 ms](${shoutoutArticleUrl}).`,
});
