import {expect,test,type Page} from "@playwright/test";
import {createHash} from "node:crypto";
import {verify} from "@node-rs/argon2";
import {fixtureSql as sql,fixtureIds,resetSecurityFixtures} from "./fixture-db";
const digest=(token:string)=>createHash("sha256").update(token).digest("hex");
const generic="อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือบัญชียังไม่พร้อมใช้งาน";
async function submit(page:Page,email="staff@example.test",password="FixturePassword123!"){
  await page.goto("/login");await page.locator("input[name=email]").fill(email);await page.locator("input[name=password]").fill(password);
  const response=page.waitForResponse(r=>new URL(r.url()).pathname==="/login"&&r.request().method()==="POST");
  await page.getByRole("button",{name:"เข้าสู่ระบบ",exact:true}).click();await response;
}
async function session(page:Page){const cookie=(await page.context().cookies()).find(c=>c.name==="pn_session");expect(cookie).toBeDefined();return {cookie:cookie!,tokenHash:digest(cookie!.value)};}
test.beforeEach(async()=>resetSecurityFixtures());
test.afterEach(async()=>resetSecurityFixtures());
test.afterAll(async()=>sql.end());
test("first sign-in forces password change, revokes sessions, audits, enters modules and logs out",async({page})=>{
  await submit(page,"temporary@example.test","WrongFixture123!");await expect(page.locator(".auth-error[role=alert]")).toContainText(generic);await expect(page.locator("input[name=email]")).toHaveValue("temporary@example.test");
  await submit(page,"temporary@example.test");await page.waitForURL("**/change-password");
  const initial=await session(page);expect(initial.cookie.httpOnly).toBe(true);expect(initial.cookie.secure).toBe(true);expect(initial.cookie.sameSite).toBe("Lax");
  for(const route of ["/work","/buildings","/guarantees","/admin"]){await page.goto(route);await expect(page).toHaveURL(/\/change-password$/);}
  for(const route of ["/api/dashboard","/api/workspace/search?q=test"]){const response=await page.request.get(route);expect(response.status()).toBe(403);expect((await response.json()).code).toBe("PASSWORD_CHANGE_REQUIRED");}
  expect((await page.request.post("/api/buildings",{data:{}})).status()).toBe(403);
  const otherHash=digest("additional-synthetic-session");await sql`insert into auth_sessions(user_id,token_hash,expires_at) values(${fixtureIds.temporary},${otherHash},now()+interval '1 hour')`;
  await page.locator("input[name=password]").fill("NewFixturePassword456!");await page.locator("input[name=confirm]").fill("NewFixturePassword456!");await page.getByRole("button",{name:"บันทึกและเข้าใช้งาน",exact:true}).click();await page.waitForURL("http://localhost:3100/");
  const fresh=await session(page);expect(fresh.tokenHash).not.toBe(initial.tokenHash);
  const sessions=await sql`select token_hash from auth_sessions where user_id=${fixtureIds.temporary}`;expect(sessions.map(s=>s.token_hash)).toEqual([fresh.tokenHash]);
  const [credential]=await sql`select must_change_password,password_hash from local_credentials where user_id=${fixtureIds.temporary}`;expect(credential.must_change_password).toBe(false);expect(await verify(credential.password_hash,"NewFixturePassword456!")).toBe(true);
  const audit=await sql`select metadata from audit_logs where action='password.change' and actor_id=${fixtureIds.temporary} order by created_at desc limit 1`;expect(audit[0].metadata.sessionsRevoked).toBe(true);expect(JSON.stringify(audit)).not.toContain("NewFixturePassword456!");
  await page.goto("/work");await expect(page.locator("h1")).toBeVisible();
  await page.locator(".account-trigger").click();await page.getByRole("button",{name:"ออกจากระบบ",exact:true}).click();await page.waitForURL("**/login?reason=signed-out");await expect(page.getByRole("status")).toContainText("ออกจากระบบเรียบร้อยแล้ว");expect(await sql`select id from auth_sessions where token_hash=${fresh.tokenHash}`).toHaveLength(0);
});
test("control-character return path stays on this site",async({page})=>{
  await page.goto(`/login?next=${encodeURIComponent("/\n/evil.example")}`);await page.locator("input[name=email]").fill("staff@example.test");await page.locator("input[name=password]").fill("FixturePassword123!");await page.getByRole("button",{name:"เข้าสู่ระบบ",exact:true}).click();await page.waitForURL("http://localhost:3100/");
});
test("idle and absolute expiry reject without touching the timestamp and preserve a safe return path",async({page})=>{
  for(const expiry of ["idle","absolute"]){
    await submit(page);await page.waitForURL("http://localhost:3100/");const {tokenHash}=await session(page);
    if(expiry==="idle")await sql`update auth_sessions set last_seen_at=now()-interval '31 minutes' where token_hash=${tokenHash}`;
    else await sql`update auth_sessions set expires_at=now()-interval '1 second' where token_hash=${tokenHash}`;
    const [before]=await sql`select last_seen_at from auth_sessions where token_hash=${tokenHash}`;
    await page.setExtraHTTPHeaders({"x-pn-request-path":"//evil.example"});await page.goto("/work?view=mine");
    const url=new URL(page.url());expect(url.pathname).toBe("/login");expect(url.searchParams.get("next")).toBe("/work?view=mine");expect(url.searchParams.get("reason")).toBe("expired");await expect(page.getByRole("status")).toContainText("กรุณาเข้าสู่ระบบอีกครั้ง");
    const [after]=await sql`select last_seen_at from auth_sessions where token_hash=${tokenHash}`;expect(after.last_seen_at.getTime()).toBe(before.last_seen_at.getTime());
    expect((await page.request.get("/api/dashboard")).status()).toBe(401);
    await page.locator("input[name=email]").fill("staff@example.test");await page.locator("input[name=password]").fill("FixturePassword123!");await page.getByRole("button",{name:"เข้าสู่ระบบ",exact:true}).click();await page.waitForURL("**/work?view=mine");
    await page.context().clearCookies();
  }
});
test("activity touches only an older valid session and never changes absolute expiry",async({page})=>{
  await submit(page);await page.waitForURL("http://localhost:3100/");const {tokenHash}=await session(page);
  await sql`update auth_sessions set last_seen_at=now()-interval '65 seconds' where token_hash=${tokenHash}`;
  const [before]=await sql`select last_seen_at,expires_at from auth_sessions where token_hash=${tokenHash}`;
  await page.goto("/work");const [touched]=await sql`select last_seen_at,expires_at from auth_sessions where token_hash=${tokenHash}`;expect(touched.last_seen_at.getTime()).toBeGreaterThan(before.last_seen_at.getTime());expect(touched.expires_at.getTime()).toBe(before.expires_at.getTime());
  for(const route of ["/","/buildings","/guarantees"]){await page.goto(route);const [recent]=await sql`select last_seen_at from auth_sessions where token_hash=${tokenHash}`;expect(recent.last_seen_at.getTime()).toBe(touched.last_seen_at.getTime());}
});
test("five incorrect attempts retain lockout, rate limit and audit without account enumeration",async({page})=>{
  const [baseline]=await sql`select count(*)::int as count from audit_logs where action in ('auth.login.failure','auth.account.locked')`;
  const [lockedBaseline]=await sql`select count(*)::int as count from audit_logs where action='auth.account.locked'`;
  for(const email of ["staff@example.test","unknown.security@example.test"]){for(let i=0;i<5;i++){await submit(page,email,"WrongFixture123!");await expect(page.locator(".auth-error[role=alert]")).toContainText(generic);}}
  const [credential]=await sql`select failed_attempts,locked_until from local_credentials where user_id=${fixtureIds.staff}`;expect(credential.failed_attempts).toBe(5);expect(credential.locked_until.getTime()).toBeGreaterThan(Date.now());
  const rates=await sql`select attempts,blocked_until from auth_rate_limits where subject_type='email' and subject_key in ('staff@example.test','unknown.security@example.test')`;expect(rates).toHaveLength(2);for(const r of rates){expect(r.attempts).toBe(5);expect(r.blocked_until.getTime()).toBeGreaterThan(Date.now());}
  const errors:string[]=[];for(const email of ["staff@example.test","unknown.security@example.test"]){await submit(page,email);await expect(page.locator(".auth-error[role=alert]")).toContainText("กรุณารออีก");errors.push(await page.locator(".auth-error[role=alert]").innerText());}expect(errors[0]).toBe(errors[1]);
  const [total]=await sql`select count(*)::int as count from audit_logs where action in ('auth.login.failure','auth.account.locked')`;expect(total.count-baseline.count).toBe(12);
  const [lockedTotal]=await sql`select count(*)::int as count from audit_logs where action='auth.account.locked'`;expect(lockedTotal.count-lockedBaseline.count).toBe(1);
  const audit=await sql`select metadata from audit_logs where action in ('auth.login.failure','auth.account.locked') order by created_at desc limit 12`;expect(JSON.stringify(audit)).not.toContain("WrongFixture123!");expect((await page.context().cookies()).some(c=>c.name==="pn_session")).toBe(false);
});
test("inactive and locked accounts return the same generic feedback; unknown next stays internal",async({page})=>{
  await sql`update profiles set status='inactive' where id=${fixtureIds.staff}`;
  await submit(page);await expect(page.locator(".auth-error[role=alert]")).toContainText(generic);
  await sql`update profiles set status='active' where id=${fixtureIds.staff}`;await sql`update local_credentials set locked_until=now()+interval '15 minutes' where user_id=${fixtureIds.staff}`;
  await submit(page);await expect(page.locator(".auth-error[role=alert]")).toContainText(generic);
  await sql`update local_credentials set locked_until=now()-interval '1 second',failed_attempts=5 where user_id=${fixtureIds.staff}`;
  await page.goto("/login?next=%2F%2Fevil.example");await page.locator("input[name=email]").fill("staff@example.test");await page.locator("input[name=password]").fill("FixturePassword123!");await page.getByRole("button",{name:"เข้าสู่ระบบ",exact:true}).click();await page.waitForURL("http://localhost:3100/");
  const [credential]=await sql`select failed_attempts,locked_until from local_credentials where user_id=${fixtureIds.staff}`;expect(credential.failed_attempts).toBe(0);expect(credential.locked_until).toBeNull();
});
