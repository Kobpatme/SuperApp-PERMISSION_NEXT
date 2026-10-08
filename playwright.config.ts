import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e", fullyParallel: false, workers: 1, timeout: 60000,
  testMatch: /.*\.spec\.tsx?$/,
  testIgnore: /(car-booking|sync-session)\.spec\.ts$/,
  use: { baseURL: "http://localhost:3100", trace: "retain-on-failure" },
  reporter: [["list"], ["json", { outputFile: "docs/quality/ux-login-evidence/e2e-results.json" }]],
  webServer: process.env.UX_EXTERNAL_SERVER === "1" ? undefined : { command: "node scripts/ux-test-db.mjs server", url: "http://localhost:3100/login", reuseExistingServer: false, timeout: 60000, gracefulShutdown: { signal: "SIGTERM", timeout: 3000 } },
});
