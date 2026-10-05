import {defineConfig} from "@playwright/test";
export default defineConfig({testDir:"./e2e",testMatch:/admin-layout\.spec\.ts$/,workers:1,timeout:120000,use:{baseURL:"http://127.0.0.1:3000",trace:"retain-on-failure"},reporter:[["list"],["json",{outputFile:"docs/quality/admin-layout/e2e-results.json"}]]});
