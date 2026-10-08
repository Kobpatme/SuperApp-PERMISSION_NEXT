import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, writeFile, readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import postgres from 'postgres';
import { carBookingTestUrl } from './car-booking-test-db.mjs';
import { executeImport, snapshot } from './import-car-booking.mjs';
import { fixture, csv } from './car-booking-import-fixture.mjs';
const db=postgres(carBookingTestUrl().href,{max:3,prepare:false,onnotice:()=>{}});
after(()=>db.end());
let actor,first,second,f,initial;
test('prepare synthetic import users; source roles propose only, no credentials migrated',async()=>{
 [actor,first,second]=[randomUUID(),randomUUID(),randomUUID()];
 for(const [id,code] of [[actor,'999'],[first,'101'],[second,'102']]){
  await db`insert into profiles(id,email,employee_code,status) values(${id},${`${id}@example.test`},${code},'active')`;
  await db`insert into local_credentials(user_id,password_hash) values(${id},'synthetic-not-a-login-hash')`;
 }
 for(const permission of ['car_booking.module.admin','core.user.manage']){
  const role=randomUUID(),assignment=randomUUID();
  await db`insert into roles(id,code,name) values(${role},${`import-${role}`},'Synthetic import operator')`;
  await db`insert into role_permissions(role_id,permission_code) values(${role},${permission})`;
  await db`insert into user_role_assignments(id,user_id,role_id) values(${assignment},${actor},${role})`;
  await db`insert into data_scope_grants(assignment_id,scope_type) values(${assignment},'ALL')`;
 }
 f=fixture(first,second);initial=await executeImport(db,f.files,{actor});
 assert.equal(initial.applied,false);assert.equal(initial.rows.Bookings.length,1);assert.equal(initial.accessProposals.find(p=>p.user_id===first).level,'admin');
 assert.equal((await db`select count(*)::int as n from car_booking_bookings where legacy_id='legacy-completed'`)[0].n,0);
});
test('actor denial and stale approval roll back without records',async()=>{
 await assert.rejects(executeImport(db,f.files,{actor:first,apply:true,approval:initial.approval}),/ACTIVE_CAR_ADMIN/);
 await assert.rejects(executeImport(db,f.files,{actor,apply:true,approval:'stale'}),/APPROVAL_DIGEST/);
 assert.equal((await db`select count(*)::int as n from car_booking_cars where legacy_id=1`)[0].n,0);
});
test('audit failure rolls back cars, bookings, logs and outbox',async()=>{
 await db.unsafe(`create function car_import_test_audit_failure() returns trigger language plpgsql as $$ begin if new.action='car_booking.legacy_import' then raise exception 'synthetic audit failure'; end if; return new; end $$`);
 await db.unsafe('create trigger car_import_test_audit_failure before insert on audit_logs for each row execute function car_import_test_audit_failure()');
 try{await assert.rejects(executeImport(db,f.files,{actor,apply:true,approval:initial.approval}),/synthetic audit failure/);assert.equal((await db`select count(*)::int as n from car_booking_bookings where legacy_id='legacy-completed'`)[0].n,0);}
 finally{await db.unsafe('drop trigger car_import_test_audit_failure on audit_logs');await db.unsafe('drop function car_import_test_audit_failure()');}
});
test('real SQL apply reconciles counts and exact totals; no automatic grants',async()=>{
 const applied=await executeImport(db,f.files,{actor,apply:true,approval:initial.approval});
 assert.equal(applied.inserted,3);assert.equal(applied.granted,0);assert.deepEqual(applied.reconciliation.monthly,{'2035-01':{bookings:1,distance:'100',liters:'40',amount:'1600'}});
 assert.equal((await db`select count(*)::int as n from user_role_assignments where user_id=${first}`)[0].n,0);
 assert.equal((await db`select count(*)::int as n from audit_logs where action='car_booking.legacy_import'`)[0].n,1);
 assert.equal((await db`select count(*)::int as n from outbox_messages where topic='car_booking.legacy_imported'`)[0].n,1);
});
test('rerun is idempotent with original approval and produces no duplicate events',async()=>{
 const repeat=await executeImport(db,f.files,{actor,apply:true,approval:initial.approval});assert.equal(repeat.inserted,0);assert.equal(repeat.counts.Bookings.unchanged,1);
 assert.equal((await db`select count(*)::int as n from audit_logs where action='car_booking.legacy_import'`)[0].n,1);
});
test('reviewed additive access applies once and preserves unrelated assignments',async()=>{
 const role=randomUUID(),assignment=randomUUID();
 await db`insert into roles(id,code,name) values(${role},${`retained-${role}`},'Synthetic retained role')`;
 await db`insert into user_role_assignments(id,user_id,role_id) values(${assignment},${first},${role})`;
 await db`insert into data_scope_grants(assignment_id,scope_type) values(${assignment},'OWN')`;
 const accessReview={sourceHash:initial.sourceHash,reviewed:true,grants:[{user_id:first,level:'admin'},{user_id:second,level:'use'}]};
 const dry=await executeImport(db,f.files,{actor,accessReview});
 const applied=await executeImport(db,f.files,{actor,accessReview,apply:true,approval:dry.approval});assert.equal(applied.granted,2);
 assert.equal((await db`select count(*)::int as n from data_scope_grants where assignment_id=${assignment} and scope_type='OWN'`)[0].n,1);
 const repeat=await executeImport(db,f.files,{actor,accessReview,apply:true,approval:dry.approval});assert.equal(repeat.granted,0);
 const bad={...accessReview,grants:[{user_id:second,level:'admin'}]},badDry=await executeImport(db,f.files,{actor,accessReview:bad});
 await assert.rejects(executeImport(db,f.files,{actor,accessReview:bad,apply:true,approval:badDry.approval}),/UNREVIEWED_ACCESS/);
});
test('existing business edits are reported and source overlaps/orphans remain rejected',async()=>{
 const files={...f.files},booking={...f.data.Bookings[0],booking_id:'legacy-overlap'};
 files.Bookings=csv('Bookings',[booking]);files.BookingLogs=csv('BookingLogs',[{...f.data.BookingLogs[0],booking_id:'legacy-overlap'}]);
 const dry=await executeImport(db,files,{actor});assert.equal(dry.rejected.find(r=>r.sheet==='Bookings').reason,'OVERLAPPING_BOOKING');assert.equal(dry.rejected.find(r=>r.sheet==='BookingLogs').reason,'ORPHAN_BOOKING');
 await db`update car_booking_bookings set destination='New app edit' where legacy_id='legacy-completed'`;
 const changed=await executeImport(db,f.files,{actor});assert.equal(changed.rejected.find(r=>r.sheet==='Bookings').reason,'EXISTING_RECORD_DIFFERS');
 await db`update car_booking_bookings set destination=${f.data.Bookings[0].destination} where legacy_id='legacy-completed'`;
});
test('CLI dry-run writes reports and actual OSP download without database mutations',async()=>{
 const root=await mkdtemp(join(resolve('.data'),'car-import-fixture-'));
 for(const [sheet,data] of Object.entries(f.files))await writeFile(join(root,`${sheet}.csv`),data);
 const output=join(root,'report');
 const {stdout}=await promisify(execFile)(process.execPath,['scripts/import-car-booking.mjs','--input',root,'--actor',actor,'--output',output],{env:{...process.env,CAR_BOOKING_IMPORT_DATABASE_URL:carBookingTestUrl().href}});
 assert.equal(JSON.parse(stdout).applied,false);const report=JSON.parse(await readFile(join(output,'report.json'),'utf8'));assert.equal(report.counts.BookingLogs.unchanged,1);assert.ok((await readFile(join(output,'osp-regenerated.csv'),'utf8')).includes('"1600"'));
 assert.equal((await snapshot(db)).bookings.filter(b=>b.legacy_id==='legacy-completed').length,1);
});
test('reconciliation includes every database fuel log, not just legacy IDs',async()=>{
 await assert.rejects(db.begin(async tx=>{
  const [b]=await tx`select id from car_booking_bookings where legacy_id='legacy-completed'`;
  await tx`insert into car_booking_logs(booking_id,log_time,log_type,location,mileage,refueled,fuel_liters,fuel_amount,created_by) values(${b.id},'2035-01-01T02:30:00Z','fuel','Synthetic extra fuel',60,true,1,40,${first})`;
  await executeImport({begin:(...args)=>args[1](tx)},f.files,{actor,apply:true,approval:initial.approval});
 }),/RECONCILIATION_TOTAL_MISMATCH/);
});
