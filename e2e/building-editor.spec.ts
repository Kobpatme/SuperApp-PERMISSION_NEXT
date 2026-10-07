import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { fixtureSql as sql } from "./fixture-db";
import { settlePresentation } from "./settle";

const prefix = "UX-EDITOR-";
const origin = "http://localhost:3100";
let created: string[] = [];
async function login(page: Page, email = "admin@example.test") {
  await page.goto("/login"); await page.locator("input[name=email]").fill(email); await page.locator("input[name=password]").fill("FixturePassword123!");
  await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click(); await page.waitForURL(email === "temporary@example.test" ? "**/change-password" : origin + "/");
}
async function cleanup() {
  for (const id of created) {
    // Preserve append-only audit/activity evidence in the isolated fixture database.
    await sql`update buildings set status='inactive',owner_team_id=null where id=${id} and code like ${prefix + '%'}`;
  }
  created = [];
}
test.afterEach(cleanup);
test.afterAll(async () => sql.end());

test("source-complete create and edit persist exact values, history and imported metadata", async ({ page }) => {
  await login(page); await page.goto("/buildings/new");
  const code = prefix + crypto.randomUUID().slice(0, 8);
  await page.locator("[name=code]").fill(code); await page.locator("[name=nameTh]").fill("อาคารทดสอบฟอร์มครบ " + code);
  await page.locator("[name=nameEn]").fill("Complete editor " + code);
  await page.locator("[name=status]").selectOption("Permission Confirmed"); await page.locator("[name=group]").selectOption("Priority 1");
  await page.locator("[name=type]").selectOption("L1"); await page.locator("[name=install_type]").selectOption("Shopping Mall");
  await page.locator("[name=survey_type]").selectOption("Need Mark");
  for (const [name, value] of Object.entries({ duration: "30", area: "bkk", province: "กรุงเทพมหานคร", location: "ชั้นทดสอบ 25", wm_point: "15, 25", max_horizontal: "75.50", address: "ที่อยู่ทดสอบ", contact: "ผู้ติดต่อสมมติ", phone: "020000000", mobile: "0800000000", email: "building.fixture@example.test", remark: "หมายเหตุทดสอบ", damage_deposit: "9999999999999999.99", contract_deposit: "5000.10", insurance_fee: "100.20", main_fee: "200.30", annual_fee: "300.40", coordination_fee: "400.50", shaft_fee_per_floor: "50.60", horizontal_fee: "20.70", meters_per_floor: "4.5", cable_rate_per_meter: "158.36", equipment_cost: "2200", odf_cost: "200", splice_cost: "400" })) await page.locator(`[name=${name}]`).fill(value);
  await page.locator("[name=enclosure]").selectOption("Yes");
  await page.getByRole("button", { name: "เพิ่มค่าใช้จ่าย", exact: true }).click();
  await page.locator("[name=otherFeeLabel0]").fill("ส่วนแบ่งรายได้ทดสอบ"); await page.getByLabel("วิธีคิดค่าใช้จ่าย").selectOption("revenue_share"); await page.locator("[name=otherFeeValue0]").fill("12.3456"); await page.getByLabel("รอบรายได้").selectOption("annual");
  await page.getByRole("button", { name: "บันทึกข้อมูล", exact: true }).click(); await page.waitForURL(/\/buildings\/[0-9a-f-]+\?saved=1$/);
  const id = new URL(page.url()).pathname.split("/")[2]; created.push(id);
  await expect(page.getByRole("status")).toContainText("บันทึกข้อมูลอาคารเรียบร้อยแล้ว");
  const [first] = await sql`select * from building_condition_versions where building_id=${id}`;
  expect(first.conditions).toMatchObject({ status: "Permission Confirmed", group: "Priority 1", type: "L1", install_type: "Shopping Mall", survey_type: "Need Mark", area: "BKK", duration: "30", wm_point: "15, 25", enclosure: "Yes", contact: "ผู้ติดต่อสมมติ", max_horizontal: "75.50", installation_profile: { meters_per_floor: "4.5000", cable_rate_per_meter: "158.36" } });
  const fees = await sql`select * from building_condition_fees where condition_version_id=${first.id}`;
  expect(fees).toHaveLength(9); expect(fees.find(fee => fee.source_key === "damage_deposit").amount).toBe("9999999999999999.99"); expect(fees.find(fee => fee.calculation_type === "revenue_share").rate).toBe("12.3456");
  // Synthetic imported fields and an external contract fee must survive an unrelated edit.
  await sql`update building_condition_versions set conditions=conditions || ${sql.json({ permission_calculation: { custom: "preserve" }, _migration: { source: "fixture" } })}::jsonb where id=${first.id}`;
  await sql`insert into building_condition_fees(condition_version_id,source_key,label,category,cost_type,calculation_type,amount,payable,note) values(${first.id},'external_contract','สัญญาสมมติ','contract','CAPEX','fixed',123.45,false,'preserve')`;
  await page.getByRole("link", { name: "แก้ไขข้อมูลอาคาร", exact: true }).click();
  await expect(page.locator("[name=contact]")).toHaveValue("ผู้ติดต่อสมมติ"); await expect(page.locator("[name=damage_deposit]")).toHaveValue("9999999999999999.99"); await expect(page.locator("[name=meters_per_floor]")).toHaveValue("4.5000"); await expect(page.locator("[name=otherFeeValue0]")).toHaveValue("12.3456");
  await page.locator("[name=contact]").fill("ผู้ติดต่อใหม่สมมติ"); await page.locator("[name=damage_deposit]").fill("12000.15"); await page.locator("[name=reason]").fill("ปรับผู้ติดต่อและค่าประกันทดสอบ");
  await page.getByRole("button", { name: "บันทึกข้อมูล", exact: true }).click(); await page.waitForURL(/\?saved=1$/);
  const versions = await sql`select * from building_condition_versions where building_id=${id} order by version`;
  expect(versions).toHaveLength(2); expect(versions[0].effective_until).not.toBeNull(); expect(versions[0].conditions.contact).toBe("ผู้ติดต่อสมมติ");
  expect(versions[1].conditions).toMatchObject({ contact: "ผู้ติดต่อใหม่สมมติ", permission_calculation: { custom: "preserve" }, _migration: { source: "fixture" } });
  const [external] = await sql`select * from building_condition_fees where condition_version_id=${versions[1].id} and source_key='external_contract'`;
  expect(external).toMatchObject({ amount: "123.45", payable: false, note: "preserve" });
  expect((await sql`select action from audit_logs where entity_id=${id} order by created_at`).map(row => row.action)).toEqual(["building.create", "building.update"]);
  expect(await sql`select id from activity_events where building_id=${id}`).toHaveLength(2); expect(await sql`select id from outbox_messages where aggregate_id=${id}`).toHaveLength(2);
  await page.goto(`/buildings/${id}/edit`); await expect(page.locator("[name=contact]")).toHaveValue("ผู้ติดต่อใหม่สมมติ"); await expect(page.locator("[name=damage_deposit]")).toHaveValue("12000.15");
  await page.goto(`/buildings?q=${code}`);
  await page.getByRole("textbox", { name: "ค้นหาอาคาร", exact: true }).focus();
  await expect(page.getByRole("option").filter({ hasText: code })).toBeVisible();
});

