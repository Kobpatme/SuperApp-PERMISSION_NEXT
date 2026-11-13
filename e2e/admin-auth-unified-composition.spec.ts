import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { build } from "esbuild";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

test.use({ launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {} });
const evidence = resolve("docs/quality/admin-remainder");
const css = ["src/styles/tokens.css", "src/app/globals.css", "src/styles/shell.css", "src/styles/components.css", "src/styles/ui.css", "src/styles/notifications.css", "src/styles/work.css", "src/styles/auth.css", "src/styles/motion.css"].map(p => readFileSync(resolve(p), "utf8")).join("\n");
const fonts = [["manrope", "manrope"], ["nunito", "nunito"], ["thai", "noto-sans-thai"], ["code", "source-code-pro"]].map(([name, file]) => `@font-face{font-family:fixture-${name};src:url(data:font/woff2;base64,${readFileSync(resolve(`src/app/fonts/${file}.woff2`)).toString("base64")}) format('woff2');font-weight:100 900}:root{--font-${name}:fixture-${name}}`).join("");
const models = {
  profiles: [{ id: "TEST-user", displayName: "TEST ผู้ดูแลบัญชี", email: "test@example.invalid", employeeCode: "TEST-001", status: "active", positionId: "TEST-position", positionName: "TEST ตำแหน่ง", teamId: "TEST-team" }],
  positions: [{ id: "TEST-position", code: "TEST_position", name: "TEST ตำแหน่ง", scopeType: "ALL", roleId: "TEST-role", roleName: "TEST บทบาท" }],
  roles: [{ id: "TEST-role", code: "TEST_role", name: "TEST บทบาท", description: "TEST สิทธิ์จำลอง", isSystem: false }, { id: "TEST-system", code: "TEST_system", name: "TEST บทบาทมาตรฐาน", description: "", isSystem: true }],
  teams: [{ id: "TEST-team", code: "TEST_team", name: "TEST ทีมปฏิบัติการ" }, { id: "TEST-empty", code: "TEST_empty", name: "TEST ทีมว่าง" }],
  rolePermissions: [{ roleId: "TEST-role", code: "core.user.manage", description: "TEST" }],
  userRoleAssignments: [{ userId: "TEST-user", scopeType: "ALL", selectedTeamId: null }],
  authSessions: [{ userId: "TEST-user", count: 2 }],
  auditLogs: [{ id: "TEST-audit", actorId: "TEST-user", moduleId: "core", action: "TEST.user.update", entityType: "TEST-profile", entityId: "TEST-user", createdAt: "2026-10-30T03:00:00Z" }],
};
const work = {
  granted: { kpi: true, calendar: true, systems: true, announcement: true },
  calendar: [{ id: "TEST-holiday", holidayDate: "2026-12-31", name: "TEST วันหยุด", source: "company", isActive: true, version: 3 }],
  catalog: [{ id: "TEST-rule", metricId: "TEST-metric", teamId: "TEST-team", mainKpi: "TEST Main", subKpi: "TEST Sub", slaDays: 5, mainWeight: "100", status: "active", version: 3 }],
  personals: [{ userId: "TEST-user", teamId: "TEST-team", version: 2, assignments: [{ metricId: "TEST-metric", enabled: true, weight: "100" }] }],
  links: [{ id: "TEST-link", name: "TEST ระบบ", description: "TEST คำอธิบาย", url: "/work", icon: "link", status: "Active", visibleToAll: true, version: 4, roleIds: [], teamIds: [] }],
  announcements: [{ id: "TEST-announcement", message: "TEST ประกาศสำหรับทดสอบ", isActive: true, version: 2 }],
  teams: models.teams, roles: models.roles, people: [{ id: "TEST-user", name: "TEST ผู้ดูแลบัญชี", teamId: "TEST-team" }], deleted: [{ id: "TEST-task", title: "TEST งานที่ถูกซ่อน", version: 7 }],
};
let script = "", moduleCss = "";
test.beforeAll(async () => {
  mkdirSync(evidence, { recursive: true });
  const output = await build({ bundle: true, write: false, outdir: "TEST-output", platform: "browser", jsx: "automatic", define: { "process.env.NODE_ENV": '"development"', "process.env.SUPPORT_CONTACT_TEXT": '"TEST ผู้ดูแล"' }, stdin: { loader: "tsx", resolveDir: process.cwd(), contents: `
import React from'react';import{createRoot}from'react-dom/client';import{AppShell}from'./src/components/app-shell';import Admin from'./src/app/(platform)/admin/page';import Login from'./src/app/login/page';import Change from'./src/app/change-password/page';
window.TESTmodels=${JSON.stringify(models)};window.TESTwork=${JSON.stringify(work)};window.TESTstate=new URLSearchParams(location.search).get('state')||'ready';
const permissions=['core.user.manage','core.profile.read','core.position.manage','core.team.manage','core.role.manage','core.audit.read','core.module.manage','kpi.rule.manage','work.task.delete','work.task.manage'];window.TESTaccess={userId:'TEST-user',passwordChangeRequired:false,permissions,subject:{userId:'TEST-user',teamIds:['TEST-team'],grants:permissions.map(permission=>({permission,scope:'ALL'}))}};
async function render(){const auth=location.pathname!=='/admin';const content=await(location.pathname==='/login'?Login({searchParams:Promise.resolve(Object.fromEntries(new URLSearchParams(location.search)))}):auth?Change():Admin({searchParams:Promise.resolve(Object.fromEntries(new URLSearchParams(location.search)))}));createRoot(document.getElementById('root')).render(<React.StrictMode>{auth?<><div role="note">TEST ข้อมูลจำลอง · ไม่เข้าสู่ระบบจริง</div>{content}</>:<AppShell displayName="TEST ผู้ดูแล" allowedModuleIds={['work']} canAccessAdmin><div role="note">TEST ข้อมูลจำลอง · ไม่เชื่อมต่อฐานข้อมูล · server actions จำลอง</div>{content}</AppShell>}</React.StrictMode>)}render().catch(error=>document.getElementById('root').textContent=error.message);
` }, plugins: [{ name: "TEST-admin-auth-boundaries", setup(builder) {
    builder.onResolve({ filter: /^next\/(link|navigation|image|headers)$/ }, args => ({ path: args.path, namespace: "TEST" }));
    builder.onResolve({ filter: /^@\/app\/.*actions$/ }, args => ({ path: args.path, namespace: "TEST-actions" }));
    builder.onResolve({ filter: /^@\/db(\/schema)?$/ }, args => ({ path: args.path, namespace: "TEST" }));
    builder.onResolve({ filter: /^@\/lib\/(access|auth|env|work-admin-read|workspace-server|module-lifecycle)$/ }, args => ({ path: args.path, namespace: "TEST" }));
    builder.onLoad({ filter: /.*/, namespace: "TEST-actions" }, () => ({ loader: "tsx", resolveDir: process.cwd(), contents: `async function run(kind,p,data){return (await fetch('/TEST-action/'+kind,{method:'POST',body:data})).json()}${["createPositionAction", "createRoleAction", "createTeamAction", "createUserAction", "deleteTeamAction", "deleteRoleAction", "resetPasswordAction", "revokeUserSessionsAction", "updatePositionAction", "updateRolePermissionsAction", "updateTeamAction", "updateUserAccessAction", "saveWorkAdminAction", "previewWorkAdminAction", "confirmWorkAdminAction", "restoreWorkTaskAction", "setModuleEnabledAction", "loginAction", "changePasswordAction"].map(name => `export const ${name}=(p,d)=>run('${name}',p,d);`).join("")}export async function logoutAction(){throw Error('No live auth in TEST fixture')}` }));
    builder.onLoad({ filter: /.*/, namespace: "TEST" }, args => ({ loader: "tsx", resolveDir: process.cwd(), contents:
      args.path === "next/link" ? `import React from'react';export function useLinkStatus(){return {pending:false};}export default function Link({prefetch,...p}){return <a {...p}/>} ` :
      args.path === "next/image" ? `import React from'react';export default function Image(p){return <img {...p}/>} ` :
      args.path === "next/headers" ? `export async function headers(){return new Headers()}` :
      args.path === "next/navigation" ? `import{useSyncExternalStore}from'react';function sub(fn){addEventListener('popstate',fn);return()=>removeEventListener('popstate',fn)}export function usePathname(){return useSyncExternalStore(sub,()=>location.pathname)}export function useSearchParams(){return new URLSearchParams(useSyncExternalStore(sub,()=>location.search))}export function useRouter(){return{refresh(){},push(url){history.pushState({},'',url);dispatchEvent(new PopStateEvent('popstate'))}}}export function redirect(path){throw Error('TEST redirect '+path)}` :
      args.path === "@/db/schema" ? `import{pgTable,text}from'drizzle-orm/pg-core';${["auditLogs", "authSessions", "dataScopeGrants", "permissions", "positions", "profiles", "rolePermissions", "roles", "teams", "userRoleAssignments", "userTeams"].map(name => `export const ${name}=pgTable('${name}',{id:text('id'),name:text('name'),code:text('code'),roleId:text('roleId'),userId:text('userId'),assignmentId:text('assignmentId'),permissionCode:text('permissionCode'),scopeType:text('scopeType'),moduleId:text('moduleId'),action:text('action'),actorId:text('actorId'),createdAt:text('createdAt'),validFrom:text('validFrom'),validUntil:text('validUntil'),expiresAt:text('expiresAt'),isActive:text('isActive'),isPrimary:text('isPrimary'),positionId:text('positionId'),displayName:text('displayName')});`).join("")}` :
      args.path === "@/db" ? `import{getTableName}from'drizzle-orm';export function getDb(){return{select(){let table;const chain={from(t){table=getTableName(t);return chain},leftJoin(){return chain},innerJoin(){return chain},where(){return chain},orderBy(){return chain},groupBy(){return chain},limit(){return chain},then(resolve){resolve((window.TESTmodels[table]||[]).map(r=>({...r,...(r.createdAt?{createdAt:new Date(r.createdAt)}:{})})))}};return chain}}}` :
      args.path === "@/lib/access" ? `export async function getIdentityAccessContext(){return window.TESTaccess}` :
      args.path === "@/lib/auth" ? `export async function getCurrentUser(){return location.pathname==='/login'?null:{id:'TEST-user'}}` :
      args.path === "@/lib/env" ? `export function getServerEnv(){return {SUPPORT_CONTACT_TEXT:'TEST ผู้ดูแล'}}` :
      args.path === "@/lib/work-admin-read" ? `export async function getWorkAdminData(){return window.TESTwork}` :
      args.path === "@/lib/workspace-server" ? `export async function getWorkspaceData(){return {snapshot:{sources:[{moduleId:'work',status:'ready'}]}}}` :
      `export async function readModuleSettings(){return{available:window.TESTstate!=='unavailable',rows:[]}}`
    }));
  }}] });
  script = output.outputFiles.find(f => f.path.endsWith(".js"))!.text;
  moduleCss = output.outputFiles.find(f => f.path.endsWith(".css"))?.text ?? "";
});
async function mount(page: Page, { section = "overview", path = "/admin", theme = "light", width = 1440, state = "ready" } = {}) {
  const guard = { errors: [] as string[], commands: [] as { kind: string; body: string }[], unexpected: [] as string[], fail: false, hold: false, release: [] as (() => void)[] };
  await page.setViewportSize({ width, height: 1000 });
  page.on("pageerror", e => guard.errors.push(e.message));
  await page.route("**/*", async route => {
    const url = new URL(route.request().url());
    if (url.hostname !== "admin-auth.test") { guard.unexpected.push(url.href); await route.abort(); return; }
    if (url.pathname.startsWith("/TEST-action/")) {
      const kind = url.pathname.split("/").pop()!;
      guard.commands.push({ kind, body: route.request().postData() ?? "" });
      if (guard.hold) await new Promise<void>(done => guard.release.push(done));
      await route.fulfill({ contentType: "application/json", body: JSON.stringify(kind === "loginAction" || kind === "changePasswordAction" ? { error: "TEST ไม่สำเร็จ กรุณาตรวจสอบ", email: "test@example.invalid" } : { ok: !guard.fail, message: guard.fail ? "TEST ข้อมูลเปลี่ยนแปลง กรุณาลองใหม่" : "TEST บันทึกแล้ว", ...(kind === "previewWorkAdminAction" ? { previewId: "TEST-preview", rows: [{ taskId: "TEST-task", title: "TEST งาน", beforeDueAt: "2026-10-01", afterDueAt: "2026-10-03", beforeWeight: "50", afterWeight: "100" }] } : {}) }) }); return;
    }
    await route.fulfill({ contentType: "text/html", body: `<!doctype html><html lang="th" data-theme="${theme}"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>TEST Admin/Auth composition</title><style>${css}${moduleCss}${fonts}</style></head><body><div id="root"></div></body></html>` });
  });
  await page.goto(`https://admin-auth.test${path}?section=${section}&state=${state}&next=%2Fwork&reason=session-expired`);
  await page.evaluate(value => localStorage.setItem("permission-next-workspace-theme", value), theme);
  await page.addScriptTag({ content: script });
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
  await page.evaluate(async () => { await document.fonts.ready; });
  return guard;
}
async function check(page: Page, name: string) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  writeFileSync(resolve(evidence, `axe-${name}.json`), JSON.stringify(result.violations, null, 2));
  expect(result.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
}
function clean(guard: Awaited<ReturnType<typeof mount>>) { expect(guard.errors).toEqual([]); expect(guard.unexpected).toEqual([]); }

