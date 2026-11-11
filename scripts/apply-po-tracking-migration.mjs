import { config } from "dotenv";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import postgres from "postgres";
import { databaseSslOptions } from "../src/lib/database-ssl.mjs";
import { PO_STAGING_DATABASE } from "./po-tracking-import-core.mjs";
import { findMissingPredecessors } from "./migration-ledger.mjs";

config({ path: ".env.local" });
config();

const fail = (message) => { process.stderr.write(`${message}\n`); process.exit(1); };
const KNOWN_UNRESOLVED_GAP = [
  "0060_platform_admin_full_system_access.sql",
  "0061_duct_policy_worker_membership_guard.sql",
  "0062_duct_policy_worker_runtime_guard.sql",
];
const MIGRATION = process.argv.find((value) => /^--migration=/.test(value))?.slice("--migration=".length) ?? "0063_po_tracking.sql";
if (!/^006[345]_po_tracking[a-z_]*\.sql$/.test(MIGRATION)) fail(`REFUSED: ${MIGRATION} is outside the PO tracking migration set`);
if (!process.env.DATABASE_URL || !process.env.DATABASE_URL_MIGRATE) fail("DATABASE_URL and DATABASE_URL_MIGRATE are required");
if (!process.argv.includes("--apply")) fail(`Dry check only. Re-run with --apply to write ${MIGRATION} to the staging database.`);

const runtime = new URL(process.env.DATABASE_URL);
const elevated = new URL(process.env.DATABASE_URL_MIGRATE);
if (runtime.pathname.slice(1) !== PO_STAGING_DATABASE) fail(`REFUSED: DATABASE_URL points to ${runtime.pathname.slice(1)}`);
const target = new URL(process.env.DATABASE_URL_MIGRATE);
target.pathname = runtime.pathname;

const sql = postgres(target.href, { ...databaseSslOptions(), max: 1, prepare: false });
try {
  const [identity] = await sql`select current_database() as database, current_user as "user"`;
  if (identity.database !== PO_STAGING_DATABASE) fail(`REFUSED: connected to ${identity.database}`);
  if (identity.user !== "postgres") fail(`REFUSED: migration must run as postgres, not ${identity.user}`);
  const [ledger, files] = await Promise.all([
    sql`select name from public.schema_migrations`,
    readdir(resolve("supabase", "migrations")),
  ]);
  const missing = findMissingPredecessors(files, ledger.map((row) => row.name), MIGRATION);
  // The 0060–0062 security migrations are intentionally not applied in this
  // environment (no access/role changes were approved). Any other gap is still
  // refused; accepting the known gap must be explicit and is echoed below.
  const acceptedGap = (process.argv.find((value) => /^--accept-known-gap=/.test(value))?.slice("--accept-known-gap=".length) ?? "")
    .split(",").map((value) => value.trim()).filter(Boolean);
  const unexpected = missing.filter((name) => !acceptedGap.includes(name) || !KNOWN_UNRESOLVED_GAP.includes(name));
  if (unexpected.length) fail(`REFUSED: ${MIGRATION} would be applied over a migration gap: ${unexpected.join(", ")}. Apply the earlier migrations first.`);
  const knownGap = missing.length ? missing : [];
  if (knownGap.length) {
    console.log(JSON.stringify({ warning: "KNOWN_MIGRATION_GAP_STILL_OPEN", gap: knownGap, note: "security migrations deliberately not applied; see migration 0060–0062 review" }, null, 2));
  }
  const [applied] = await sql`select name from public.schema_migrations where name = ${MIGRATION}`;
  if (applied) {
    console.log(JSON.stringify({ ok: true, mode: "already-applied", database: identity.database, migration: MIGRATION, knownGap }, null, 2));
  } else {
    const source = await readFile(resolve("supabase", "migrations", MIGRATION), "utf8");
    await sql.begin(async (tx) => {
      await tx`select pg_advisory_xact_lock(hashtext('permission-next:migrations'))`;
      await tx.unsafe(source);
      await tx`insert into public.schema_migrations(name) values(${MIGRATION})`;
    });
    console.log(JSON.stringify({ ok: true, mode: "applied", database: identity.database, migration: MIGRATION, knownGap }, null, 2));
  }
  const [state] = await sql`select
    (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname in ('po_lines','po_receipts')) as tables,
    (select count(*)::int from pg_trigger where tgname in ('guard_po_line','guard_po_receipt')) as triggers,
    (select count(*)::int from pg_policies where tablename in ('po_lines','po_receipts')) as policies,
    (select count(*)::int from public.permissions where module_id = 'po_tracking') as permissions,
    (select count(*)::int from public.po_lines) as "poLines",
    (select count(*)::int from public.po_lines where origin = 'manual') as "manualLines",
    (select count(*)::int from information_schema.columns where table_schema = 'public' and table_name = 'po_lines' and column_name = 'origin') as "originColumns"`;
  console.log(JSON.stringify({ postCheck: state }, null, 2));
  if (state.tables !== 2 || state.triggers !== 2 || state.permissions !== 7 || state.originColumns !== 1) fail("POST_CHECK_FAILED");
} catch (error) {
  process.stderr.write(`Migration failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 2;
} finally {
  await sql.end();
}
