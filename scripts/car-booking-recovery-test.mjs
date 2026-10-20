import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir,writeFile } from 'node:fs/promises';
import { resolve,join } from 'node:path';
import assert from 'node:assert/strict';
import postgres from 'postgres';
import { carBookingTestUrl } from './car-booking-test-db.mjs';
const execute=promisify(execFile),target=carBookingTestUrl(),restoreName='permission_next_car_booking_restore_test';
const binaryDirectory=resolve(process.env.CAR_BOOKING_TEST_PG_BIN??'.data/car-booking-postgres/pgsql/bin');
const source=postgres(target.href,{max:1,prepare:false,onnotice:()=>{}});
const restoredUrl=new URL(target);restoredUrl.pathname='/'+restoreName;
const restored=postgres(restoredUrl.href,{max:1,prepare:false,onnotice:()=>{}});
async function fingerprint(db){
 const result={};
 for(const table of ['car_booking_cars','car_booking_bookings','car_booking_logs','audit_logs','activity_events','outbox_messages','profiles','user_role_assignments']){
  const [row]=await db.unsafe(`select count(*)::int as count,md5(coalesce(string_agg(row_to_json(t)::text,'|' order by id),'')) as checksum from public.${table} t`);result[table]=row;
 }
 return result;
}
try{
 assert.equal(target.pathname,'/permission_next_car_booking_test');
 if((await source`select 1 from pg_database where datname=${restoreName}`).length)throw new Error('Restore fixture already exists; use a new cluster');
 const directory=resolve('.data/car-booking-recovery');await mkdir(directory,{recursive:true});
 const backup=join(directory,`fixture-${Date.now()}.dump`),before=await fingerprint(source);
 const args=['--host',target.hostname,'--port',target.port||'5432','--username',decodeURIComponent(target.username)];
 const env={...process.env,PGPASSWORD:decodeURIComponent(target.password)};
 const dumpStart=performance.now();await execute(join(binaryDirectory,'pg_dump.exe'),[...args,'--dbname','permission_next_car_booking_test','--format=custom','--file',backup],{env,windowsHide:true});const backupMs=Math.round(performance.now()-dumpStart);
 await source.unsafe(`create database ${restoreName}`);
 const restoreStart=performance.now();await execute(join(binaryDirectory,'pg_restore.exe'),[...args,'--dbname',restoreName,'--exit-on-error',backup],{env,windowsHide:true});const restoreMs=Math.round(performance.now()-restoreStart);
 const after=await fingerprint(restored);assert.deepEqual(after,before);
 const [rls]=await restored`select count(*)::int as count from pg_class where relname in ('car_booking_cars','car_booking_bookings','car_booking_logs','car_booking_settings','car_booking_osp_jobs','car_booking_osp_state') and relrowsecurity and relforcerowsecurity`;
 assert.equal(rls.count,6);
 const [constraints]=await restored`select count(*)::int as count from pg_constraint where conrelid='public.car_booking_bookings'::regclass and conname in ('car_booking_car_overlap','car_booking_user_overlap') and contype='x'`;assert.equal(constraints.count,2);
 await restored.begin(async tx=>{await tx.unsafe('set local role car_booking_test_runtime');await tx`select set_config('app.user_id','',true)`;assert.equal((await tx`select id from car_booking_bookings`).length,0);});
 const evidence={syntheticOnly:true,backupMs,restoreMs,rowCounts:Object.fromEntries(Object.entries(before).map(([table,row])=>[table,row.count])),allFingerprintsMatch:true,forceRlsTables:6,exclusionConstraints:2,anonymousRuntimeRows:0,mainDatabaseWrites:false};
 await writeFile(join(resolve(process.env.CAR_BOOKING_EVIDENCE_DIR??'docs/quality/car-booking-phase-6'),'recovery.json'),JSON.stringify(evidence,null,2)+'\n');
 console.log(JSON.stringify(evidence));
}catch{console.error('Fixture backup/restore verification failed; no main database was modified');process.exitCode=1;}
finally{await restored.end();await source.end();}