for (const theme of ["light", "dark"]) test(`computed ${theme}: Admin and auth hover/focus/status contrast`, async ({ page }) => {
  async function contrast(selector: string) {
    return page.locator(selector).first().evaluate(element => {
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
      const context = canvas.getContext('2d')!;
      function rgba(color: string) { context.clearRect(0, 0, 1, 1); context.fillStyle = color; context.fillRect(0, 0, 1, 1); return [...context.getImageData(0, 0, 1, 1).data]; }
      function luminance(values: number[]) { return values.slice(0, 3).map(v => { const s = v / 255; return s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4; }).reduce((sum, value, i) => sum + value * [.2126, .7152, .0722][i], 0); }
      const ancestors: Element[] = []; for (let parent: Element | null = element; parent; parent = parent.parentElement) ancestors.unshift(parent);
      let background = [255, 255, 255];
      for (const ancestor of ancestors) { const color = rgba(getComputedStyle(ancestor).backgroundColor); const alpha = color[3] / 255; background = background.map((v, i) => v * (1 - alpha) + color[i] * alpha); }
      const foreground = luminance(rgba(getComputedStyle(element).color)), back = luminance(background);
      return (Math.max(foreground, back) + .05) / (Math.min(foreground, back) + .05);
    });
  }
  const guard = await mount(page, { section: "users", theme, width: 1440 });
  expect(await page.locator('.admin-users .admin-table-wrap').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  const header = await page.locator('.admin-page > .page-heading').boundingBox();
  const headerAction = await page.locator('.admin-page > .page-heading .page-heading-actions').boundingBox();
  expect(headerAction!.x + headerAction!.width).toBeGreaterThan(header!.x + header!.width - 2);
  const row = page.locator('.admin-users tbody tr').first(); await row.hover();
  expect(await contrast('.admin-users tbody td strong')).toBeGreaterThanOrEqual(4.5);
  expect(await contrast('.admin-status')).toBeGreaterThanOrEqual(4.5);
  const action = page.getByRole('button', { name: 'จัดการการเข้าถึง', exact: true }); await action.hover();
  expect(await contrast('.admin-edit-trigger')).toBeGreaterThanOrEqual(4.5);
  await action.focus(); await expect(action).toBeFocused();
  expect(await action.evaluate(el => getComputedStyle(el).outlineStyle)).not.toBe('none');
  const current = page.locator('.admin-navigation [aria-current="page"]'); await current.focus();
  expect(await contrast('.admin-navigation [aria-current="page"]')).toBeGreaterThanOrEqual(4.5);
  await page.screenshot({ path: resolve(evidence, `final-users-${theme}-1440.png`), fullPage: true }); clean(guard);
  const auth = await mount(page, { path: '/login', theme, width: 320 });
  const submit = page.locator('.auth-submit-button'); await submit.hover();
  expect(await contrast('.auth-submit-button')).toBeGreaterThanOrEqual(4.5);
  await submit.focus(); expect(await submit.evaluate(el => getComputedStyle(el).outlineStyle)).not.toBe('none');
  await page.screenshot({ path: resolve(evidence, `final-login-focus-${theme}-320.png`), fullPage: true }); clean(auth);
});

test('audit filters retain original GET names and local clear destination', async ({ page }) => {
  const guard = await mount(page, { section: 'audit', width: 320, theme: 'dark' });
  const form = page.getByRole('form', { name: 'ตัวกรองประวัติ' });
  await expect(form).toHaveAttribute('method', 'get');
  expect(await form.evaluate(el => [...new FormData(el as HTMLFormElement).keys()])).toEqual(['section', 'auditModule', 'auditAction', 'auditActor', 'auditFrom', 'auditTo']);
  await expect(form.getByRole('link', { name: 'ล้างตัวกรอง' })).toHaveAttribute('href', '/admin?section=audit');
  await check(page, 'audit-filter-form'); clean(guard);
});
async function bounds(page: Page) { const d = page.locator("dialog[open]").last(); const box = await d.boundingBox(), vp = page.viewportSize()!; expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.y).toBeGreaterThanOrEqual(0); expect(box!.x + box!.width).toBeLessThanOrEqual(vp.width); expect(box!.y + box!.height).toBeLessThanOrEqual(vp.height); const last = d.locator("button:visible").last(); await last.scrollIntoViewIfNeeded(); await expect(last).toBeInViewport(); }
const sections = ["overview", "users", "positions", "teams", "roles", "kpi", "personal-kpi", "calendar", "recalculate", "systems", "modules", "announcement", "audit", "restore"];
for (const section of sections) for (const theme of ["light", "dark"]) test(`${section} ${theme}: real Admin route four widths`, async ({ page }) => {
  const guard = await mount(page, { section, theme });
  if (section === "roles") await page.locator(".admin-role-editor summary").first().click();
  if (section === "personal-kpi") await page.getByRole("combobox", { name: "ผู้รับผิดชอบ", exact: true }).selectOption("TEST-user:TEST-team");
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 }); await check(page, `route-${section}-${theme}-${width}`);
    if (theme === "light" && width === 1440 || theme === "dark" && width === 390 && ["users", "roles", "kpi", "systems"].includes(section)) await page.screenshot({ path: resolve(evidence, `${section}-${theme}-${width}.png`), fullPage: true });
  }
  clean(guard);
});
for (const path of ["/login", "/change-password"]) for (const theme of ["light", "dark"]) test(`${path} ${theme}: actual auth route four widths`, async ({ page }) => {
  const guard = await mount(page, { path, theme });
  for (const width of [1440, 768, 390, 320]) { await page.setViewportSize({ width, height: 1000 }); await check(page, `auth-${path.slice(1)}-${theme}-${width}`); if (width === 1440 || width === 390) await page.screenshot({ path: resolve(evidence, `${path.slice(1)}-${theme}-${width}.png`), fullPage: true }); }
  clean(guard);
});
for (const theme of ["light", "dark"]) for (const width of [320, 390, 768, 1440]) test(`user dialog ${theme} ${width}: footer focus and nested confirmations`, async ({ page }) => {
  const guard = await mount(page, { section: "users", theme, width }); const opener = page.getByRole("button", { name: "จัดการการเข้าถึง" }); await opener.click();
  const dialog = page.getByRole("dialog", { name: "TEST ผู้ดูแลบัญชี", exact: true }); await bounds(page); await check(page, `overlay-user-${theme}-${width}`);
  if (width === 390 || width === 1440) await page.screenshot({ path: resolve(evidence, `user-dialog-${theme}-${width}.png`) });
  await dialog.getByRole("button", { name: "ยกเลิกทุกเซสชัน", exact: true }).click(); const confirm = page.getByRole("dialog", { name: "ยกเลิกทุกเซสชัน", exact: true }); await bounds(page); await check(page, `overlay-session-${theme}-${width}`); await page.keyboard.press("Escape"); await expect(confirm).toHaveCount(0); await expect(dialog.getByRole("button", { name: "ยกเลิกทุกเซสชัน", exact: true })).toBeFocused(); expect(guard.commands).toHaveLength(0);
  await page.keyboard.press("Escape"); await expect(dialog).toHaveCount(0); await expect(opener).toBeFocused(); clean(guard);
});
test("user edit: pending lock, failed draft retains controlled select + exact payload, retry", async ({ page }) => {
  const guard = await mount(page, { section: "users", width: 390, theme: "dark" }); await page.getByRole("button", { name: "จัดการการเข้าถึง" }).click(); const d = page.getByRole("dialog", { name: "TEST ผู้ดูแลบัญชี", exact: true });
  await d.getByRole("textbox", { name: "ชื่อที่แสดง", exact: true }).fill("TEST ร่างผู้ใช้"); await d.getByRole("combobox", { name: "สถานะบัญชี" }).selectOption("inactive"); await d.getByRole("combobox", { name: "ขอบเขตข้อมูล", exact: true }).selectOption("SELECTED_TEAMS"); await d.getByRole("checkbox", { name: "TEST ทีมว่าง", exact: true }).check();
  guard.fail = true; guard.hold = true; await d.getByRole("button", { name: "บันทึกข้อมูลและสิทธิ์" }).click(); await expect.poll(() => guard.release.length).toBe(1); await expect(d.getByRole("textbox", { name: "ชื่อที่แสดง", exact: true })).toBeDisabled(); await page.keyboard.press("Escape"); await expect(d).toBeVisible(); guard.release.shift()!(); await expect(d.getByRole("status").filter({ hasText: "TEST ข้อมูลเปลี่ยนแปลง" })).toBeVisible(); await expect(d.getByRole("combobox", { name: "สถานะบัญชี" })).toHaveValue("inactive"); await expect(d.getByRole("checkbox", { name: "TEST ทีมว่าง", exact: true })).toBeChecked(); await check(page, "user-edit-failure"); guard.fail = false; guard.hold = false; await d.getByRole("button", { name: "บันทึกข้อมูลและสิทธิ์" }).click(); await expect(d.getByRole("status").filter({ hasText: "TEST บันทึกแล้ว" })).toBeVisible(); expect(guard.commands).toHaveLength(2); for (const value of ['name="status"\r\n\r\ninactive','name="scopeType"\r\n\r\nSELECTED_TEAMS','name="selectedTeamId"\r\n\r\nTEST-empty']) expect(guard.commands[1].body).toContain(value); clean(guard);
});
test("destructive team and role confirmation: cancel no mutation, confirm exact original IDs", async ({ page }) => {
  const guard = await mount(page, { section: "teams", width: 320, theme: "dark" }); await expect(page.getByRole("button", { name: "ย้ายผู้ใช้ออกจากทีม TEST ทีมปฏิบัติการ ก่อนลบ" })).toBeDisabled(); const opener = page.getByRole("button", { name: "ลบทีม TEST ทีมว่าง", exact: true }); await opener.click(); let d = page.getByRole("dialog", { name: "ลบทีม", exact: true }); await bounds(page); await check(page, "confirm-delete-team"); await page.keyboard.press("Escape"); await expect(opener).toBeFocused(); expect(guard.commands).toHaveLength(0); await opener.click(); await d.getByRole("button", { name: "ลบทีม", exact: true }).click(); await expect.poll(() => guard.commands.length).toBe(1); expect(guard.commands[0].body).toContain('name="teamId"\r\n\r\nTEST-empty'); clean(guard);
  const next = await mount(page, { section: "roles", width: 390 }); await page.locator(".admin-role-editor summary").first().click(); await page.getByRole("button", { name: "ลบบทบาทที่สร้าง", exact: true }).click(); d = page.getByRole("dialog", { name: "ลบบทบาทที่สร้าง", exact: true }); await check(page, "confirm-delete-role"); await d.getByRole("button", { name: "ลบบทบาท", exact: true }).click(); await expect.poll(() => next.commands.length).toBe(1); expect(next.commands[0].body).toContain('name="roleId"\r\n\r\nTEST-role'); clean(next);
});
test("work-admin: edit and failed-action retention, preview then explicit recalculation", async ({ page }) => {
  const guard = await mount(page, { section: "calendar", width: 390, theme: "dark" }); await page.getByRole("button", { name: "แก้ไข / ปิดใช้งาน" }).click(); const name = page.getByRole("textbox", { name: "ชื่อวันหยุด", exact: true }); await name.fill("TEST ร่างวันหยุด"); guard.fail = true; await page.getByRole("button", { name: "บันทึก", exact: true }).click(); await expect(page.getByRole("status").filter({ hasText: "TEST ข้อมูลเปลี่ยนแปลง" })).toBeVisible(); await expect(name).toHaveValue("TEST ร่างวันหยุด"); expect(guard.commands[0].body).toContain('name="expectedVersion"\r\n\r\n3'); await page.getByRole("button", { name: "ล้างฟอร์ม" }).click(); await expect(name).toHaveValue("TEST วันหยุด"); clean(guard);
  const next = await mount(page, { section: "recalculate", width: 320 }); await page.getByRole("button", { name: "ดูตัวอย่างผลกระทบ", exact: true }).first().click(); await expect(page.getByRole("table")).toHaveCount(1); await page.getByRole("checkbox").check(); await check(page, "recalculate-preview"); await page.getByRole("button", { name: "ยืนยันคำนวณใหม่" }).click(); await expect.poll(() => next.commands.length).toBe(2); expect(next.commands[1].body).toContain('name="previewId"\r\n\r\nTEST-preview'); clean(next);
});
for (const path of ["/login", "/change-password"]) test(`${path}: validation, visibility, deferred failure, keyboard focus and exact fields`, async ({ page }) => {
  const guard = await mount(page, { path, theme: "dark", width: 320 }); const submit = page.locator('.auth-submit-button'); await submit.click(); expect(guard.commands).toHaveLength(0); await expect(page.locator('[aria-invalid="true"]').first()).toBeFocused();
  const password = page.locator('input[name="password"]');
  if (path === "/login") await page.locator('input[name="email"]').fill("test@example.invalid");
  await password.fill("TEST-only-Password-2026!"); if (path !== "/login") await page.locator('input[name="confirm"]').fill("TEST-only-Password-2026!");
  await page.locator('.auth-visibility').first().click(); await expect(password).toHaveAttribute("type", "text"); await page.locator('.auth-visibility').first().click(); await expect(password).toHaveAttribute("type", "password");
  guard.hold = true; await submit.click(); await expect.poll(() => guard.release.length).toBe(1); await expect(submit).toBeDisabled(); guard.release.shift()!(); await expect(page.getByRole("alert")).toContainText("TEST ไม่สำเร็จ"); await expect(password).toBeFocused(); await check(page, `auth-error-${path.slice(1)}`); expect(guard.commands[0].body).toContain('name="password"\r\n\r\nTEST-only-Password-2026!'); if (path === "/login") expect(guard.commands[0].body).toContain('name="next"\r\n\r\n/work'); clean(guard);
});
test('role clone and system role stay on their original contracts', async ({ page }) => {
  const guard = await mount(page, { section: 'roles', width: 320, theme: 'dark' });
  const system = page.locator('.admin-role-editor').last(); await system.locator(':scope > summary').click();
  for (const control of await system.locator('input:not([type=hidden])').all()) await expect(control).toBeDisabled();
  await expect(system.getByRole('button', { name: 'ลบบทบาทที่สร้าง' })).toHaveCount(0);
  const create = page.locator('.admin-role-create'); await create.locator('[name=code]').fill('TEST_clone'); await create.locator('[name=name]').fill('TEST สำเนา'); await create.locator('[name=sourceRoleId]').selectOption('TEST-system'); await create.getByRole('button', { name: 'สร้างบทบาท', exact: true }).click();
  await expect.poll(() => guard.commands.length).toBe(1); expect(guard.commands[0].body).toContain('name="sourceRoleId"\r\n\r\nTEST-system'); clean(guard);
});

