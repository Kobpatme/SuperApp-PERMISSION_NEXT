import {beforeEach,afterEach,describe,expect,it,vi} from "vitest";
import {PgDialect} from "drizzle-orm/pg-core";
const mocks=vi.hoisted(()=>({token:"x".repeat(43) as string|undefined,row:undefined as Record<string,unknown>|undefined,selectWhere:vi.fn(),updateWhere:vi.fn(),set:vi.fn(),fail:false,log:vi.fn(),cache:vi.fn((fn:unknown)=>fn)}));
vi.mock("server-only",()=>({}));
vi.mock("react",()=>({cache:mocks.cache}));
vi.mock("next/headers",()=>({cookies:async()=>({get:()=>mocks.token?{value:mocks.token}:undefined})}));
vi.mock("@/lib/logger",()=>({logEvent:mocks.log}));
vi.mock("@/db",()=>({getDb:()=>({
  select:()=>{if(mocks.fail)throw new Error("private_connection_detail");const q={from:()=>q,innerJoin:()=>q,where:(s:unknown)=>{mocks.selectWhere(s);return q;},limit:async()=>mocks.row?[mocks.row]:[]};return q;},
  update:()=>({set:(s:unknown)=>{mocks.set(s);return {where:async(s:unknown)=>{mocks.updateWhere(s);}};}}),
})}));
import {getCurrentUser} from "./auth";
const now=new Date("2026-10-03T12:00:00Z");
beforeEach(()=>{vi.clearAllMocks();vi.useFakeTimers();vi.setSystemTime(now);vi.stubEnv("DATABASE_URL","postgres://fixture/fixture");mocks.fail=false;mocks.token="x".repeat(43);mocks.row={sessionId:"fixture-session",id:"fixture-id",email:"fixture@example.test",displayName:"ผู้ใช้ทดสอบ",mustChangePassword:true,lastSeenAt:new Date(now.getTime()-10000)};});
afterEach(()=>{vi.useRealTimers();vi.unstubAllEnvs();});
describe("session validation and activity writes",()=>{
  it("does not write within the 60-second interval and preserves forced-password state",async()=>{expect(await getCurrentUser()).toMatchObject({id:"fixture-id",mustChangePassword:true});expect(mocks.set).not.toHaveBeenCalled();});
  it("writes an older valid session conditionally without changing absolute expiry",async()=>{mocks.row!.lastSeenAt=new Date(now.getTime()-65000);await getCurrentUser();expect(mocks.set).toHaveBeenCalledExactlyOnceWith({lastSeenAt:now});const q=new PgDialect().sqlToQuery(mocks.updateWhere.mock.calls[0][0]);expect(q.sql).toContain('"last_seen_at" <');expect(q.sql).toContain('"last_seen_at" >');expect(q.sql).toContain('"expires_at" >');expect(q.sql).toContain('"id" =');});
  it("keeps strict idle, absolute expiry and active profile predicates on every lookup",async()=>{await getCurrentUser();const q=new PgDialect().sqlToQuery(mocks.selectWhere.mock.calls[0][0]);expect(q.sql).toContain('"expires_at" >');expect(q.sql).toContain('"last_seen_at" >');expect(q.sql).toContain('"status" =');expect(q.params).toContain("active");expect(q.params).toContain(new Date(now.getTime()-30*60000).toISOString());});
  it("rejects an expired or inactive lookup without refreshing its timestamp",async()=>{mocks.row=undefined;expect(await getCurrentUser()).toBeNull();expect(mocks.set).not.toHaveBeenCalled();});
  it.each([undefined,"short"])("rejects missing/malformed cookies before SQL (%s)",async token=>{mocks.token=token;expect(await getCurrentUser()).toBeNull();expect(mocks.selectWhere).not.toHaveBeenCalled();expect(mocks.set).not.toHaveBeenCalled();});
  it("fails closed and logs only a correlation and error type",async()=>{mocks.fail=true;expect(await getCurrentUser()).toBeNull();expect(JSON.stringify(mocks.log.mock.calls)).not.toContain("private_connection_detail");expect(mocks.log).toHaveBeenCalledOnce();});
});
