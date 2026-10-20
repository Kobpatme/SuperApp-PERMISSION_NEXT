import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e", testMatch: /(admin-layout|work-parity)\.spec\.ts$/,
  workers: 1, fullyParallel: false, timeout: 120000,
  use: { baseURL: "http://localhost:3200", trace: "retain-on-failure" },
  reporter: [["list"], ["json", { outputFile: "docs/quality/parity-browser/results.json" }]],
  webServer: { command: "node scripts/parity-ui-fixtures.mjs server", url: "http://localhost:3200/login", reuseExistingServer: false, timeout: 60000, gracefulShutdown: { signal: "SIGTERM", timeout: 3000 } },
});