test('existing KPI edit and system edit/duplicate/reset preserve versions', async ({ page }) => {
  const guard = await mount(page, { section: 'kpi', width: 390 }); await page.getByRole('button', { name: 'แก้ไข / ปิดใช้งาน' }).click();
  const rule = page.locator('.work-admin-form'); await expect(rule.locator('[name=metricId]')).toHaveValue('TEST-metric'); await expect(rule.locator('[name=expectedVersion]')).toHaveValue('3'); await expect(rule.locator('[name=mainKpi]')).toHaveValue('TEST Main'); await rule.getByRole('button', { name: 'บันทึก', exact: true }).click(); await expect.poll(() => guard.commands.length).toBe(1); expect(guard.commands[0].body).toContain('name="expectedVersion"\r\n\r\n3'); clean(guard);
  const next = await mount(page, { section: 'systems', width: 320, theme: 'dark' }); await page.getByRole('button', { name: 'แก้ไข / ซ่อน' }).click();
  const form = page.locator('.work-admin-form'); await expect(form.locator('[name=id]')).toHaveValue('TEST-link'); await expect(form.locator('[name=expectedVersion]')).toHaveValue('4');
  await page.getByRole('button', { name: 'สร้างสำเนา' }).click(); await expect(form.locator('[name=id]')).toHaveValue(''); await expect(form.locator('[name=expectedVersion]')).toHaveValue(''); await expect(form.locator('[name=name]')).toHaveValue('TEST ระบบ (สำเนา)'); await expect(form.locator('[name=url]')).toHaveValue('/work');
  await form.getByRole('button', { name: 'บันทึก', exact: true }).click(); await expect.poll(() => next.commands.length).toBe(1); expect(next.commands[0].body).toContain('name="kind"\r\n\r\nsystem');
  await page.getByRole('button', { name: 'เพิ่ม / ล้างฟอร์ม' }).click(); await expect(form.locator('[name=name]')).toHaveValue(''); await check(page, 'systems-duplicate-reset'); clean(next);
});

