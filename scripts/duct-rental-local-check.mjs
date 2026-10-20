// Portable, synthetic-only PostgreSQL verification. Never reads the application's connection.
import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { resolve } from "node:path";
import { randomBytes } from "node:crypto";
import { openSync, closeSync } from "node:fs";
const root = resolve(".data/duct-rental-postgres"), cluster = resolve(root, "closure-cluster"), bin = resolve(".data/car-booking-postgres/pgsql/bin"), port = 55447;
await mkdir(root, { recursive: true });
const run = (program, args, env = process.env, options = {}) => new Promise((yes, no) => {
  const child = spawn(program, args, { env, stdio: "inherit", windowsHide: true, ...options });
  child.on("error", no); child.on("exit", code => code === 0 ? yes() : no(new Error(`Fixture command exited ${code}`)));
});
const exists = async path => { try { await access(path); return true; } catch { return false; } };
const mode = process.argv[2];
if (mode === "start") {
  const pw = resolve(root, "operator-password.txt");
  if (!await exists(resolve(cluster, "PG_VERSION"))) {
    await writeFile(pw, randomBytes(32).toString("hex"), { flag: "wx" });
    await run(resolve(bin, "initdb.exe"), ["-D", cluster, "-U", "duct_fixture_operator", "--encoding=UTF8", "--locale=C", "--auth=scram-sha-256", `--pwfile=${pw}`]);
  }
  // A background server must not inherit the command's console/pipes on Windows.
  const stdout = openSync(resolve(root, "startup.log"), "a"), stderr = openSync(resolve(root, "startup-error.log"), "a");
  try { await run(resolve(bin, "pg_ctl.exe"), ["-D", cluster, "-l", resolve(root, "server.log"), "-o", `-h 127.0.0.1 -p ${port}`, "-w", "start"], process.env, { detached: true, stdio: ["ignore", stdout, stderr] }); }
  finally { closeSync(stdout); closeSync(stderr); }
  console.log(`Synthetic PostgreSQL started on loopback:${port}; application database untouched`);
} else if (mode === "stop") {
  await run(resolve(bin, "pg_ctl.exe"), ["-D", cluster, "-m", "fast", "-w", "stop"]);
} else {
  const password = (await readFile(resolve(root, "operator-password.txt"), "utf8")).trim();
  const url = `postgres://duct_fixture_operator:${password}@127.0.0.1:${port}/permission_next_duct_rental_test`;
  const env = { ...process.env, DUCT_RENTAL_TEST_DATABASE_URL: url, DATABASE_URL: url, DUCT_RENTAL_DATABASE_URL: "" };
  const scripts = { catalog: "scripts/duct-rental-catalog-test.mjs", services: "scripts/duct-rental-service-test.mjs", rollback: "scripts/duct-rental-schema-rollback.mjs", fixture: "scripts/duct-rental-browser-fixture.mjs", projects: "scripts/duct-rental-browser-projects.mjs", browser: "node_modules/@playwright/test/cli.js" };
  if (!Object.hasOwn(scripts, mode)) throw new Error("Use start/catalog/services/rollback/fixture/projects/browser/stop");
  await run(process.execPath, [scripts[mode], ...process.argv.slice(3)], env);
}
