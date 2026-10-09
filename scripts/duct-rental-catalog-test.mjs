// Isolated local database only. Never migrate the configured application database.
import { config } from "dotenv";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import assert from "node:assert/strict";
import postgres from "postgres";

config({ path: ".env.local", quiet: true });
const name = "permission_next_duct_rental_test";
const configured = process.env.DUCT_RENTAL_TEST_DATABASE_URL || process.env.DATABASE_URL;
if (!configured) throw new Error("Local test connection required (not printed)");
const target = new URL(configured);
if (!["localhost", "127.0.0.1", "[::1]"].includes(target.hostname)) throw new Error("Duct tests require loopback PostgreSQL");
if (process.env.DUCT_RENTAL_TEST_DATABASE_URL && target.pathname !== `/${name}`) throw new Error("Unexpected test database");
target.pathname = `/${name}`;
const controlTarget = new URL(target); controlTarget.pathname = "/postgres";
const operator = postgres(controlTarget.href, { max: 1, prepare: false, onnotice: () => {} });
try {
  if (!(await operator`select 1 from pg_database where datname=${name}`).length) await operator.unsafe(`create database ${name}`);
} finally { await operator.end(); }
const db = postgres(target.href, { max: 1, prepare: false, onnotice: () => {} });
try {
  assert.equal((await db`select current_database() as name`)[0].name, name);
  await db`create table if not exists public.schema_migrations(name text primary key,applied_at timestamptz not null default now())`;
  for (const file of (await readdir("supabase/migrations")).filter(f => /^\d.*\.sql$/.test(f)).sort()) {
    if ((await db`select name from public.schema_migrations where name=${file}`).length) continue;
    await db.begin(async tx => {
      await tx.unsafe(await readFile(resolve("supabase/migrations", file), "utf8"));
      await tx`insert into public.schema_migrations(name) values(${file})`;
    });
  }
  const sql = await readFile("supabase/migrations/0029_duct_rental_catalog.sql", "utf8");
  const before = (await db`select count(*)::int as n from public.permissions where module_id='duct-rental'`)[0].n;
  await db.begin(tx => tx.unsafe(sql));
  const after = (await db`select count(*)::int as n from public.permissions where module_id='duct-rental'`)[0].n;
  assert.ok(before > 0); assert.equal(after, before);
  assert.equal((await db`select count(*)::int as n from public.role_permissions where permission_code like 'duct_rental.%'`)[0].n, 0);
  const rollback = new Error("fixture rollback");
  await assert.rejects(db.begin(async tx => {
    await tx`insert into public.permissions(code,module_id,resource,action,description) values('duct_rental.fixture.read','duct-rental','fixture','read','ข้อมูลทดสอบ')`;
    assert.equal((await tx`select count(*)::int as n from public.role_permissions where permission_code='duct_rental.fixture.read'`)[0].n, 0);
    await tx`insert into public.permissions(code,module_id,resource,action,description) values('work.fixture.read','work','fixture','read','ข้อมูลทดสอบ')`;
    assert.equal((await tx`select count(*)::int as n from public.role_permissions rp join public.roles r on r.id=rp.role_id where permission_code='work.fixture.read' and r.code='platform_admin'`)[0].n, 1);
    throw rollback;
  }), error => error === rollback);
  assert.equal((await db`select count(*)::int as n from public.permissions where code in ('duct_rental.fixture.read','work.fixture.read')`)[0].n, 0);
  console.log(JSON.stringify({ database: name, capabilities: after, passed: ["fresh migrations", "catalog replay idempotent", "no automatic duct grants", "existing work grants preserved", "transaction rollback"] }));
} catch (error) {
  console.error(JSON.stringify({ error: "Isolated duct catalog check failed", code: error.code || error.name })); process.exitCode = 1;
} finally { await db.end(); }
