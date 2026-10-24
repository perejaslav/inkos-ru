import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  // The E2E launcher builds Core before starting both API and Vite.
  // Do not also rebuild in globalSetup: it races with the running servers
  // and temporarily deletes dist/ while Vite resolves workspace modules.
  timeout: 60_000,
  // Run specs serially against the single shared dev server. The authoring
  // agent flow streams a long SSE turn; with parallel workers, concurrent
  // specs hammering the one server starve that turn into a 60s timeout (the
  // spec passes alone but flakes in a parallel full run). Serial is both
  // reliable and faster here (one backend, no contention).
  workers: 1,
  use: {
    baseURL: "http://localhost:4580",
    headless: true,
    screenshot: "only-on-failure",
  },
  // Ports 4580/4581 are dedicated to E2E to avoid conflict with the dev server.
  webServer: {
    command: "node scripts/e2e-dev-server.mjs",
    url: "http://localhost:4580",
    reuseExistingServer: false,
    timeout: 120_000,
    cwd: ".",
  },
});
