import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: /car-booking\.isolated\.spec\.ts$/,
  workers: 1,
  fullyParallel: false,
  timeout: 60000,
  use: {
    baseURL: "http://localhost:3109",
    trace: "off",
    video: "off",
    screenshot: "off",
    launchOptions: { executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" },
  },
  reporter: [["list"]],
  webServer: {
    command: "node scripts/car-booking-browser-server.mjs",
    url: "http://localhost:3109/login",
    reuseExistingServer: false,
    timeout: 60000,
    gracefulShutdown: { signal: "SIGTERM", timeout: 3000 },
  },
});
