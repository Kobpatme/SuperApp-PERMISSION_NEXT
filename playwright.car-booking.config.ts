import { defineConfig } from "@playwright/test";
export default defineConfig({testDir:"./e2e",testMatch:/car-booking\.spec\.ts$/,workers:1,fullyParallel:false,timeout:60000,
 use:{baseURL:"http://localhost:3109",trace:"retain-on-failure"},reporter:[["list"],["json",{outputFile:"docs/quality/car-booking-phase-3/e2e-results.json"}]],
 webServer:{command:"node scripts/car-booking-browser-server.mjs",url:"http://localhost:3109/login",reuseExistingServer:false,timeout:60000,gracefulShutdown:{signal:"SIGTERM",timeout:3000}},
});
