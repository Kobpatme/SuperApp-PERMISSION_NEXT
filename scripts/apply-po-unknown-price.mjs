import { config } from "dotenv";
import { readFile } from "node:fs/promises";
import postgres from "postgres";
config({ path: ".env.local", quiet: true });
const name = "0066_po_unknown_price.sql";
const target = new URL(process.env.DATABASE_URL_MIGRATE);
const runtime = new URL(process.env.DATABASE_URL);
if (![runtime, target].every(u => ["127.0.0.1", "localhost"].includes(u.hostname)) || runtime.pathname !== "/permission_superapp_staging_20261104_1157" || target.username !== "postgres") throw new Error("Local staging operator required");
target.pathname = runtime.pathname;
const db = postgres(target.href, { max: 1, prepare: false });
try {
  const [before] = await db`select count(*)::int as rows, count(unit_price)::int as priced from po_lines`;
  if (!process.argv.includes("--apply")) {
    console.log(JSON.stringify({ mode: "dry-check", database: runtime.pathname.slice(1), migration: name, ...before }));
  } else {
    await db.begin(async tx => {
      await tx`select pg_advisory_xact_lock(hashtext('permission-next:migrations'))`;
      if (!(await tx`select 1 from schema_migrations where name='0065_po_tracking_manual.sql'`).length) throw new Error("PO manual predecessor required");
      if (!(await tx`select 1 from schema_migrations where name=${name}`).length) {
        await tx.unsafe(await readFile(`supabase/migrations/${name}`, "utf8"));
        await tx`insert into schema_migrations(name) values(${name})`;
      }
    });
    const [after] = await db`select count(*)::int as rows, count(unit_price)::int as priced from po_lines`;
    if (before.rows !== after.rows || before.priced !== after.priced) throw new Error("Unexpected row/price count change");
    console.log(JSON.stringify({ mode: "applied", database: runtime.pathname.slice(1), migration: name, valuesUnchanged: true, ...after }));
  }
} finally { await db.end(); }
