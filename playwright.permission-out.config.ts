import {defineConfig} from "@playwright/test";
import {existsSync} from "node:fs";
const chrome="C:/Program Files/Google/Chrome/Application/chrome.exe";
export default defineConfig({testDir:"./e2e",testMatch:"permission-out.browser.ts",workers:1,timeout:45000,reporter:"list",use:{baseURL:"http://127.0.0.1:3227",launchOptions:process.platform==="win32"&&existsSync(chrome)?{executablePath:chrome}:{}},webServer:{command:"node scripts/permission-out-browser-fixture.mjs",url:"http://127.0.0.1:3227",reuseExistingServer:false,timeout:30000}});