test('calendar filters and personal KPI use-all remain available', async ({ page }) => {
  const guard = await mount(page, { section: 'calendar', width: 320 }); await page.getByRole('textbox', { name: 'ปี', exact: true }).fill('2025'); await expect(page.getByRole('button', { name: 'แก้ไข / ปิดใช้งาน' })).toHaveCount(0); await page.getByRole('textbox', { name: 'ปี', exact: true }).fill('2026'); await page.getByRole('combobox', { name: 'แหล่งที่มา', exact: true }).first().selectOption('thai'); await expect(page.getByRole('button', { name: 'แก้ไข / ปิดใช้งาน' })).toHaveCount(0); await page.getByRole('combobox', { name: 'แหล่งที่มา', exact: true }).first().selectOption('company'); await expect(page.getByRole('button', { name: 'แก้ไข / ปิดใช้งาน' })).toHaveCount(1); clean(guard);
  const next = await mount(page, { section: 'personal-kpi', width: 390, theme: 'dark' }); await page.getByRole('combobox', { name: 'ผู้รับผิดชอบ', exact: true }).selectOption('TEST-user:TEST-team'); const enabled = page.locator('[name="enabled:TEST-metric"]'); await enabled.uncheck(); await page.getByRole('button', { name: 'ใช้ KPI ที่แสดงทั้งหมด' }).click(); await expect(enabled).toBeChecked(); await expect(page.locator('[name=expectedVersion]')).toHaveValue('2'); await check(page, 'personal-use-all'); clean(next);
});

