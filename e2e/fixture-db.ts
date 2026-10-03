import {config} from "dotenv";
import postgres from "postgres";
import {hash} from "@node-rs/argon2";
config({path:".env.local",quiet:true});
const original=new URL(process.env.UX_TEST_DATABASE_URL||process.env.DATABASE_URL||"");
if(!["localhost","127.0.0.1","[::1]"].includes(original.hostname))throw Error("Fixture writes require loopback PostgreSQL");
original.pathname="/permission_next_ux_test";
export const fixtureSql=postgres(original.href,{max:1,prepare:false,onnotice:()=>{}});
export const fixtureIds={staff:"00000000-0000-4000-8000-000000000101",temporary:"00000000-0000-4000-8000-000000000102",admin:"00000000-0000-4000-8000-000000000103"} as const;
export async function resetSecurityFixtures(){
  const passwordHash=await hash("FixturePassword123!",{memoryCost:19456,timeCost:2,parallelism:1,outputLen:32});
  for(const [name,id]of Object.entries(fixtureIds)){
    await fixtureSql`update profiles set status='active' where id=${id}`;
    await fixtureSql`update local_credentials set password_hash=${passwordHash},must_change_password=${name==='temporary'},failed_attempts=0,locked_until=null where user_id=${id}`;
    await fixtureSql`delete from auth_sessions where user_id=${id}`;
    await fixtureSql`delete from auth_rate_limits where subject_type='email' and subject_key=${`${name}@example.test`}`;
  }
  await fixtureSql`delete from auth_rate_limits where subject_type='email' and subject_key='unknown.security@example.test'`;
}
