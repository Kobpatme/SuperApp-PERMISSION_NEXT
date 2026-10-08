import { test,after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID,generateKeyPairSync } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import postgres from 'postgres';
import { carBookingTestUrl } from './car-booking-test-db.mjs';
import { inspectReadiness,configurationChecks } from './car-booking-readiness.mjs';
const db=postgres(carBookingTestUrl().href,{max:1,prepare:false,onnotice:()=>{}});
after(()=>db.end());
const runtime='car_booking_readiness_fixture';let actor;
const inspect=options=>inspectReadiness(db,{runtimeRole:runtime,actor,buildPresent:true,...options});
test('readiness setup is isolated and configuration never exposes secrets',async()=>{
 actor=randomUUID();await db`insert into profiles(id,email,status) values(${actor},${`${actor}@example.test`},'active')`;
 await db`insert into local_credentials(user_id,password_hash) values(${actor},'synthetic-not-a-login-hash')`;
 const [assignment]=await db`insert into user_role_assignments(user_id,role_id) select ${actor},id from roles where code='car_booking_admin' returning id`;
 await db`insert into data_scope_grants(assignment_id,scope_type) values(${assignment.id},'ALL')`;
 await db.unsafe(`create role ${runtime} nologin noinherit nosuperuser nobypassrls;
  grant usage on schema public to ${runtime};
  grant select,insert,update on car_booking_cars,car_booking_bookings,car_booking_osp_jobs to ${runtime};
  grant select,insert on car_booking_logs to ${runtime};
  grant select,update on car_booking_settings,car_booking_osp_state to ${runtime};
  grant select on car_booking_osp_report to ${runtime};
  grant insert on audit_logs,activity_events,outbox_messages to ${runtime};
  grant execute on function car_booking_has_access(text,uuid),car_booking_calendar(timestamptz,timestamptz),car_booking_lock_car(uuid),car_booking_previous_unreturned(uuid),car_booking_sync_return(uuid),car_booking_vehicle_state(),car_booking_busy_cars(timestamptz,timestamptz),car_booking_can_manage_access(),car_booking_access_users(),car_booking_set_user_access(uuid,boolean,boolean) to ${runtime}`);
 const config=configurationChecks({CAR_BOOKING_GOOGLE_PRIVATE_KEY:'PRIVATE-SENTINEL',CAR_BOOKING_OSP_WORKER_SECRET:'SECRET-SENTINEL'});
 assert.equal(JSON.stringify(config).includes('SENTINEL'),false);assert.equal(config.every(c=>!c.passed),true);
});
test('least privileged fixture is UAT-ready but deferred cutover is not ready; inspection does not mutate',async()=>{
 const before=await db`select (select count(*) from car_booking_bookings)::int as bookings,(select count(*) from audit_logs)::int as audit,(select count(*) from user_role_assignments)::int as assignments`;
 const report=await inspect();assert.equal(report.readyForUat,true,JSON.stringify(report.checks.filter(c=>!c.passed&&c.category!=='release')));assert.equal(report.readyForCutover,false);assert.equal(report.readOnly,true);
 const after=await db`select (select count(*) from car_booking_bookings)::int as bookings,(select count(*) from audit_logs)::int as audit,(select count(*) from user_role_assignments)::int as assignments`;assert.deepEqual(after,before);
 await writeFile(resolve(process.env.CAR_BOOKING_EVIDENCE_DIR??'docs/quality/car-booking-phase-6','readiness-fixture.json'),JSON.stringify(report,null,2)+'\n');
});
test('unsafe operator and excessive test grants cannot pass release preflight',async()=>{
 const operator=await inspect({runtimeRole:undefined});assert.equal(operator.readyForUat,false);assert.equal(operator.checks.find(c=>c.id==='runtime_least_privilege').passed,false);
 const excessive=await inspect({runtimeRole:'car_booking_test_runtime'});assert.equal(excessive.readyForUat,false);assert.equal(excessive.checks.find(c=>c.id==='runtime_has_no_domain_delete').passed,false);
});
test('missing role/build/actor and revoked user fail closed without a mutation',async()=>{
 assert.equal((await inspect({runtimeRole:'missing_role',buildPresent:false,actor:randomUUID()})).readyForUat,false);
 await db`update local_credentials set must_change_password=true where user_id=${actor}`;
 try{assert.equal((await inspect()).checks.find(c=>c.id==='uat_admin_actor_verified').passed,false);}finally{await db`update local_credentials set must_change_password=false where user_id=${actor}`;}
});
test('release attestation stays distinct from external connectivity verification',async()=>{
 const key=generateKeyPairSync('rsa',{modulusLength:2048}).privateKey.export({type:'pkcs8',format:'pem'}).toString();
 const env={CAR_BOOKING_OSP_SYNC_ENABLED:'true',CAR_BOOKING_OSP_SPREADSHEET_ID:'fixture-only',CAR_BOOKING_GOOGLE_CLIENT_EMAIL:'fixture@example.test',CAR_BOOKING_GOOGLE_PRIVATE_KEY:key,CAR_BOOKING_OSP_WORKER_SECRET:'a'.repeat(32),CAR_BOOKING_OSP_WORKER_USER_ID:actor};
 const review={humanUatApproved:true,latestMigrationReconciled:true,backupRestoreVerified:true,hostingRegionVerified:true,legacyFreezeApproved:true,sheetsIntegrationVerified:true,schedulerVerified:true};
 const report=await inspect({env,review});assert.equal(report.readyForCutover,true);assert.equal(report.externalConnection,'owner_attested');assert.equal(report.externalRequestsMade,0);assert.equal(JSON.stringify(report).includes(key),false);
});