test('KPI migration preview cannot expose deadline confirmation', async ({ page }) => {
  const guard = await mount(page, { section: 'recalculate', width: 320, theme: 'dark' }); const panel = page.locator('[data-admin-surface=recalculate]').last(); await panel.getByRole('button', { name: 'ดูตัวอย่างผลกระทบ' }).click(); await expect(panel.getByRole('table')).toHaveCount(1); await expect(panel.getByRole('button', { name: 'ยืนยันคำนวณใหม่' })).toHaveCount(0); expect(guard.commands[0].body).toContain('name="kind"\r\n\r\nkpi_migration'); await check(page, 'kpi-migration-preview'); clean(guard);
});

test('user access scope options and no-position preview remain intact', async ({ page }) => {
  const guard = await mount(page, { section: 'users', width: 320, theme: 'dark' }); await page.getByRole('button', { name: 'จัดการการเข้าถึง' }).click(); const dialog = page.getByRole('dialog'); const scope = dialog.getByRole('combobox', { name: 'ขอบเขตข้อมูล', exact: true });
  for (const value of ['OWN', 'TEAM', 'SELECTED_TEAMS', 'ALL']) { await scope.selectOption(value); await expect(scope).toHaveValue(value); await expect(dialog.locator('.admin-team-picker')).toHaveCount(value === 'SELECTED_TEAMS' ? 1 : 0); }
  await dialog.getByRole('combobox', { name: 'ตำแหน่ง', exact: true }).selectOption(''); await expect(dialog.locator('.admin-access-preview')).toContainText('ยังไม่เลือกตำแหน่ง'); await page.keyboard.press('Escape'); expect(guard.commands).toHaveLength(0); clean(guard);
});

