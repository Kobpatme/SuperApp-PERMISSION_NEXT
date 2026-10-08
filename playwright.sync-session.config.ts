import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e", testMatch: /sync-session\.spec\.ts$/, workers: 1, fullyParallel: false, timeout: 90000,
  use: { baseURL: "http://localhost:3110", trace: "retain-on-failure" },
  reporter: [["list"], ["json", { outputFile: "docs/quality/sync-session-health/browser.json" }]],
  webServer: { command: "node scripts/sync-session-test-db.mjs server", url: "http://localhost:3110/login", reuseExistingServer: false, timeout: 60000, env: { PARITY_QUERY_METRICS: "1" } },
});
