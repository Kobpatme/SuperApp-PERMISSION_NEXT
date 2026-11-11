import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { join } from "node:path";
import postgres from "postgres";
import { readFile, readdir } from "node:fs/promises";
const execute = promisify(execFile);

/** Snapshot a busy local test source without terminating any application session. */
export async function createPoTestClone(name: string, operatorUrl: URL, sourceUrl: URL) {
  if (!/^po_(tracking|excel|browser)_test_\d+$/.test(name) || !["/permission_superapp_staging_20261104_1157", "/permission_next_po_test"].includes(sourceUrl.pathname) || ![operatorUrl, sourceUrl].every(u => ["127.0.0.1", "localhost"].includes(u.hostname))) throw new Error("Isolated local PO test database required");
  const operator = postgres(operatorUrl.href, { max: 1 });
  try {
    if (sourceUrl.pathname === "/permission_next_po_test") {
      if (!process.env.PO_TEST_DATABASE_URL || new URL(process.env.PO_TEST_DATABASE_URL).href !== sourceUrl.href) throw new Error("Explicit PO fixture URL required");
      await operator.unsafe(`create database ${name} template template0`);
      const target = new URL(operatorUrl); target.pathname = `/${name}`;
      const fixture = postgres(target.href, { max: 1, prepare: false, onnotice: () => {} });
      try {
        await fixture`create table schema_migrations(name text primary key, applied_at timestamptz not null default now())`;
        for (const migration of (await readdir("supabase/migrations")).filter(file => /^\d.*\.sql$/.test(file)).sort()) await fixture.begin(async tx => { await tx.unsafe(await readFile(`supabase/migrations/${migration}`, "utf8")); await tx`insert into schema_migrations(name) values(${migration})`; });
        await fixture`insert into profiles(id,email,display_name) values('00000000-0000-4000-8000-000000000001','po-fixture@example.test','PO fixture')`;
      } finally { await fixture.end(); }
      return;
    }
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
