import { spawnSync, execFileSync } from "node:child_process";
import { existsSync, mkdtempSync } from "node:fs";
import { resolve, join } from "node:path";
import { createServer } from "node:net";
// Optional external fixture operator must be loopback, validated by the suite.
// Default: a fresh synthetic cluster, never a snapshot of application data.
const bin = process.env.PERMISSION_OUT_PG_BIN || resolve(".data/car-booking-postgres/pgsql/bin");
const exe = name => join(bin, name + (process.platform === "win32" ? ".exe" : ""));
let cluster;
try {
  const env = { ...process.env, PERMISSION_OUT_DB_TEST: "1" };
  const buildIndex=process.argv.indexOf("--build");if(buildIndex>=0)env.PERMISSION_OUT_BUILD_DIR=resolve(process.argv[buildIndex+1]);
  if (!env.PERMISSION_OUT_TEST_OPERATOR_URL) {
    if (!existsSync(exe("initdb"))) throw new Error("Set PERMISSION_OUT_PG_BIN to an installed PostgreSQL bin directory");
    cluster = mkdtempSync(resolve(".data/permission-out-postgres-"));
    execFileSync(exe("initdb"), ["-D", join(cluster,"data"), "-U", "postgres", "--auth=trust", "--encoding=UTF8", "--no-locale"], { stdio: "pipe", windowsHide: true });
    const probe = createServer();
    const port = await new Promise((done, fail) => { probe.once("error",fail); probe.listen(0,"127.0.0.1",() => { const port = probe.address().port; probe.close(() => done(port)); }); });
    execFileSync(exe("pg_ctl"), ["-D", join(cluster,"data"), "-l", join(cluster,"server.log"), "-o", `-h 127.0.0.1 -p ${port} -F`, "-w", "start"], { stdio: "ignore", windowsHide: true, timeout: 30000 });
    env.PERMISSION_OUT_TEST_OPERATOR_URL = `postgres://postgres@127.0.0.1:${port}/postgres`;
  }
  const result = spawnSync(process.execPath, ["node_modules/vitest/vitest.mjs", "run", "src/modules/permission-out/service.integration.test.ts"], { stdio: "inherit", windowsHide: true, env });
  process.exitCode = result.status ?? 1;
} catch (error) {
  console.error(`Synthetic PostgreSQL runner unavailable (${error.code || error.name}); inspect local fixture log, no application service was changed.`);
  process.exitCode = 1;
} finally {
  if (cluster && cluster.startsWith(resolve(".data") + (process.platform === "win32" ? "\\" : "/"))) {
    try { execFileSync(exe("pg_ctl"), ["-D", join(cluster,"data"), "-m", "fast", "-w", "stop"], { stdio: "pipe", windowsHide: true }); }
    catch { /* The cluster may not have started. Never stop any other cluster. */ }
  }
}
