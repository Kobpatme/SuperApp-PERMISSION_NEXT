import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
const baseline=process.argv.includes("--baseline"), fixture=JSON.parse(await readFile(resolve(".data/duct-rental-browser/runtime.json"),"utf8")), root=resolve(`.data/duct-rental-browser/${baseline ? "baseline" : "current"}`);
for(const url of [fixture.databaseUrl,fixture.runtimeUrl]){ const parsed=new URL(url);if(parsed.pathname!=="/permission_next_duct_rental_test" || !["localhost","127.0.0.1","[::1]"].includes(parsed.hostname))throw new Error("Fixture database guard failed"); }
process.env.DATABASE_URL=fixture.databaseUrl;process.env.DUCT_RENTAL_DATABASE_URL=fixture.runtimeUrl;process.env.DUCT_RENTAL_STORAGE_DIR=fixture.storageDir;
process.env.CAR_BOOKING_DATABASE_URL=fixture.databaseUrl;process.env.NODE_ENV="production";
process.env.DUCT_RENTAL_FIXTURE_METRICS="1";
for(const key of ["PERMISSION_NAS_BRIDGE_URL","PERMISSION_NAS_BRIDGE_SECRET","LONGDO_MAP_API_KEY","CAR_BOOKING_GOOGLE_PRIVATE_KEY","CAR_BOOKING_GOOGLE_CLIENT_EMAIL","CAR_BOOKING_OSP_SPREADSHEET_ID","CAR_BOOKING_OSP_WORKER_SECRET","CAR_BOOKING_OSP_WORKER_USER_ID"])process.env[key]="";
process.chdir(root);const {nextStart}=await import("next/dist/cli/next-start.js");await nextStart({port:baseline ? 3113 : 3112,hostname:"localhost"},root);
