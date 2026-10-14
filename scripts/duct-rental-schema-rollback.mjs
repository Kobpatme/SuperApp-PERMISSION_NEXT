// Validate transactional DDL rollback in a separate, empty, loopback-only fixture database.
import { readFile, readdir } from "node:fs/promises";
import { config } from "dotenv";
import postgres from "postgres";
import assert from "node:assert/strict";
config({path:".env.local",quiet:true});
const configured=process.env.DUCT_RENTAL_TEST_DATABASE_URL||process.env.DATABASE_URL;if(!configured)throw new Error("Local fixture connection required");
const url=new URL(configured), name="permission_next_duct_rental_rollback_test";
if(!["localhost","127.0.0.1","[::1]"].includes(url.hostname))throw new Error("Loopback database required");
url.pathname="/postgres";const control=postgres(url.href,{max:1,prepare:false,onnotice:()=>{}});
try{if(!(await control`select 1 from pg_database where datname=${name}`).length)await control.unsafe(`create database ${name}`);}finally{await control.end();}
url.pathname=`/${name}`;const db=postgres(url.href,{max:1,prepare:false,onnotice:()=>{}});
try{
 assert.equal((await db`select count(*)::int as n from pg_tables where schemaname='public'`)[0].n,0,"Rollback fixture must be empty");
 const rollback=new Error("Expected DDL rollback"), files=(await readdir("supabase/migrations")).filter(file=>/^\d.*\.sql$/.test(file)).sort();
 await assert.rejects(db.begin(async tx=>{for(const file of files)await tx.unsafe(await readFile(`supabase/migrations/${file}`,"utf8"));assert.equal((await tx`select count(*)::int as n from permissions where module_id='duct-rental'`)[0].n,40);throw rollback;}),error=>error===rollback);
 assert.equal((await db`select count(*)::int as n from pg_tables where schemaname='public'`)[0].n,0);
 assert.equal((await db`select count(*)::int as n from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'duct_rental_%'`)[0].n,0);
 console.log(JSON.stringify({database:name,migrations:files.length,transactionalDdlRollback:true,remainingPublicTables:0,remainingDuctFunctions:0,mainDatabaseTouched:false}));
}finally{await db.end();}
