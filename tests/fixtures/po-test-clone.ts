import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { join } from "node:path";
import postgres from "postgres";
const execute = promisify(execFile);

/** Snapshot a busy local test source without terminating any application session. */
export async function createPoTestClone(name: string, operatorUrl: URL, sourceUrl: URL) {
  if (!/^po_(tracking|excel|browser)_test_\d+$/.test(name) || sourceUrl.pathname !== "/permission_superapp_staging_20261104_1157" || ![operatorUrl, sourceUrl].every(u => ["127.0.0.1", "localhost"].includes(u.hostname))) throw new Error("Isolated local PO test database required");
  const operator = postgres(operatorUrl.href, { max: 1 });
  try {
    try { await operator.unsafe(`create database ${name} template permission_superapp_staging_20261104_1157`); return; }
    catch (error) { if ((error as { code?: string }).code !== "55006") throw error; }
    const bin = process.env.PO_TEST_PG_BIN || (process.platform === "win32" ? join(process.env.LOCALAPPDATA || "", "Programs/PostgreSQL-17.11-portable/pgsql/bin") : "");
    const environment = { ...process.env, PGHOST: operatorUrl.hostname, PGPORT: operatorUrl.port || "5432", PGUSER: decodeURIComponent(operatorUrl.username), PGPASSWORD: decodeURIComponent(operatorUrl.password), PGDATABASE: sourceUrl.pathname.slice(1) };
    const dump = await execute(join(bin, process.platform === "win32" ? "pg_dump.exe" : "pg_dump"), ["--format=custom", "--no-owner"], { env: environment, encoding: "buffer", maxBuffer: 128 * 1024 * 1024, windowsHide: true });
    await operator.unsafe(`create database ${name} template template0`);
    // execFile cannot stream stdin; feed the private archive through a spawned process.
    const { spawn } = await import("node:child_process");
    await new Promise<void>((resolve, reject) => {
      const child = spawn(join(bin, process.platform === "win32" ? "pg_restore.exe" : "pg_restore"), ["--no-owner", "--exit-on-error", "--dbname", name], { env: environment, windowsHide: true, stdio: ["pipe", "ignore", "pipe"] });
      child.stderr.resume();
      child.on("error", reject);
      child.on("close", code => code === 0 ? resolve() : reject(new Error(`Local test snapshot restore failed (${code})`)));
      child.stdin.on("error", reject);
      child.stdin.end(dump.stdout);
    });
  } finally { await operator.end(); }
}