test("duplicate names and stale concurrent edits never overwrite another save", async ({ page }) => {
  await login(page); const code = prefix + crypto.randomUUID().slice(0, 8), name = "อาคารแข่งขัน " + code;
  const response = await page.request.post("/api/buildings", { headers: { origin }, data: { code, nameTh: name } }); expect(response.status()).toBe(201);
  const { id } = await response.json(); created.push(id);
  const duplicate = await page.request.post("/api/buildings", { headers: { origin }, data: { code: prefix + crypto.randomUUID().slice(0, 8), nameTh: name.replaceAll(" ", "") } }); expect(duplicate.status()).toBe(409); expect(await duplicate.json()).toEqual({ error: "building_duplicate" });
  const results = await Promise.all(["หนึ่ง", "สอง"].map(suffix => page.request.patch(`/api/buildings/${id}`, { headers: { origin }, data: { code, nameTh: name + suffix, version: 1, reason: "ทดสอบแข่งกัน" } })));
  expect(results.map(result => result.status()).sort()).toEqual([200, 409]);
  expect(await sql`select version from building_condition_versions where building_id=${id}`).toHaveLength(2);
  const [record] = await sql`select version from buildings where id=${id}`; expect(record.version).toBe(2);
  await page.goto(`/buildings/${id}/edit`); await page.locator("[name=contact]").fill("ข้อมูลยังไม่บันทึก");
  await sql`update buildings set version=version+1 where id=${id}`;
  await page.getByRole("button", { name: "บันทึกข้อมูล", exact: true }).click(); await expect(page.locator("#building-editor-error")).toContainText("มีการแก้ไขอาคารนี้แล้ว"); await expect(page.locator("[name=contact]")).toHaveValue("ข้อมูลยังไม่บันทึก");
});

test("read-only and temporary accounts cannot edit records through UI or API", async ({ page }) => {
  await login(page, "staff@example.test"); const id = "00000000-0000-4000-8000-000000000201";
  await page.goto(`/buildings/${id}`); await expect(page.getByRole("link", { name: "แก้ไขข้อมูลอาคาร", exact: true })).toHaveCount(0);
  expect((await page.request.patch(`/api/buildings/${id}`, { headers: { origin }, data: { nameTh: "ห้ามบันทึก", version: 1, reason: "test" } })).status()).toBe(403);
  expect((await page.request.post("/api/buildings", { headers: { origin }, data: { nameTh: "ห้ามเพิ่ม" } })).status()).toBe(403);
  await page.context().clearCookies(); await login(page, "temporary@example.test");
  expect((await page.request.patch(`/api/buildings/${id}`, { headers: { origin }, data: { nameTh: "ห้ามบันทึก", version: 1, reason: "test" } })).status()).toBe(403);
});

