import { config } from "dotenv";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import postgres from "postgres";

config({ path: ".env.local" });
config();

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
const migrationDir = resolve("supabase", "migrations"); // Historical directory name; SQL is standalone PostgreSQL.
try {
  await sql`create table if not exists public.schema_migrations (name text primary key, applied_at timestamptz not null default now())`;
  const files = (await readdir(migrationDir)).filter((file) => /^\d+.*\.sql$/.test(file)).sort();
  for (const file of files) {
    const [applied] = await sql`select name from public.schema_migrations where name=${file}`;
    if (applied) continue;
    const source = await readFile(resolve(migrationDir, file), "utf8");
    await sql.begin(async (tx) => {
      await tx.unsafe(source);
      await tx`insert into public.schema_migrations(name) values(${file})`;
    });
    process.stdout.write(`Applied ${file}\n`);
  }
} finally { await sql.end(); }
