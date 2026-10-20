import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { parse } from "dotenv";
import postgres from "postgres";
const env = parse(readFileSync(".env.local", "utf8")), target = new URL(env.DATABASE_URL);
if (!["localhost", "127.0.0.1", "[::1]"].includes(target.hostname)) throw new Error("Loopback fixture required");
target.pathname = "/permission_next_sync_session_test";
const db = postgres(target.href, { max: 1, prepare: false });
test.afterAll(async () => db.end());
async function login(page: Page, email = "sync-staff@example.test") {
  await page.goto("/login?next=%2Fwork"); await page.getByLabel("อีเมล", { exact: true }).fill(email);
  await page.getByLabel("รหัสผ่าน", { exact: true }).fill("FixturePassword123!");
  await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
  await expect(page.getByRole("heading", { name: "ภาพรวมงานของฉัน", exact: true })).toBeVisible();
}
for (const colorScheme of ["light", "dark"] as const) test(`new login displaces old context with friendly notice (${colorScheme})`, async ({ browser }) => {
  const a = await browser.newContext({ colorScheme }), b = await browser.newContext({ colorScheme });
  const old = await a.newPage(), current = await b.newPage(); await old.clock.install();
  await login(old); await login(current);
  const api = await a.request.get("http://localhost:3110/api/work/export"); expect(api.status()).toBe(401);
  expect(api.headers()["x-pn-session-reason"]).toBe("superseded");
  await old.clock.runFor(66001);
  await expect(old).toHaveURL(/\/login\?.*reason=superseded/);
  await expect(old.getByText("บัญชีนี้เพิ่งเข้าสู่ระบบจากอีกเครื่อง จึงออกจากระบบเครื่องนี้ให้ก่อน เข้าสู่ระบบอีกครั้งได้เลย", { exact: true })).toBeVisible();
  const notice = await old.locator(".auth-notice").textContent(); expect(notice).not.toMatch(/session|user.agent|\bIP\b|SESSION_SUPERSEDED/i);
  await current.reload(); await expect(current.getByRole("heading", { name: "ภาพรวมงานของฉัน", exact: true })).toBeVisible();
  await a.close(); await b.close();
});
test("three-job UI batch and completion update another tab with one audit per mutation", async ({ browser }) => {
  const context = await browser.newContext(); const a = await context.newPage(); await login(a);
  const b = await context.newPage(); await b.goto("/work/mine");
  await a.goto("/work/new"); const prefix = `SYNC-${Date.now()}`, jobs = ["A", "B", "C"].map(letter => `${prefix} Job ${letter}`);
  await a.getByRole("combobox", { name: "Main KPI", exact: true }).selectOption("Delivery"); await a.getByRole("combobox", { name: "Sub KPI", exact: true }).selectOption("Fixture KPI");
  await a.getByLabel("Job / รายละเอียดงาน (หนึ่งรายการต่อบรรทัด สูงสุด 20)").fill(jobs.join("\n"));
  let actionRequests = 0; a.on("request", request => { if (request.method() === "POST" && request.url().endsWith("/work/new")) actionRequests++; });
  const before = (await db`select count(*)::int as n from audit_logs where action='task.create' and actor_id='00000000-0000-4000-8000-000000001101'`)[0].n;
  await a.getByRole("button", { name: "เพิ่มงาน", exact: true }).click(); await expect(a.getByText("บันทึกเรียบร้อยแล้ว 3 งาน", { exact: true })).toBeVisible();
  await expect(b.getByRole("link", { name: jobs[0], exact: true })).toBeVisible(); expect(actionRequests).toBe(1);
  const [receipt] = await db`select payload from outbox_messages where topic='work.task.created.v1' and payload->>'actorId'='00000000-0000-4000-8000-000000001101' order by created_at desc limit 1`;
  const rows = await db`select id,job_code from tasks where job_code like ${prefix+'%'}`;
  expect(receipt.payload.taskIds.map((id: string) => rows.find(row => row.id === id).job_code)).toEqual(jobs);
  expect((await db`select count(*)::int as n from audit_logs where action='task.create' and actor_id='00000000-0000-4000-8000-000000001101'`)[0].n - before).toBe(1);
  const count = await b.getByRole("button", { name: "เสร็จสิ้น", exact: true }).count();
  const row = b.getByRole("row").filter({ has: b.getByRole("link", { name: jobs[0], exact: true }) });
  await row.getByRole("button", { name: "เสร็จสิ้น", exact: true }).click(); await b.getByRole("dialog").getByLabel("เหตุผล / ความคืบหน้า").fill("Fixture complete");
  await b.getByRole("dialog").getByRole("button", { name: "ยืนยัน", exact: true }).click();
  await expect(b.getByRole("button", { name: "เสร็จสิ้น", exact: true })).toHaveCount(count - 1);
  const [completed] = await db`select id,status,version,completed_at from tasks where job_code=${jobs[0]}`;
  expect(completed.status).toBe("completed"); expect(completed.version).toBe(2);
  expect(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(completed.completed_at)).toBe(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date()));
  expect((await db`select count(*)::int as n from task_transitions where task_id=${completed.id}`)[0].n).toBe(1);
  expect((await db`select count(*)::int as n from audit_logs where action='task.transition' and entity_id=${completed.id}`)[0].n).toBe(1);
  await expect(b.getByRole("button", { name: "อัปเดตข้อมูล", exact: true })).toBeEnabled();
  await context.close();
});
test("another account sees assignment on its refresh cycle and draft/modal pauses keep input", async ({ browser }) => {
  const staff = await browser.newContext(), manager = await browser.newContext(); const receiver = await staff.newPage(), sender = await manager.newPage();
  await receiver.clock.install(); await login(receiver, "sync-other@example.test"); await login(sender, "sync-admin@example.test");
  await sender.goto("/work/assign"); const assignment = sender.locator(".work-assignment-form");
  await assignment.getByRole("combobox", { name: "ทีม", exact: true }).selectOption("00000000-0000-4000-8000-000000001201");
  await assignment.getByRole("combobox", { name: "ผู้รับผิดชอบ", exact: true }).selectOption("00000000-0000-4000-8000-000000001102");
  await sender.getByRole("combobox", { name: "Main KPI", exact: true }).selectOption("Delivery"); await sender.getByRole("combobox", { name: "Sub KPI", exact: true }).selectOption("Fixture KPI");
  const job = `ASSIGN-${Date.now()}`; await sender.getByLabel("ชื่อชุดงาน").fill(job); await sender.getByLabel("Job / งานย่อย (สูงสุด 20 รายการ)").fill(job);
  await sender.getByRole("button", { name: "มอบหมายงาน", exact: true }).click(); await expect(sender.getByText("บันทึกเรียบร้อยแล้ว 1 งาน", { exact: true })).toBeVisible();
  await receiver.clock.runFor(66001); await expect(receiver.getByRole("link", { name: job, exact: true })).toBeVisible();
  let refreshes = 0; receiver.on("request", request => { if (request.method() === "GET" && request.headers()["rsc"] === "1") refreshes++; });
  await receiver.evaluate(() => { const form = document.createElement("form"); form.id = "synthetic-draft"; const input = document.createElement("input"); input.name = "draft"; form.append(input); document.querySelector("main")!.append(form); });
  await receiver.locator("#synthetic-draft input").fill("Keep this draft"); await receiver.clock.runFor(66001);
  expect(refreshes).toBe(0); await expect(receiver.locator("#synthetic-draft input")).toHaveValue("Keep this draft");
  await receiver.evaluate(() => { (document.querySelector("#synthetic-draft") as HTMLFormElement).reset(); const modal = document.createElement("dialog"); modal.id = "synthetic-modal"; document.body.append(modal); modal.showModal(); });
  const previous = refreshes; await receiver.clock.runFor(66001); expect(refreshes).toBe(previous);
  await receiver.evaluate(() => (document.querySelector("#synthetic-modal") as HTMLDialogElement).close());
  await expect.poll(() => refreshes).toBeGreaterThan(previous);
  await expect(receiver.getByRole("button", { name: "อัปเดตข้อมูล", exact: true })).toBeEnabled(); await staff.close(); await manager.close();
});

