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
  assert.equal((await db`select count(*)::int as n from public.role_permissions rp join public.roles r on r.id=rp.role_id where permission_code like 'duct_rental.%' and r.code='platform_admin'`)[0].n, 0);
  const eventPolicies = await db`select policyname,roles,with_check,permissive from pg_policies where schemaname='public' and policyname in ('duct_activity_append','duct_outbox_append') order by policyname`;
  assert.equal(eventPolicies.length, 2);
  for (const policy of eventPolicies) {
    assert.deepEqual(policy.roles, ['duct_rental_runtime'], 'Duct predicates must not be evaluated for unrelated runtimes');
    assert.match(policy.with_check, /duct_rental_has_entry/); assert.equal(policy.permissive, 'PERMISSIVE');
  }
  const presetsSql = await readFile("supabase/migrations/0053_duct_rental_role_presets.sql", "utf8");
  const presets = JSON.parse(presetsSql.match(/jsonb_array_elements\('(.+)'::jsonb\)/)[1].replaceAll("''", "'"));
  for (const preset of presets) {
    const [role] = await db`select id,is_system from roles where code=${preset.code}`;
    assert.equal(role.is_system, false);
    assert.deepEqual((await db`select permission_code from role_permissions where role_id=${role.id} order by permission_code`).map(row => row.permission_code), [...preset.permissions].sort());
    assert.equal((await db`select count(*)::int n from user_role_assignments where role_id=${role.id}`)[0].n, 0);
  }
  const presetRollback = new Error("preset customization rollback");
  await assert.rejects(db.begin(async tx => {
    const [role] = await tx`select id from roles where code='duct_rental_design'`;
    await tx`delete from role_permissions where role_id=${role.id} and permission_code='duct_rental.rate.read'`;
    await tx`update roles set name='Fixture customized role' where id=${role.id}`;
    await tx.unsafe(presetsSql);
    assert.equal((await tx`select name from roles where id=${role.id}`)[0].name, 'Fixture customized role');
    assert.equal((await tx`select count(*)::int n from role_permissions where role_id=${role.id} and permission_code='duct_rental.rate.read'`)[0].n, 0);
    throw presetRollback;
  }), error => error === presetRollback);
  const rollback = new Error("fixture rollback");
  await assert.rejects(db.begin(async tx => {
    await tx`insert into public.permissions(code,module_id,resource,action,description) values('duct_rental.fixture.read','duct-rental','fixture','read','ข้อมูลทดสอบ')`;
    assert.equal((await tx`select count(*)::int as n from public.role_permissions where permission_code='duct_rental.fixture.read'`)[0].n, 0);
    await tx`insert into public.permissions(code,module_id,resource,action,description) values('work.fixture.read','work','fixture','read','ข้อมูลทดสอบ')`;
    assert.equal((await tx`select count(*)::int as n from public.role_permissions rp join public.roles r on r.id=rp.role_id where permission_code='work.fixture.read' and r.code='platform_admin'`)[0].n, 1);
    throw rollback;
  }), error => error === rollback);
  assert.equal((await db`select count(*)::int as n from public.permissions where code in ('duct_rental.fixture.read','work.fixture.read')`)[0].n, 0);
  console.log(JSON.stringify({ database: name, capabilities: after, rolePresets: presets.length, passed: ["fresh migrations", "catalog replay idempotent", "editable role presets exact permissions", "preset replay preserves customization", "no automatic duct grants or assignments", "existing work grants preserved", "transaction rollback"] }));
} catch (error) {
  console.error(JSON.stringify({ error: "Isolated duct catalog check failed", code: error.code || error.name })); process.exitCode = 1;
} finally { await db.end(); }
