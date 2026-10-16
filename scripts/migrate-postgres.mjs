import { config } from "dotenv";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import postgres from "postgres";
import { databaseSslOptions } from "../src/lib/database-ssl.mjs";

config({ path: ".env.local" });
config();

if (!process.env.DATABASE_URL_MIGRATE) throw new Error("DATABASE_URL_MIGRATE is required; runtime DATABASE_URL is never used for schema changes");
const sql = postgres(process.env.DATABASE_URL_MIGRATE, { ...databaseSslOptions(), max: 1, prepare: false });
const migrationDir = resolve("supabase", "migrations"); // Historical directory name; SQL is standalone PostgreSQL.
try {
  // Reserve one physical connection: a session lock serializes multiple jobs,
  // including the migration ledger check, without changing any existing SQL.
  const connection = await sql.reserve();
  try {
    await connection`select pg_advisory_lock(hashtext('permission-next:migrations'))`;
    await connection`create table if not exists public.schema_migrations (name text primary key, applied_at timestamptz not null default now())`;
    const files = (await readdir(migrationDir)).filter((file) => /^\d+.*\.sql$/.test(file)).sort();
    for (const file of files) {
      const [applied] = await connection`select name from public.schema_migrations where name=${file}`;
      if (applied) continue;
      const source = await readFile(resolve(migrationDir, file), "utf8");
      await connection.unsafe("begin");
      try {
        await connection.unsafe(source);
        await connection`insert into public.schema_migrations(name) values(${file})`;
        await connection.unsafe("commit");
      } catch (error) {
        await connection.unsafe("rollback");
        throw error;
      }
      process.stdout.write(`Applied ${file}\n`);
    }
  } finally {
    try { await connection`select pg_advisory_unlock(hashtext('permission-next:migrations'))`; }
    finally { connection.release(); }
  }
} catch (error) {
  // Do not print driver errors: they can contain queries/connection metadata.
  process.stderr.write(`Migration failed (${error.code || error.name || "unknown"}); inspect schema state with the migration operator.\n`);
  process.exitCode = 1;
} finally { await sql.end(); }
