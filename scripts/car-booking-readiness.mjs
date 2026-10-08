import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createPrivateKey } from 'node:crypto';
import postgres from 'postgres';

const tables=['car_booking_cars','car_booking_bookings','car_booking_logs','car_booking_settings','car_booking_osp_jobs','car_booking_osp_state'];
const helpers=['car_booking_calendar_reader','car_booking_service_worker','car_booking_access_manager'];
const functions=['car_booking_has_access(text,uuid)','car_booking_calendar(timestamp with time zone,timestamp with time zone)','car_booking_lock_car(uuid)','car_booking_previous_unreturned(uuid)','car_booking_sync_return(uuid)','car_booking_vehicle_state()','car_booking_busy_cars(timestamp with time zone,timestamp with time zone)','car_booking_can_manage_access()','car_booking_access_users()','car_booking_set_user_access(uuid,boolean,boolean)'];
const grants={car_booking_cars:['SELECT','INSERT','UPDATE'],car_booking_bookings:['SELECT','INSERT','UPDATE'],car_booking_logs:['SELECT','INSERT'],car_booking_settings:['SELECT','UPDATE'],car_booking_osp_jobs:['SELECT','INSERT','UPDATE'],car_booking_osp_state:['SELECT','UPDATE'],audit_logs:['INSERT'],activity_events:['INSERT'],outbox_messages:['INSERT'],car_booking_osp_report:['SELECT']};
const attestations=['humanUatApproved','latestMigrationReconciled','backupRestoreVerified','hostingRegionVerified','legacyFreezeApproved','sheetsIntegrationVerified','schedulerVerified'];
export function configurationChecks(env={},review={}) {
 let keyValid=false;try{keyValid=createPrivateKey((env.CAR_BOOKING_GOOGLE_PRIVATE_KEY??'').replaceAll('\\n','\n')).asymmetricKeyType==='rsa';}catch{ /* Report only a boolean, never key/parser contents. */ }
 return [
  ['sheets_enabled',env.CAR_BOOKING_OSP_SYNC_ENABLED==='true'],
  ['sheets_spreadsheet_configured',!!env.CAR_BOOKING_OSP_SPREADSHEET_ID?.trim()],
  ['sheets_account_configured',/^[^\s@]+@[^\s@]+$/.test(env.CAR_BOOKING_GOOGLE_CLIENT_EMAIL??'')],
  ['sheets_rsa_key_valid',keyValid],
  ['worker_secret_configured',(env.CAR_BOOKING_OSP_WORKER_SECRET??'').length>=32],
  ['worker_principal_configured',/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(env.CAR_BOOKING_OSP_WORKER_USER_ID??'')],
  ...attestations.map(name=>[name,review[name]===true]),
 ].map(([id,passed])=>({id,passed,category:'release'}));
}
export async function inspectReadiness(db,{runtimeRole,actor,env={},review={},buildPresent=false}={}) {
 return db.begin('read only',async tx=>{
  const checks=[],add=(id,passed)=>checks.push({id,passed:!!passed,category:'database'});
  const [role]=await tx`select oid,rolsuper,rolbypassrls from pg_roles where rolname=coalesce(${runtimeRole??null},current_user)`;
  add('runtime_role_exists',!!role);add('runtime_least_privilege',role&&!role.rolsuper&&!role.rolbypassrls);
  const objects=await tx`select c.relname,c.relrowsecurity,c.relforcerowsecurity,c.relowner from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname in ${tx(tables)}`;
  add('six_car_tables_installed',objects.length===tables.length);
  add('all_car_tables_force_rls',objects.length===tables.length&&objects.every(o=>o.relrowsecurity&&o.relforcerowsecurity));
  add('runtime_is_not_table_owner',role&&objects.length===tables.length&&objects.every(o=>o.relowner!==role.oid));
  const migrations=await tx`select to_regclass('public.schema_migrations') is not null as present`;
  const installed=migrations[0].present?await tx`select name from public.schema_migrations where name like '0024_%' or name like '0025_%' or name like '0026_%' or name like '0027_%'`:[];
  add('four_car_migrations_recorded',installed.length===4);
  const helperRoles=await tx`select oid,rolcanlogin,rolinherit,rolsuper,rolbypassrls from pg_roles where rolname in ${tx(helpers)}`;
  add('helper_roles_safe',helperRoles.length===3&&helperRoles.every(r=>!r.rolcanlogin&&!r.rolinherit&&!r.rolsuper&&!r.rolbypassrls));
  let member=false;if(role)for(const h of helperRoles){const [r]=await tx`select pg_has_role(${role.oid}::oid,${h.oid}::oid,'MEMBER') as member`;member ||= r.member;}
  add('runtime_cannot_assume_helper_role',role&&helperRoles.length===3&&!member);
  if(objects.length===tables.length){
   const constraints=await tx`select conname,contype from pg_constraint where conrelid='public.car_booking_bookings'::regclass and conname in ('car_booking_car_overlap','car_booking_user_overlap')`;
   add('both_exclusion_constraints',constraints.length===2&&constraints.every(c=>c.contype==='x'));
   const [view]=await tx`select 'security_invoker=true'=any(reloptions) as secure from pg_class where oid=to_regclass('public.car_booking_osp_report')`;
   add('osp_view_security_invoker',view?.secure);
  }else{add('both_exclusion_constraints',false);add('osp_view_security_invoker',false);}
  let hasGrants=!!role,canDelete=false,canRewriteLogs=false;
  if(role)for(const [table,privileges] of Object.entries(grants)){
   const [object]=await tx`select to_regclass(${'public.'+table})::oid as oid`;
   if(!object.oid){hasGrants=false;continue;}
   for(const privilege of privileges){const [allowed]=await tx`select has_table_privilege(${role.oid}::oid,${object.oid}::oid,${privilege}) as allowed`;hasGrants&&=allowed.allowed;}
   if(tables.includes(table)){const [allowed]=await tx`select has_table_privilege(${role.oid}::oid,${object.oid}::oid,'DELETE') as allowed`;canDelete ||= allowed.allowed;}
   if(table==='car_booking_logs'){const [allowed]=await tx`select has_table_privilege(${role.oid}::oid,${object.oid}::oid,'UPDATE') as allowed`;canRewriteLogs=allowed.allowed;}
  }
  add('runtime_required_table_grants',hasGrants);add('runtime_has_no_domain_delete',role&&!canDelete);add('runtime_cannot_rewrite_logs',role&&!canRewriteLogs);
  let hasFunctions=!!role,publicExecute=false;
  for(const signature of functions){
   const [fn]=await tx`select to_regprocedure(${'public.'+signature})::oid as oid`;if(!fn.oid){hasFunctions=false;continue;}
   if(role){const [allowed]=await tx`select has_function_privilege(${role.oid}::oid,${fn.oid}::oid,'EXECUTE') as allowed`;hasFunctions&&=allowed.allowed;}
   const [acl]=await tx`select exists(select 1 from pg_proc p cross join lateral aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a where p.oid=${fn.oid} and a.grantee=0 and a.privilege_type='EXECUTE') as exposed`;publicExecute ||= acl.exposed;
  }
  add('runtime_required_function_grants',hasFunctions);add('helper_functions_not_public',hasFunctions&&!publicExecute);
  let actorAllowed=false;
  if(actor&&objects.length===tables.length){await tx`select set_config('app.user_id',${actor},true)`;const [r]=await tx`select public.car_booking_has_access('car_booking.module.admin') as allowed`;actorAllowed=r.allowed;}
  add('uat_admin_actor_verified',actorAllowed);
  checks.push({id:'production_build_available',passed:buildPresent,category:'application'},...configurationChecks(env,review));
  let workerAllowed=false;
  const worker=env.CAR_BOOKING_OSP_WORKER_USER_ID;
  if(worker&&configurationChecks(env,review).find(c=>c.id==='worker_principal_configured').passed&&objects.length===tables.length){await tx`select set_config('app.user_id',${worker},true)`;const [r]=await tx`select public.car_booking_has_access('car_booking.module.admin') as allowed`;workerAllowed=r.allowed;}
  checks.push({id:'worker_active_car_admin_verified',passed:workerAllowed,category:'release'});
  const readyForUat=checks.filter(c=>c.category!=='release').every(c=>c.passed);
  return {version:1,scope:'car-booking',checkedAt:new Date().toISOString(),readOnly:true,readyForUat,readyForCutover:checks.every(c=>c.passed),checks,externalConnection:review.sheetsIntegrationVerified===true?'owner_attested':'not_verified',externalRequestsMade:0};
 });
}
async function main(){
 const options={mode:'local'},args=process.argv.slice(2);
 for(let i=0;i<args.length;i++){const key=args[i];if(!['--mode','--runtime-role','--actor','--review','--output'].includes(key)||!args[i+1]||args[i+1].startsWith('--'))throw new Error('INVALID_ARGUMENT');options[key.slice(2)]=args[++i];}
 if(!['local','release'].includes(options.mode))throw new Error('INVALID_MODE');
 const url=process.env.CAR_BOOKING_READINESS_DATABASE_URL;if(!url)throw new Error('EXPLICIT_READINESS_DATABASE_URL_REQUIRED');
 let buildPresent=false;try{await access(resolve('.next/BUILD_ID'));buildPresent=true;}catch{ /* An unbuilt application is not ready. */ }
 const review=options.review?JSON.parse(await readFile(resolve(options.review),'utf8')):{};
 const db=postgres(url,{max:1,prepare:false,onnotice:()=>{}});let report;
 try{report=await inspectReadiness(db,{runtimeRole:options['runtime-role'],actor:options.actor,env:process.env,review,buildPresent});}finally{await db.end();}
 if(options.output){const path=resolve(options.output);await mkdir(dirname(path),{recursive:true});await writeFile(path,JSON.stringify(report,null,2)+'\n');}
 console.log(JSON.stringify(report,null,2));process.exitCode=(options.mode==='release'?report.readyForCutover:report.readyForUat)?0:1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(()=>{console.error('ตรวจความพร้อมไม่สำเร็จ: ตรวจ connection และอาร์กิวเมนต์ ไม่มีการเปลี่ยนข้อมูล');process.exitCode=1;});
