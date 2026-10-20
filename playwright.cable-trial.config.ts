import { defineConfig } from "@playwright/test";
export default defineConfig({ testDir:"./e2e",testMatch:/cable-trial\.spec\.ts$/,workers:1,timeout:90000,
 use:{baseURL:"http://localhost:3118",trace:"retain-on-failure"},reporter:[["list"]],
 webServer:{command:"node scripts/cable-trial-browser-server.mjs",url:"http://localhost:3118/login",reuseExistingServer:false,timeout:60000,gracefulShutdown:{signal:"SIGTERM",timeout:3000}},
});
