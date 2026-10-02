import { config } from 'dotenv';
import postgres from 'postgres';
import { hash } from '@node-rs/argon2';
import fs from 'node:fs/promises';
config({ path: '.env.local', quiet: true });
const original = new URL(process.env.UX_TEST_DATABASE_URL || process.env.DATABASE_URL);
if (!['localhost','127.0.0.1','[::1]'].includes(original.hostname)) throw new Error('UX tests require loopback PostgreSQL');
const testName='permission_next_ux_test';
const target=new URL(original); target.pathname=`/${testName}`;
process.env.DATABASE_URL=target.href;
if (process.argv[2]==='init') {
  const adminUrl=new URL(original); adminUrl.pathname='/postgres';
  const admin=postgres(adminUrl.href,{max:1});
  try { if (!(await admin`select 1 from pg_database where datname=${testName}`).length) await admin.unsafe(`create database ${testName}`); } finally { await admin.end(); }
  const sql=postgres(target.href,{max:1,prepare:false,onnotice:()=>{}});
  try {
    await sql`create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())`;
    for (const file of (await fs.readdir('supabase/migrations')).filter(x=>/^\d.*\.sql$/.test(x)).sort()) {
      if ((await sql`select 1 from schema_migrations where name=${file}`).length) continue;
      const source=await fs.readFile(`supabase/migrations/${file}`,'utf8');
      await sql.begin(async tx=>{ await tx.unsafe(source); await tx`insert into schema_migrations(name) values(${file})`; });
    }
    console.log('Isolated UX fixture database migrated (no existing application database writes)');
  } finally { await sql.end(); }
} else if (process.argv[2]==='seed') {
  const sql=postgres(target.href,{max:1});
  const passwordHash=await hash('FixturePassword123!',{memoryCost:19456,timeCost:2,parallelism:1,outputLen:32});
  try {
    await sql.begin(async tx=>{
      for (const [id,email,temporary,role] of [['00000000-0000-4000-8000-000000000101','staff@example.test',false,'viewer'],['00000000-0000-4000-8000-000000000102','temporary@example.test',true,'viewer'],['00000000-0000-4000-8000-000000000103','admin@example.test',false,'platform_admin']]) {
        await tx`insert into profiles(id,email,display_name,status) values(${id},${email},'ผู้ใช้ทดสอบ','active') on conflict(id) do update set status='active'`;
        await tx`insert into local_credentials(user_id,password_hash,must_change_password) values(${id},${passwordHash},${temporary}) on conflict(user_id) do update set password_hash=${passwordHash},must_change_password=${temporary},failed_attempts=0,locked_until=null`;
        await tx`delete from auth_sessions where user_id=${id}`;
        await tx`delete from auth_rate_limits where subject_type='email' and subject_key=${email}`;
        const [r]=await tx`select id from roles where code=${role}`;
        if (!r) throw new Error(`Fixture role missing: ${role}`);
        const [existing]=await tx`select id from user_role_assignments where user_id=${id} and role_id=${r.id}`;
        const [a]=existing ? [] : await tx`insert into user_role_assignments(user_id,role_id) values(${id},${r.id}) returning id`;
        if (a) await tx`insert into data_scope_grants(assignment_id,scope_type) values(${a.id},'ALL')`;
      }
    }); console.log('Synthetic UX users seeded');
  } finally { await sql.end(); }
} else if (process.argv[2]==='server') {
  process.env.LONGDO_MAP_API_KEY=''; process.env.PERMISSION_NAS_BRIDGE_URL=''; process.env.PERMISSION_NAS_BRIDGE_SECRET='';
  const { nextStart }=await import('next/dist/cli/next-start.js');
  await nextStart({port:3100},process.cwd());
} else throw new Error('Use init, seed or server');