test("refresh keeps the personal list capped at 500 rows and retains scroll and an expanded note draft", async ({ browser }) => {
  const owner = "00000000-0000-4000-8000-000000001101", marker = `LIMIT-${Date.now()}`;
  await db`insert into tasks(owner_id,title,job_code,status) select ${owner},${marker}||'-'||n,${marker}||'-'||n,'in_progress' from generate_series(1,501) n`;
  const context = await browser.newContext(); const page = await context.newPage(); await page.clock.install(); await login(page); await page.goto("/work/mine");
  await expect(page.locator(".work-data-table tbody tr")).toHaveCount(500);
  await page.evaluate(() => window.scrollTo(0, 600)); const scroll = await page.evaluate(() => window.scrollY);
  const refreshed = page.waitForResponse(response => response.request().headers().rsc === "1" && new URL(response.url()).pathname === "/work/mine");
  await page.evaluate(() => { const channel = new BroadcastChannel("pn-work"); channel.postMessage("changed"); channel.close(); });
  await refreshed; await expect(page.getByRole("button", { name: "อัปเดตข้อมูล", exact: true })).toBeEnabled();
  expect(await page.evaluate(() => window.scrollY)).toBe(scroll);
  await page.getByRole("button", { name: "อัปเดตข้อมูล", exact: true }).click();
  await expect(page.getByRole("button", { name: "อัปเดตข้อมูล", exact: true })).toBeEnabled();
  await expect(page.locator(".work-data-table tbody tr")).toHaveCount(500);
  await page.locator(".work-task-link").first().click(); await page.getByRole("heading", { level: 2 }).filter({ hasText: marker }).waitFor();
  const note = page.getByRole("textbox", { name: "เพิ่มบันทึก", exact: true }); await note.fill("Keep actual note draft");
  await page.clock.runFor(66001); await expect(note).toHaveValue("Keep actual note draft");
  await context.close();
});

