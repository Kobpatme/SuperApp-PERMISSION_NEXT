import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import postgres from 'postgres';
import { headers, planImport, clean, totals } from './car-booking-import-core.mjs';
import { ospCsv } from '../src/lib/car-booking-osp.ts';

export async function snapshot(tx) {
 const [profiles,cars,bookings,logs]=await Promise.all([
  tx`select id,employee_code,status from profiles`,tx`select * from car_booking_cars`,
  tx`select * from car_booking_bookings`,tx`select * from car_booking_logs`,
 ]);
 return {profiles,cars,bookings,logs};
}
function reviewedTarget(review){
 return review?.version===1&&review.approved===true&&review.backupRestoreVerified===true&&review.humanUatApproved===true&&review.legacyFreezeApproved===true&&review.latestCloneRehearsalPassed===true&&typeof review.target?.hostname==='string'&&typeof review.target?.database==='string'&&review.target.database.trim()!==''&&!['postgres','template0','template1'].includes(review.target.database)&&Number.isInteger(review.target.port)&&review.target.port>0&&review.target.port<=65535&&/^[a-f0-9]{64}$/.test(review.sourceHash??'')&&/^[a-f0-9]{64}$/.test(review.approval??'');
}
export function checkTarget(url,apply,review) {
 const target=new URL(url);
 if(!['postgres:','postgresql:'].includes(target.protocol))throw new Error('INVALID_DATABASE_URL');
 const fixture=['127.0.0.1','localhost','[::1]'].includes(target.hostname)&&decodeURIComponent(target.pathname)==='/permission_next_car_booking_test';
 if(apply && !fixture && !review)throw new Error('APPLY_REQUIRES_ISOLATED_CAR_TEST_DATABASE');
 if(apply && review && (!reviewedTarget(review)||review.target.hostname!==target.hostname||review.target.port!==Number(target.port||5432)||review.target.database!==decodeURIComponent(target.pathname.slice(1))))throw new Error('TARGET_REVIEW_MISMATCH');
 return target;
}
export async function executeImport(db,files,options) {
 return db.begin('isolation level serializable',async tx=>{
  if(options.apply){const [target]=await tx`select current_database() as name`;if(target.name!=='permission_next_car_booking_test'&&!reviewedTarget(options.targetReview))throw new Error('APPLY_REQUIRES_ISOLATED_CAR_TEST_DATABASE');if(options.targetReview&&(!reviewedTarget(options.targetReview)||target.name!==options.targetReview.target.database))throw new Error('TARGET_REVIEW_MISMATCH');}
  await tx`select pg_advisory_xact_lock(hashtextextended('car-booking-legacy-import-v1',0))`;
  const [operator]=await tx`select rolsuper or rolbypassrls as allowed from pg_roles where rolname=current_user`;
  if(!operator.allowed)throw new Error('OFFLINE_OPERATOR_WITH_RLS_BYPASS_REQUIRED');
  await tx`select set_config('app.user_id',${options.actor},true)`;
  const [permission]=await tx`select public.car_booking_has_access('car_booking.module.admin') as allowed`;
  if(!permission.allowed)throw new Error('ACTIVE_CAR_ADMIN_ACTOR_REQUIRED');
  const before=await snapshot(tx),plan=planImport(files,before,options);
  if(!options.apply)return {...plan,applied:false};
  if(options.approval!==plan.approval)throw new Error('APPROVAL_DIGEST_MISMATCH_RERUN_DRY_RUN');
  if(options.targetReview&&(options.targetReview.sourceHash!==plan.sourceHash||options.targetReview.approval!==plan.approval))throw new Error('TARGET_REVIEW_SOURCE_MISMATCH');
  const review=options.accessReview;
  if(review && (review.sourceHash!==plan.sourceHash || review.reviewed!==true || !Array.isArray(review.grants)))throw new Error('INVALID_ACCESS_REVIEW');
  let granted=0;
  if(review){
   const [manage]=await tx`select public.car_booking_can_manage_access() as allowed`;
   if(!manage.allowed)throw new Error('CORE_USER_MANAGE_REQUIRED');
   if(new Set(review.grants.map(g=>g.user_id)).size!==review.grants.length)throw new Error('DUPLICATE_ACCESS_REVIEW');
   for(const grant of review.grants){
    const proposal=plan.accessProposals.find(p=>p.user_id===grant.user_id && p.eligible);
    if(!proposal || !['use','admin'].includes(grant.level) || (grant.level==='admin'&&proposal.level!=='admin'))throw new Error('UNREVIEWED_ACCESS_GRANT');
   }
  }
  const table={Cars:'car_booking_cars',Bookings:'car_booking_bookings',BookingLogs:'car_booking_logs'};
  let inserted=0;
  for(const [name,rows] of Object.entries(plan.rows)) {
   const fresh=rows.filter(r=>r.mode==='insert').map(clean);
   for(let i=0;i<fresh.length;i+=250){const batch=fresh.slice(i,i+250);await tx`insert into ${tx(table[name])} ${tx(batch)}`;inserted+=batch.length;}
  }
  // Reviewed access is additive: retain existing car admin/use and all unrelated scopes.
  if(review)for(const grant of review.grants){
   await tx`select pg_advisory_xact_lock(hashtext('car-access:'||${grant.user_id}::text))`;
   const [target]=await tx`select can_admin,can_use from public.car_booking_access_users() where id=${grant.user_id}`;
   const admin=target.can_admin||grant.level==='admin',use=target.can_use||grant.level==='use';
   if(admin!==target.can_admin||use!==target.can_use){await tx`select public.car_booking_set_user_access(${grant.user_id},${use},${admin})`;granted++;}
  }
  const after=await snapshot(tx);
  const actual={};
  for(const [name,rows] of Object.entries(plan.rows)){
   const source={Cars:after.cars,Bookings:after.bookings,BookingLogs:after.logs}[name];
   actual[name]=source.filter(r=>rows.some(expected=>expected.id===r.id));
   if(actual[name].length!==rows.length)throw new Error('RECONCILIATION_COUNT_MISMATCH');
  }
  const bookingIds=new Set(actual.Bookings.map(b=>b.id));
  const monthly=totals(actual.Bookings,after.logs.filter(l=>bookingIds.has(l.booking_id)));
  if(JSON.stringify(monthly)!==JSON.stringify(plan.monthly))throw new Error('RECONCILIATION_TOTAL_MISMATCH');
  const [overlap]=await tx`select exists(select 1 from car_booking_bookings a join car_booking_bookings b on a.id<b.id
   and (a.car_id=b.car_id or a.user_id=b.user_id) where a.status<>'cancelled' and b.status<>'cancelled'
   and tstzrange(a.start_time,least(a.end_time,coalesce(a.actual_return_time,a.end_time)),'[)') && tstzrange(b.start_time,least(b.end_time,coalesce(b.actual_return_time,b.end_time)),'[)')) as conflict`;
  if(overlap.conflict)throw new Error('RECONCILIATION_OVERLAP');
  if(inserted||granted){
   const event=randomUUID(),request=`car-import:${plan.approval}`,metadata={sourceHash:plan.sourceHash,approval:plan.approval,targetReviewVerified:!!options.targetReview,inserted,granted,reviewedGrants:review?.grants??[],rejected:plan.rejected.length,monthly};
   await tx`insert into audit_logs(actor_id,module_id,action,entity_type,entity_id,request_id,metadata) values(${options.actor},'car-booking','car_booking.legacy_import','import',${event},${request},${tx.json(metadata)})`;
   await tx`insert into activity_events(id,event_type,event_version,actor_id,owner_id,module_id,entity_type,entity_id,occurred_at,source_system,source_event_id,correlation_id,payload)
    values(${event},'car_booking.legacy_imported',1,${options.actor},${options.actor},'car-booking','import',${event},now(),'car-booking-csv',${event},${request},${tx.json(metadata)})`;
   await tx`insert into outbox_messages(topic,idempotency_key,aggregate_type,aggregate_id,payload) values('car_booking.legacy_imported',${event},'import',${event},${tx.json(metadata)})`;
  }
  return {...plan,applied:true,inserted,granted,reconciliation:{counts:Object.fromEntries(Object.entries(actual).map(([k,v])=>[k,v.length])),monthly,overlaps:0}};
 });
}
async function main() {
 const args=process.argv.slice(2),options={};
 for(let i=0;i<args.length;i++){const key=args[i];if(key==='--apply')options.apply=true;else if(['--input','--output','--actor','--mapping','--approve','--access-review','--target-review'].includes(key)&&args[i+1]&&!args[i+1].startsWith('--'))options[key.slice(2)]=args[++i];else throw new Error('INVALID_ARGUMENT');}
 if(!options.input||!options.actor||! /^[0-9a-f-]{36}$/i.test(options.actor))throw new Error('INPUT_AND_ACTOR_REQUIRED');
 const connection=process.env.CAR_BOOKING_IMPORT_DATABASE_URL;
 if(!connection)throw new Error('EXPLICIT_CAR_BOOKING_IMPORT_DATABASE_URL_REQUIRED');
 options.targetReview=options['target-review']?JSON.parse(await readFile(resolve(options['target-review']),'utf8')):undefined;
 checkTarget(connection,options.apply,options.targetReview);
 const files={};for(const sheet of Object.keys(headers)){const data=await readFile(join(resolve(options.input),`${sheet}.csv`));if(data.length>50*1024*1024)throw new Error('CSV_FILE_EXCEEDS_50_MIB');files[sheet]=new TextDecoder('utf-8',{fatal:true}).decode(data);}
 options.mapping=options.mapping?JSON.parse(await readFile(resolve(options.mapping),'utf8')):{};
 if(options.mapping===null||typeof options.mapping!=='object'||Array.isArray(options.mapping))throw new Error('INVALID_MAPPING');
 options.accessReview=options['access-review']?JSON.parse(await readFile(resolve(options['access-review']),'utf8')):undefined;
 options.approval=options.approve;
 const output=resolve(options.output??'.data/car-booking-import/latest');
 const db=postgres(connection,{max:1,prepare:false,onnotice:()=>{}});
 let result;try{result=await executeImport(db,files,options);}finally{await db.end();}
 await mkdir(output,{recursive:true});
 const {rows,regeneratedOsp,...report}=result;
 void rows;
 await writeFile(join(output,'report.json'),JSON.stringify(report,null,2));
 await writeFile(join(output,'rejected-rows.json'),JSON.stringify(result.rejected,null,2));
 await writeFile(join(output,'osp-regenerated.csv'),ospCsv(regeneratedOsp));
 console.log(JSON.stringify({applied:result.applied,approval:result.approval,counts:result.counts,output}));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(error=>{const reason=/^[A-Z0-9_]+$/.test(error.message)?error.message:'DATABASE_OR_FILE_ERROR';console.error(`นำเข้าไม่สำเร็จ (${reason}): ตรวจไฟล์และรายงาน dry-run`);process.exitCode=1;});
