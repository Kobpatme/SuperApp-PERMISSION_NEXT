import { defineConfig } from "@playwright/test";
export default defineConfig({ testDir: "./e2e", testMatch: /duct-rental\.spec\.ts$/, workers: 1, fullyParallel: false, timeout: 90000,
 use: { baseURL: "http://localhost:3112", trace: "retain-on-failure" }, reporter: [["list"], ["json", { outputFile: "docs/quality/duct-rental/browser-results.json" }]],
 webServer: [
  { command: "node scripts/duct-rental-browser-server.mjs", url: "http://localhost:3112/login", stdout: "pipe", reuseExistingServer: false, timeout: 60000, gracefulShutdown: { signal: "SIGTERM", timeout: 3000 } },
  { command: "node scripts/duct-rental-browser-server.mjs --baseline", url: "http://localhost:3113/login", reuseExistingServer: false, timeout: 60000, gracefulShutdown: { signal: "SIGTERM", timeout: 3000 } },
 ],
});
