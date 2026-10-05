import { config } from 'dotenv';
import postgres from 'postgres';
import fs from 'node:fs/promises';
config({ path: '.env.local', quiet: true });
const target = new URL(process.env.DATABASE_URL);
if (!['localhost', '127.0.0.1', '[::1]'].includes(target.hostname)) throw new Error('Local PostgreSQL required');
target.pathname = '/permission_next_parity_test';
const adminTarget = new URL(target); adminTarget.pathname = '/postgres';
const admin = postgres(adminTarget.href, { max: 1 });
try {
  if (!(await admin`select 1 from pg_database where datname='permission_next_parity_test'`).length) await admin.unsafe('create database permission_next_parity_test');
} finally { await admin.end(); }
const db = postgres(target.href, { max: 1, prepare: false, onnotice: () => {} });
try {
  await db`create table if not exists schema_migrations(name text primary key, applied_at timestamptz not null default now())`;
  for (const name of (await fs.readdir('supabase/migrations')).filter(n => /^\d.*\.sql$/.test(n)).sort()) {
    if ((await db`select 1 from schema_migrations where name=${name}`).length) continue;
    await db.begin(async tx => { await tx.unsafe(await fs.readFile(`supabase/migrations/${name}`, 'utf8')); await tx`insert into schema_migrations(name) values(${name})`; });
  }
  console.log('Isolated parity database migrations passed');
} finally { await db.end(); }
