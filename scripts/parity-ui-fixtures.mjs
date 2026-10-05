import { config } from 'dotenv';
import postgres from 'postgres';
import { hash } from '@node-rs/argon2';
config({path:'.env.local',quiet:true});
const target=new URL(process.env.DATABASE_URL);
if(!['localhost','127.0.0.1','[::1]'].includes(target.hostname))throw new Error('Local fixtures only');
target.pathname='/permission_next_parity_test';process.env.DATABASE_URL=target.href;
if(process.argv[2]==='server') {
 process.env.NODE_ENV='production';process.env.PERMISSION_NAS_BRIDGE_URL='';process.env.PERMISSION_NAS_BRIDGE_SECRET='';
 const {nextStart}=await import('next/dist/cli/next-start.js');await nextStart({port:3200},process.cwd());
} else if(process.argv[2]==='seed') {
 const db=postgres(target.href,{max:1});
 try{await db.begin(async tx=>{
  const user='00000000-0000-4000-8000-000000000701',staff='00000000-0000-4000-8000-000000000702',team='00000000-0000-4000-8000-000000000703';
  const passwordHash=await hash('FixturePassword123!',{memoryCost:19456,timeCost:2,parallelism:1,outputLen:32});
  await tx`insert into teams(id,code,name) values(${team},'PARITY-UI','ทีมทดสอบงาน KPI') on conflict do nothing`;
  for(const [id,email,roleCode] of [[user,'parity-admin@example.test','platform_admin'],[staff,'parity-staff@example.test','parity_staff']]){
   if(roleCode==='parity_staff'){
    const [role]=await tx`insert into roles(code,name) values('parity_staff','ผู้ปฏิบัติงานทดสอบ') on conflict(code) do update set name=excluded.name returning id`;
    for(const permission of ['work.task.read','work.task.create','work.task.update','work.note.create','work.report.read','kpi.score.read'])await tx`insert into role_permissions(role_id,permission_code) values(${role.id},${permission}) on conflict do nothing`;
   }
   await tx`insert into profiles(id,email,display_name,status) values(${id},${email},'ผู้ใช้ทดสอบชื่อภาษาไทยยาวสำหรับตรวจงานและสิทธิ์การจัดการ', 'active') on conflict(id) do nothing`;
   await tx`insert into local_credentials(user_id,password_hash,must_change_password) values(${id},${passwordHash},false) on conflict(user_id) do update set password_hash=${passwordHash},failed_attempts=0,locked_until=null`;
   await tx`insert into user_teams(user_id,team_id,is_primary) values(${id},${team},true) on conflict do nothing`;
   const [r]=await tx`select id from roles where code=${roleCode}`;
   let [a]=await tx`select id from user_role_assignments where user_id=${id} and role_id=${r.id}`;
   if(!a)[a]=await tx`insert into user_role_assignments(user_id,role_id) values(${id},${r.id}) returning id`;
   if(!(await tx`select 1 from data_scope_grants where assignment_id=${a.id}`).length)await tx`insert into data_scope_grants(assignment_id,scope_type) values(${a.id},${roleCode==='platform_admin'?'ALL':'OWN'})`;
   await tx`delete from auth_rate_limits where subject_type='email' and subject_key=${email}`;
  }
  const metric='00000000-0000-4000-8000-000000000704',rule='00000000-0000-4000-8000-000000000705';
  await tx`insert into kpi_metrics(id,code,name,unit) values(${metric},'PARITY-UI','งานทดสอบ / ตรวจเอกสาร','คะแนน') on conflict do nothing`;
  const work={teamId:team,mainKpi:'งานทดสอบ',subKpi:'ตรวจเอกสาร',slaDays:2,mainWeight:'100'};
  await tx`insert into kpi_rule_versions(id,metric_id,version,event_type,status,effective_from,rule,created_by) values(${rule},${metric},1,'work.task.completed.v1','active',now(),${tx.json({work,conditions:[{path:'ruleVersionId',operator:'eq',value:rule}],scoring:{mode:'payload',path:'kpiWeight',multiplier:'1'}})},${user}) on conflict do nothing`;
  await tx`insert into tasks(id,owner_id,team_id,title,status,job_code,main_kpi,sub_kpi,kpi_weight,sla_rule_version_id,source_kind) values('00000000-0000-4000-8000-000000000706',${staff},${team},'งานทดสอบข้อความไทยยาวสำหรับการดำเนินงานและตรวจความคืบหน้าของผู้รับผิดชอบพร้อมสิทธิ์การจัดการที่แตกต่างกัน','queued','PARITY-UI-JOB','งานทดสอบ','ตรวจเอกสาร',100,${rule},'assigned') on conflict do nothing`;
 });console.log('Synthetic parity UI fixtures ready');}finally{await db.end();}
}else throw new Error('Use seed or server');