test("UI audit failure rolls back work and a repeated action does not touch the session twice", async ({ browser }) => {
  const owner = "00000000-0000-4000-8000-000000001101", taskId = crypto.randomUUID();
  await db`insert into tasks(id,owner_id,title,status) values(${taskId},${owner},'Synthetic audit failure','in_progress')`;
  await db.unsafe(`create or replace function public.sync_fixture_audit_failure() returns trigger language plpgsql as $$ begin if new.entity_id='${taskId}' and new.action='task.transition' then raise exception 'SYNTHETIC_AUDIT_FAILURE'; end if; return new; end $$`);
  await db.unsafe('create trigger sync_fixture_audit_failure before insert on public.audit_logs for each row execute function public.sync_fixture_audit_failure()');
  const context = await browser.newContext();
  try {
    const page = await context.newPage(); await login(page); await page.goto(`/work?record=${taskId}`);
    await page.getByRole("button", { name: "เสร็จสิ้น", exact: true }).click();
    await page.getByRole("dialog").getByLabel("เหตุผล / ความคืบหน้า").fill("Fixture audit failure");
    await db`update auth_sessions set last_seen_at=now()-interval '65 seconds' where user_id=${owner} and revoked_at is null`;
    await page.getByRole("dialog").getByRole("button", { name: "ยืนยัน", exact: true }).click();
    await expect(page.getByText("ไม่สามารถบันทึกงานได้", { exact: true })).toBeVisible();
    const [first] = await db`select last_seen_at from auth_sessions where user_id=${owner} and revoked_at is null`;
    await page.getByRole("dialog").getByRole("button", { name: "ยืนยัน", exact: true }).click();
    await expect(page.getByRole("dialog").getByRole("button", { name: "ยืนยัน", exact: true })).toBeEnabled();
    const [after] = await db`select last_seen_at from auth_sessions where user_id=${owner} and revoked_at is null`;
    expect(after.last_seen_at).toEqual(first.last_seen_at);
    const [task] = await db`select status,version,completed_at from tasks where id=${taskId}`;
    expect(task).toMatchObject({ status: "in_progress", version: 1, completed_at: null });
    expect((await db`select count(*)::int as n from task_transitions where task_id=${taskId}`)[0].n).toBe(0);
    expect((await db`select count(*)::int as n from audit_logs where entity_id=${taskId}`)[0].n).toBe(0);
  } finally {
    await context.close(); await db.unsafe('drop trigger if exists sync_fixture_audit_failure on public.audit_logs');
    await db.unsafe('drop function if exists public.sync_fixture_audit_failure()');
  }
});