for (const scenario of [
  { section: "users", kind: "createUserAction", selector: ".admin-create-row" },
  { section: "positions", kind: "createPositionAction", selector: ".admin-form" },
  { section: "positions", kind: "updatePositionAction", selector: ".admin-inline-list form" },
  { section: "teams", kind: "createTeamAction", selector: ".admin-team-form" },
  { section: "teams", kind: "updateTeamAction", selector: ".admin-team-item form" },
  { section: "roles", kind: "createRoleAction", selector: ".admin-role-create" },
  { section: "roles", kind: "updateRolePermissionsAction", selector: ".admin-role-editor-body form" },
  { section: "kpi", kind: "saveWorkAdminAction", selector: ".work-admin-form" },
  { section: "personal-kpi", kind: "saveWorkAdminAction", selector: ".work-admin-form" },
  { section: "systems", kind: "saveWorkAdminAction", selector: ".work-admin-form" },
  { section: "announcement", kind: "saveWorkAdminAction", selector: ".work-admin-form" },
  { section: "restore", kind: "restoreWorkTaskAction", selector: ".work-admin-panels form" },
  { section: "modules", kind: "setModuleEnabledAction", selector: ".admin-content > form" },
]) test(`${scenario.section} ${scenario.kind}: original action form pending/failure/retry`, async ({ page }) => {
  const guard = await mount(page, { section: scenario.section, width: 390, theme: "dark" });
  if (scenario.section === "users") await page.locator('.admin-create-disclosure summary').click();
  if (scenario.kind === "updateRolePermissionsAction") await page.locator('.admin-role-editor summary').first().click();
  if (scenario.section === "personal-kpi") await page.getByRole('combobox', { name: 'ผู้รับผิดชอบ', exact: true }).selectOption('TEST-user:TEST-team');
  const form = page.locator(scenario.selector).first();
  for (const input of await form.locator('input:visible:not([type=checkbox]):not(:disabled),textarea:visible:not(:disabled)').all()) {
    const type = await input.getAttribute('type');
    if (!await input.inputValue()) await input.fill(type === 'email' ? 'test@example.invalid' : type === 'password' ? 'TEST-only-Password-2026!' : type === 'number' ? '100' : 'TEST draft');
  }
  for (const select of await form.locator('select:visible:not(:disabled)').all()) if (!await select.inputValue()) { const value = await select.locator('option').evaluateAll(options => options.map(o => (o as HTMLOptionElement).value).find(Boolean)!); await select.selectOption(value); }
  const feedback = scenario.kind === 'updatePositionAction' || scenario.kind === 'updateTeamAction' ? page.locator(`[data-admin-surface="${scenario.section}"]`) : form;
  guard.fail = true; guard.hold = true; const submit = form.locator('button[type=submit]').first(); await submit.click(); await expect.poll(() => guard.release.length).toBe(1); await expect(submit).toBeDisabled(); guard.release.shift()!(); await expect(feedback.getByRole('status').filter({ hasText: 'TEST ข้อมูลเปลี่ยนแปลง' })).toBeVisible();
  guard.fail = false; guard.hold = false; await submit.click(); await expect(feedback.getByRole('status').filter({ hasText: 'TEST บันทึกแล้ว' })).toBeVisible(); expect(guard.commands.map(c => c.kind)).toEqual([scenario.kind, scenario.kind]);
  if (scenario.section === 'users') await expect(form.locator('input[name=password]')).toHaveValue('');
  await check(page, `action-${scenario.section}-${scenario.kind}`); clean(guard);
});
test("security reset + revoke: shared confirmation, pending, original payload and password cleanup", async ({ page }) => {
  const guard = await mount(page, { section: 'users', width: 320, theme: 'dark' }); await page.getByRole('button', { name: 'จัดการการเข้าถึง' }).click(); const d = page.getByRole('dialog', { name: 'TEST ผู้ดูแลบัญชี', exact: true });
  await d.locator('input[name=password]').fill('TEST-only-Password-2026!'); await d.getByRole('button', { name: 'รีเซ็ต', exact: true }).click(); const confirm = page.getByRole('dialog', { name: 'รีเซ็ตรหัสผ่าน', exact: true }); await bounds(page); await check(page, 'confirm-reset-password'); await page.screenshot({ path: resolve(evidence, 'confirm-reset-dark-320.png') }); await confirm.getByRole('button', { name: 'รีเซ็ตรหัสผ่าน', exact: true }).click(); await expect(d.locator('input[name=password]')).toHaveValue(''); expect(guard.commands[0].kind).toBe('resetPasswordAction'); expect(guard.commands[0].body).toContain('name="userId"\r\n\r\nTEST-user');
  await d.getByRole('button', { name: 'ยกเลิกทุกเซสชัน', exact: true }).click(); await page.getByRole('dialog', { name: 'ยกเลิกทุกเซสชัน', exact: true }).getByRole('button', { name: 'ยกเลิกทุกเซสชัน', exact: true }).click(); await expect.poll(() => guard.commands.length).toBe(2); expect(guard.commands[1].kind).toBe('revokeUserSessionsAction'); clean(guard);
});
test("module unavailable + search empty feedback", async ({ page }) => { const guard = await mount(page, { section: "modules", state: "unavailable" }); await expect(page.getByRole("status").filter({ hasText: "ยังไม่ได้ติดตั้งข้อมูลตั้งค่าโมดูล" })).toBeVisible(); await check(page, "modules-unavailable"); clean(guard); const next = await mount(page, { section: "users" }); await page.getByRole("searchbox", { name: "ค้นหาผู้ใช้" }).fill("TEST ไม่มี"); await expect(page.getByText("ไม่พบผู้ใช้ที่ตรงกับคำค้นหา", { exact: true })).toBeVisible(); await page.getByRole("button", { name: "ล้างคำค้นหา" }).click(); await expect(page.locator("tbody tr")).toHaveCount(1); clean(next); });
