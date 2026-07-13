import { defineConfig } from "vitest/config";

// Standalone config: the app's vite.config.ts loads the Cloudflare plugin,
// which is incompatible with (and unnecessary for) the test runner. Tests
// exercise the built worker over HTTP instead.
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 90_000,
  },
});
