import {readFile,readdir} from 'node:fs/promises';
import {parse} from 'dotenv';
import postgres from 'postgres';
import {hash} from '@node-rs/argon2';
const env=parse(await readFile('.env.local','utf8')),base=new URL(env.DATABASE_URL);
if(!['localhost','127.0.0.1','[::1]'].includes(base.hostname))throw Error('Loopback fixture required');
const name='permission_next_sync_session_test',target=new URL(base);target.pathname='/'+name;
const adminUrl=new URL(base);adminUrl.pathname='/postgres';
if(process.argv[2]==='init'){
 const admin=postgres(adminUrl.href,{max:1,onnotice:()=>{}});try{if(!(await admin`select 1 from pg_database where datname=${name}`).length)await admin.unsafe(`create database ${name}`);}finally{await admin.end();}
 const db=postgres(target.href,{max:1,prepare:false,onnotice:()=>{}});try{await db`create table if not exists schema_migrations(name text primary key,applied_at timestamptz not null default now())`;
 for(const file of (await readdir('supabase/migrations')).filter(x=>/^\d.*\.sql$/.test(x)).sort())if(!(await db`select 1 from schema_migrations where name=${file}`).length)await db.begin(async tx=>{await tx.unsafe(await readFile('supabase/migrations/'+file,'utf8'));await tx`insert into schema_migrations(name) values(${file})`;});
 console.log('Dedicated sync/session fixture migrated');}finally{await db.end();}
}else if(process.argv[2]==='seed'){
 const db=postgres(target.href,{max:1,prepare:false}),password=await hash('FixturePassword123!',{memoryCost:19456,timeCost:2,parallelism:1,outputLen:32});
 try{await db.begin(async tx=>{
 const team='00000000-0000-4000-8000-000000001201';await tx`insert into teams(id,code,name) values(${team},'SYNC-FIXTURE','ทีมทดสอบ Sync') on conflict(id) do nothing`;
 const [staff]=await tx`insert into roles(code,name,is_system) values('sync_staff','Synthetic sync staff',false) on conflict(code) do update set name=excluded.name returning id`;
 for(const permission of ['work.task.read','work.task.create','work.task.update','work.note.create','kpi.score.read'])await tx`insert into role_permissions(role_id,permission_code) values(${staff.id},${permission}) on conflict do nothing`;
 for(const [suffix,email,role] of [['101','sync-staff@example.test','sync_staff'],['102','sync-other@example.test','sync_staff'],['103','sync-admin@example.test','platform_admin']]){
 const id='00000000-0000-4000-8000-000000001'+suffix;
 await tx`insert into profiles(id,email,display_name,status) values(${id},${email},'ผู้ใช้ทดสอบ Sync','active') on conflict(id) do update set status='active'`;
 await tx`insert into local_credentials(user_id,password_hash,must_change_password) values(${id},${password},false) on conflict(user_id) do update set password_hash=${password},must_change_password=false,failed_attempts=0,locked_until=null`;
 await tx`delete from auth_sessions where user_id=${id}`;await tx`delete from auth_rate_limits where subject_type='email' and subject_key=${email}`;
 await tx`insert into user_teams(user_id,team_id) values(${id},${team}) on conflict do nothing`;
 const [r]=await tx`select id from roles where code=${role}`;const [old]=await tx`select id from user_role_assignments where user_id=${id} and role_id=${r.id}`;
 if(!old){const [a]=await tx`insert into user_role_assignments(user_id,role_id) values(${id},${r.id}) returning id`;await tx`insert into data_scope_grants(assignment_id,scope_type) values(${a.id},${role==='sync_staff'?'OWN':'ALL'})`;}
 }
 const metric='00000000-0000-4000-8000-000000001301',rule='00000000-0000-4000-8000-000000001302',actor='00000000-0000-4000-8000-000000001103';
 await tx`insert into kpi_metrics(id,code,name,unit) values(${metric},'SYNC-FIXTURE','Delivery','งาน') on conflict(id) do nothing`;
 await tx`insert into kpi_rule_versions(id,metric_id,version,event_type,status,effective_from,rule,created_by) values(${rule},${metric},1,'work.task.completed.v1','active',now(),${tx.json({work:{teamId:team,mainKpi:'Delivery',subKpi:'Fixture KPI',slaDays:2,mainWeight:'100',active:true}})},${actor}) on conflict(id) do nothing`;
 });console.log('Dedicated synthetic users and work rule seeded');}finally{await db.end();}
}else if(process.argv[2]==='server'){
 process.env.DATABASE_URL=target.href;delete process.env.CAR_BOOKING_DATABASE_URL;process.env.NODE_ENV='production';
 process.env.LONGDO_MAP_API_KEY='';process.env.PERMISSION_NAS_BRIDGE_URL='';process.env.PERMISSION_NAS_BRIDGE_SECRET='';process.env.AUTH_SINGLE_SESSION=process.env.AUTH_SINGLE_SESSION||'true';
 const {nextStart}=await import('next/dist/cli/next-start.js');await nextStart({port:3110},process.cwd());
}else throw Error('Use init, seed or server');