test("an audit failure rolls back the record, condition version, fees and events together", async ({ page }) => {
  await login(page); const code = prefix + crypto.randomUUID().slice(0, 8);
  const response = await page.request.post("/api/buildings", { headers: { origin }, data: { code, nameTh: "อาคารทดสอบ rollback " + code } }); expect(response.status()).toBe(201);
  const { id } = await response.json(); expect(id).toMatch(/^[0-9a-f-]{36}$/); created.push(id);
  try {
    // This trigger exists only in the explicitly guarded, isolated UX fixture database.
    await sql.unsafe(`create function ux_editor_test_audit_failure() returns trigger language plpgsql as $$ begin if new.entity_id='${id}' and new.action='building.update' then raise exception 'synthetic audit failure'; end if; return new; end $$`);
    await sql`create trigger ux_editor_test_audit_failure before insert on audit_logs for each row execute function ux_editor_test_audit_failure()`;
    const failed = await page.request.patch(`/api/buildings/${id}`, { headers: { origin }, data: { code, nameTh: "ห้ามค้างหลัง rollback", version: 1, reason: "ทดสอบ rollback", fees: { main_fee: "100.10" } } });
    expect(failed.status()).toBe(500); expect(await failed.json()).toEqual({ error: "building_save_failed" });
    const [record] = await sql`select version,name_th from buildings where id=${id}`; expect(record.version).toBe(1); expect(record.name_th).toContain(code);
    const conditions = await sql`select * from building_condition_versions where building_id=${id}`; expect(conditions).toHaveLength(1); expect(conditions[0].effective_until).toBeNull();
    expect(await sql`select id from building_condition_fees where condition_version_id=${conditions[0].id}`).toHaveLength(0);
    expect(await sql`select id from audit_logs where entity_id=${id}`).toHaveLength(1); expect(await sql`select id from activity_events where building_id=${id}`).toHaveLength(1); expect(await sql`select id from outbox_messages where aggregate_id=${id}`).toHaveLength(1);
  } finally { await sql`drop trigger if exists ux_editor_test_audit_failure on audit_logs`; await sql`drop function if exists ux_editor_test_audit_failure()`; }
});

test("team scopes permit own-team operations and reject cross-team writes", async ({ page }) => {
  const own = crypto.randomUUID(), other = crypto.randomUUID();
  const staff = "00000000-0000-4000-8000-000000000101";
  const [role] = await sql`select id from roles where code='ux_staff'`;
  try {
    await sql`insert into teams(id,code,name) values(${own},${prefix + own},'ทีมทดสอบหนึ่ง'),(${other},${prefix + other},'ทีมทดสอบสอง')`;
    await sql`insert into user_teams(user_id,team_id) values(${staff},${own})`;
    await sql`insert into role_permissions(role_id,permission_code) values(${role.id},'building.record.create'),(${role.id},'building.record.update')`;
    await sql`update data_scope_grants set scope_type='TEAM' where assignment_id in (select id from user_role_assignments where user_id=${staff} and role_id=${role.id})`;
    await login(page, "staff@example.test");
    const code = prefix + crypto.randomUUID().slice(0, 8);
    const response = await page.request.post("/api/buildings", { headers: { origin }, data: { code, nameTh: "อาคารทีมทดสอบ " + code, ownerTeamId: own } }); expect(response.status()).toBe(201);
    const { id } = await response.json(); created.push(id);
    expect((await page.request.post("/api/buildings", { headers: { origin }, data: { nameTh: "ห้ามข้ามทีม", ownerTeamId: other } })).status()).toBe(403);
    expect((await page.request.patch(`/api/buildings/${id}`, { headers: { origin }, data: { nameTh: "ห้ามย้ายทีม", ownerTeamId: other, version: 1, reason: "test" } })).status()).toBe(403);
    expect((await page.request.patch(`/api/buildings/${id}`, { headers: { origin }, data: { nameTh: "แก้ในทีม " + code, ownerTeamId: own, version: 1, reason: "test" } })).status()).toBe(200);
  } finally {
    await sql`update data_scope_grants set scope_type='ALL' where assignment_id in (select id from user_role_assignments where user_id=${staff} and role_id=${role.id})`;
    await sql`delete from role_permissions where role_id=${role.id} and permission_code in ('building.record.create','building.record.update')`;
    await cleanup(); await sql`delete from user_teams where user_id=${staff} and team_id=${own}`;
    // Team references in append-only events must remain available for history.
  }
});

for (const theme of ["light", "dark"] as const) for (const width of [390, 1440]) test(`editor accessibility ${theme} ${width}`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 }); await page.addInitScript(value => localStorage.setItem("permission-next-workspace-theme", value), theme);
  await login(page); await page.goto("/buildings/new"); await settlePresentation(page);
  await expect(page.locator("[name=remark]")).toBeVisible(); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const result = await new AxeBuilder({ page }).analyze(); expect(result.violations.filter(item => ["serious", "critical"].includes(item.impact ?? ""))).toEqual([]);
  await page.screenshot({ path: `docs/quality/ux-login-evidence/building-editor-${theme}-${width}.png`, fullPage: true });
});
