import {defineConfig} from "@playwright/test";
export default defineConfig({testDir:"./e2e",testMatch:/work-parity\.spec\.ts$/,workers:1,timeout:60000,use:{baseURL:"http://localhost:3200",trace:"retain-on-failure"},reporter:[["list"],["json",{outputFile:"docs/quality/work-parity-evidence/e2e-results.json"}]]});
