import { config } from "dotenv";
import postgres from "postgres";
import { hash } from "@node-rs/argon2";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
config({ path: ".env.local", quiet: true });
const target = new URL(process.env.DUCT_RENTAL_TEST_DATABASE_URL || process.env.DATABASE_URL || "");
if (!["localhost","127.0.0.1","[::1]"].includes(target.hostname)) throw new Error("Loopback fixture database only");
if (process.env.DUCT_RENTAL_TEST_DATABASE_URL && target.pathname!=="/permission_next_duct_rental_test") throw new Error("Unexpected fixture database");
target.pathname="/permission_next_duct_rental_test";
const db=postgres(target.href,{max:1,prepare:false,onnotice:()=>{}}), loginPassword=randomBytes(32).toString("hex"), runtime=new URL(target);
const users=[
 ["00000000-0000-4000-8000-000000009001","admin@duct.example.test","ผู้ดูแลข้อมูลจำลอง","admin",false],
 ["00000000-0000-4000-8000-000000009002","signer@duct.example.test","ผู้ลงนามข้อมูลจำลอง","signer",false],
 ["00000000-0000-4000-8000-000000009003","viewer@duct.example.test","ผู้อ่านข้อมูลจำลอง","viewer",false],
 ["00000000-0000-4000-8000-000000009004","noaccess@duct.example.test","ผู้ใช้ไม่มีสิทธิ์ท่อ","noaccess",false],
 ["00000000-0000-4000-8000-000000009005","temporary@duct.example.test","ผู้ใช้รหัสชั่วคราว","admin",true],
];
try {
 if((await db`select current_database() as name`)[0].name!=="permission_next_duct_rental_test") throw new Error("Database guard failed");
 const exists=(await db`select 1 from pg_roles where rolname='duct_rental_browser_fixture'`).length;
 await db.unsafe(`${exists?'alter':'create'} role duct_rental_browser_fixture login inherit nosuperuser nocreatedb nocreaterole nobypassrls password '${loginPassword}'`);
 await db.unsafe("grant duct_rental_runtime to duct_rental_browser_fixture");
 const passwordHash=await hash("FixtureDuct123!",{memoryCost:19456,timeCost:2,parallelism:1,outputLen:32});
 await db.begin(async tx=>{
  for(const name of ["admin","signer","viewer","noaccess"]) await tx`insert into roles(code,name,is_system) values(${`duct-browser-${name}`},${`ข้อมูลจำลอง ${name}`},false) on conflict(code) do nothing`;
  await tx`insert into role_permissions(role_id,permission_code) select r.id,p.code from roles r cross join permissions p where r.code='duct-browser-admin' on conflict do nothing`;
  await tx`insert into role_permissions(role_id,permission_code) select r.id,p.code from roles r cross join permissions p where (r.code='duct-browser-signer' and p.code in ('duct_rental.module.view','duct_rental.signoff.sign','work.task.read')) or (r.code='duct-browser-viewer' and p.code in ('duct_rental.module.view','duct_rental.document.read','duct_rental.document.export','duct_rental.rate.read')) or (r.code='duct-browser-noaccess' and p.code='work.task.read') on conflict do nothing`;
  for(const [id,email,name,role,temporary] of users){
   await tx`insert into profiles(id,email,display_name,status) values(${id},${email},${name},'active') on conflict(id) do update set display_name=excluded.display_name,status='active'`;
   await tx`insert into local_credentials(user_id,password_hash,must_change_password) values(${id},${passwordHash},${temporary}) on conflict(user_id) do update set password_hash=excluded.password_hash,must_change_password=excluded.must_change_password,failed_attempts=0,locked_until=null`;
   await tx`delete from auth_sessions where user_id=${id}`;
   await tx`delete from auth_rate_limits where subject_type='email' and subject_key=${email}`;
   await tx`update user_role_assignments set valid_until=now() where user_id=${id} and valid_until is null`;
   const [assignment]=await tx`insert into user_role_assignments(user_id,role_id) select ${id},id from roles where code=${`duct-browser-${role}`} returning id`;
   await tx`insert into data_scope_grants(assignment_id,scope_type) values(${assignment.id},${role==='signer'?'OWN':'ALL'})`;
  }
  await tx`insert into teams(id,code,name) values('00000000-0000-4000-8000-000000009101','DUCT-BROWSER-TEAM','ทีมข้อมูลจำลองเช่าท่อ') on conflict(id) do nothing`;
  await tx`insert into user_teams(user_id,team_id) values(${users[0][0]},'00000000-0000-4000-8000-000000009101') on conflict do nothing`;
  await tx`update core_module_settings set enabled=false where module_id='duct-rental'`;
 });
 runtime.username="duct_rental_browser_fixture";runtime.password=loginPassword;
 await mkdir(".data/duct-rental-browser",{recursive:true});
 await writeFile(".data/duct-rental-browser/runtime.json",JSON.stringify({ databaseUrl:target.href,runtimeUrl:runtime.href,storageDir:`${process.cwd()}/.data/duct-rental-test-private` }));
 console.log("Synthetic Core users and constrained browser runtime ready in isolated duct database; secrets not printed");
}finally{await db.end();}
