import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { build } from "esbuild";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { depositPreviewItems } from "../src/lib/deposit-v2-preview";
import { availableDepositTransitions, depositStatuses } from "../src/lib/deposit-v2-workflow";
import { workflowLabels } from "../src/lib/deposit-v2-domain";

test.use({ launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {} });
const evidence = resolve("docs/quality/guarantees");
const id = "11111111-1111-4111-8111-111111111111";
const items = depositPreviewItems.map((item, index) => ({ ...item, id: index ? `11111111-1111-4111-8111-${String(index).padStart(12, "0")}` : id, ownerId: "TEST-user", owner: index % 2 ? "TEST เจ้าของสอง" : "TEST เจ้าของหนึ่ง", teamId: "TEST-team", tlAssigneeId: "TEST-user", version: 7, cid: `TEST-${index}`, no: String(index + 1), place: `TEST อาคาร ${index} ตรวจสอบหลักฐานและเงินประกัน`, deposit: String(item.deposit ?? "0"), demolish: String(item.demolish ?? "0"), fee: "500.25", other: "0", dateReq: "2026-09-01", updatedAt: "2026-09-29T00:00:00Z" }));
const css = ["src/styles/tokens.css", "src/app/globals.css", "src/styles/shell.css", "src/styles/components.css", "src/styles/ui.css", "src/styles/notifications.css", "src/styles/work.css", "src/styles/auth.css", "src/styles/motion.css"].map(p => readFileSync(resolve(p), "utf8")).join("\n");
const fonts = [["manrope", "manrope"], ["nunito", "nunito"], ["thai", "noto-sans-thai"], ["code", "source-code-pro"]].map(([name, file]) => `@font-face{font-family:fixture-${name};src:url(data:font/woff2;base64,${readFileSync(resolve(`src/app/fonts/${file}.woff2`)).toString("base64")}) format('woff2');font-weight:100 900}:root{--font-${name}:fixture-${name}}`).join("");
let script = "", moduleCss = "";
test.beforeAll(async () => {
  mkdirSync(evidence, { recursive: true });
  const output = await build({ bundle: true, write: false, outdir: "fixture-output", platform: "browser", jsx: "automatic", define: { "process.env.NODE_ENV": '"development"', "process.env.DATABASE_URL": '"TEST_ONLY_NO_DATABASE"' }, stdin: { loader: "tsx", resolveDir: process.cwd(), contents: `
import React from 'react';import {createRoot} from'react-dom/client';import{AppShell}from'./src/components/app-shell';
import Main from './src/app/(platform)/guarantees/page';import New from './src/app/(platform)/guarantees/new/page';import Detail from './src/app/(platform)/guarantees/[id]/page';
import Loading from './src/app/(platform)/guarantees/loading';import DetailLoading from './src/app/(platform)/guarantees/[id]/loading';
import{isInstallationTeamPending}from'./src/lib/deposit-v2-domain';
const params=new URLSearchParams(location.search),state=params.get('state')||'ready';
window.TESTitems=${JSON.stringify(items)};window.TESTstate=state;
window.TESTitem={...window.TESTitems[0],place:state==='long'?'TEST อาคารรายละเอียดและการประสานงานเงินประกัน '.repeat(8):window.TESTitems[0].place,status:params.get('status')||'new',pdf_payment:'/TEST-payment',pdf_layout:'/TEST-layout'};
window.TESTaccess={allowed:state!=='denied',userId:'TEST-user',isDevelopmentSession:state==='preview',subject:{userId:'TEST-user',teamIds:['TEST-team'],grants:(state==='readonly'?[]:state==='tl'?['guarantee.tl.work']:['guarantee.case.update','guarantee.case.manage','guarantee.case.create']).map(permission=>({permission,scope:'ALL'}))}};
window.TESTpendingFilter=isInstallationTeamPending;
async function render(){let content=state==='loading'?(location.pathname==='/guarantees'?<Loading/>:<DetailLoading/>):await (location.pathname.endsWith('/new')?New():location.pathname==='/guarantees'?Main({searchParams:Promise.resolve(Object.fromEntries(params))}):Detail({params:Promise.resolve({id:location.pathname.split('/').pop()})}));createRoot(document.getElementById('root')).render(<React.StrictMode><AppShell displayName="TEST ผู้ใช้ทดสอบ" allowedModuleIds={['guarantees']}><div className="deposit-banner">TEST ข้อมูลจำลอง · ไม่เข้าสู่ระบบจริง · ไม่เชื่อมฐานข้อมูล · คำสั่งทั้งหมดจำลองที่ขอบเขต server</div>{content}</AppShell></React.StrictMode>)}render().catch(e=>{document.getElementById('root').textContent=e.message;});
` }, plugins: [{ name: "guarantee-test-boundaries", setup(builder) {
    builder.onResolve({ filter: /^next\/(link|navigation)$/ }, args => ({ path: args.path, namespace: "TEST" }));
    builder.onResolve({ filter: /^@\/app\/.*actions$/ }, () => ({ path: "actions", namespace: "TEST" }));
    builder.onResolve({ filter: /^@\/lib\/(access|env|deposit-v2-server)$/ }, () => ({ path: "data", namespace: "TEST" }));
    builder.onLoad({ filter: /.*/, namespace: "TEST" }, args => ({ loader: "tsx", resolveDir: process.cwd(), contents:
      args.path === "data" ? `export function getServerEnv(){return {SUPPORT_CONTACT_TEXT:'TEST ผู้ดูแล'}}export async function getAccessContext(){return window.TESTaccess}export async function getIdentityAccessContext(){return window.TESTaccess}export function canCreateDepositWorkItem(){return !['readonly','tl'].includes(window.TESTstate)}export function canWorkAsAssignedTl(){return window.TESTstate==='tl'}export async function listTlAssignees(){return [{id:'TEST-user',displayName:'TEST ทีมติดตั้ง'}]}export async function listDepositWorkItems(limit,team,tl){window.TESTread={limit,team,tl};return {items:window.TESTstate==='empty'?[]:window.TESTstate==='many'?Array.from({length:25},(_,i)=>({...window.TESTitems[0],id:'TEST-page-'+i,no:String(i+1),cid:'TEST-PAGE-'+i})):tl?window.TESTitems.filter(window.TESTpendingFilter):window.TESTitems,state:['unavailable','not_configured'].includes(window.TESTstate)?window.TESTstate:'ready',truncated:window.TESTstate==='truncated',generatedAt:'2026-09-29T00:00:00Z'}}export async function getDepositWorkItem(){return window.TESTitem}export async function getDepositWorkEvents(){return [{id:'TEST-event',action:'transition',fromStatus:'new',toStatus:'fin',reason:'TEST หมายเหตุ',occurredAt:new Date('2026-09-29T00:00:00Z')}]}` :
      args.path === "actions" ? `async function run(kind,previous,data){const response=await fetch('/TEST-action/'+kind,{method:'POST',body:data});return response.json()}export const saveDepositWorkItem=(p,d)=>run('save',p,d);export const transitionDepositWorkItem=(p,d)=>run('transition',p,d);export async function logoutAction(){throw Error('No auth in TEST fixture')}` :
      args.path === "next/link" ? `import React from'react';export default function Link({prefetch,...props}){return <a {...props}/>} ` :
      `import{useSyncExternalStore}from'react';const router={push:url=>{history.pushState({},'',url);dispatchEvent(new PopStateEvent('popstate'))},replace:url=>{history.replaceState({},'',url);dispatchEvent(new PopStateEvent('popstate'))},refresh:()=>{window.TESTrefresh=(window.TESTrefresh||0)+1}};function subscribe(fn){addEventListener('popstate',fn);return()=>removeEventListener('popstate',fn)}export function useRouter(){return router}export function usePathname(){return useSyncExternalStore(subscribe,()=>location.pathname)}export function useSearchParams(){return new URLSearchParams(useSyncExternalStore(subscribe,()=>location.search))}export function notFound(){throw Error('TEST not found')}`
    }));
  }}] });
  script = output.outputFiles.find(f => f.path.endsWith(".js"))!.text;
  moduleCss = output.outputFiles.find(f => f.path.endsWith(".css"))?.text ?? "";
});
async function mount(page: Page, { path = "/guarantees", state = "ready", theme = "light", width = 1440, status = "new", query = "" } = {}) {
  const guard = { commands: [] as { path: string; body: string }[], unexpected: [] as string[], errors: [] as string[], fail: false, hold: false, release: [] as (() => void)[] };
  await page.setViewportSize({ width, height: 1000 });
  await page.clock.install({ time: new Date("2026-09-29T03:00:00Z") });
  page.on("pageerror", e => guard.errors.push(e.message));
  await page.route("**/*", async route => {
    const url = new URL(route.request().url());
    if (url.hostname !== "guarantees-client.test") { guard.unexpected.push(url.origin); await route.abort(); return; }
    if (url.pathname.startsWith("/TEST-action/") || url.pathname.startsWith("/api/guarantees/")) {
      guard.commands.push({ path: url.pathname, body: route.request().postData() ?? "" });
      if (guard.hold) await new Promise<void>(done => guard.release.push(done));
      await route.fulfill({ status: guard.fail ? 409 : 200, contentType: "application/json", body: JSON.stringify(url.pathname.startsWith("/TEST-action/") ? { ok: !guard.fail, message: guard.fail ? "TEST ข้อมูลเปลี่ยนแปลง กรุณาตรวจสอบแล้วลองใหม่" : "TEST บันทึกแล้ว", id } : guard.fail ? { error: "TEST อัปโหลดไม่สำเร็จ กรุณาลองใหม่" } : {}) }); return;
    }
    await route.fulfill({ contentType: "text/html", body: `<!doctype html><html lang="th" data-theme="${theme}"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>TEST Guarantees client composition</title><style>${css}${moduleCss}${fonts}</style></head><body><div id="root"></div></body></html>` });
  });
  await page.goto(`https://guarantees-client.test${path}?state=${state}&status=${encodeURIComponent(status)}${query}`);
  await page.evaluate(value => localStorage.setItem("permission-next-workspace-theme", value), theme);
  await page.addScriptTag({ content: script });
  await expect(page.locator("[data-app-shell]")).toBeVisible(); await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
  await page.evaluate(async () => { await document.fonts.ready; });
  return guard;
}
const views = [["dashboard", "ภาพรวมของฉัน"], ["queue", "งานที่ต้องติดตาม"], ["list", "รายการเงินประกัน"], ["on_service", "มีประกันรื้อถอน (On Service)"], ["done", "งานสำเร็จ"], ["analytics", "วิเคราะห์ข้อมูล"]] as const;
async function view(page: Page, id: string) { const item = views.find(v => v[0] === id)!; await (id === "analytics" ? page.getByRole("button", { name: item[1], exact: true }) : page.getByRole("navigation", { name: "มุมมองเงินประกัน" }).getByRole("button", { name: item[1] })).click(); }
async function check(page: Page, name: string) {
  await page.evaluate(async () => { await Promise.all(document.getAnimations().filter(animation => animation instanceof CSSTransition).map(animation => animation.finished.catch(() => {}))); });
  const overflow = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth, nodes: [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return r.right > innerWidth && getComputedStyle(e).position !== 'fixed'; }).slice(0, 18).map(e => ({ tag: e.tagName, class: e.className, text: e.textContent?.slice(0, 60), parent: e.parentElement?.className, right: e.getBoundingClientRect().right })) }));
  expect(overflow.scroll, JSON.stringify(overflow)).toBeLessThanOrEqual(overflow.width);
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  writeFileSync(resolve(evidence, `axe-${name}.json`), JSON.stringify(result.violations, null, 2));
  expect(result.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
}
async function snapshot(page: Page, name: string, overlay = false) { await page.screenshot({ path: resolve(evidence, `${name}.png`), fullPage: !overlay }); }

// Keep visual artifacts outside the repository; callers may choose the output directory.
const visualEvidence = resolve(process.env.LAYOUT_REGRESSION_EVIDENCE_DIR ?? process.env.TMPDIR ?? tmpdir());

test('layout regression: deposit create is one track, edit keeps side panel, and both fit narrow viewports', async ({ page }) => {
  mkdirSync(visualEvidence, { recursive: true });
  await mount(page, { path: '/guarantees/new', width: 1920, theme: 'light' });
  const createGrid = page.locator('.deposit-detail-grid');
  await expect(createGrid).toHaveClass(/deposit-detail-grid-create/);
  const createColumns = await createGrid.evaluate(element => getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length);
  expect(createColumns).toBe(1);
  await expect(createGrid.locator(':scope > aside.deposit-side')).toHaveCount(0);
  await page.screenshot({ path: resolve(visualEvidence, 'deposit-create-wide.png'), fullPage: true });

  await mount(page, { path: `/guarantees/${id}`, width: 1920, theme: 'light' });
  const editGrid = page.locator('.deposit-detail-grid');
  await expect(editGrid).toHaveClass(/deposit-detail-grid-edit/);
  const editColumns = await editGrid.evaluate(element => getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length);
  expect(editColumns).toBe(2);
  await expect(editGrid.locator(':scope > aside.deposit-side')).toHaveCount(1);

  for (const width of [760, 390]) {
    await mount(page, { path: '/guarantees/new', width, theme: 'light' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await mount(page, { path: `/guarantees/${id}`, width, theme: 'light' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

function clean(guard: Awaited<ReturnType<typeof mount>>) { expect(guard.errors).toEqual([]); expect(guard.unexpected).toEqual([]); }

test("create form: approved four groups preserve every field and normal-flow save row", async ({ page }) => {
  const guard = await mount(page, { path: "/guarantees/new", width: 1440, theme: "light" });
  const groups = [
    ["รายการและผู้เกี่ยวข้อง", ["place", "area", "tl_team", "customer", "cid", "no", "project", "deal", "pr", "contact", "tel", "mobile", "payTo", "payType", "tlAssigneeId", "detail", "note"]],
    ["จำนวนเงิน", ["deposit", "demolish", "fee", "other", "other_desc"]],
    ["กำหนดการ", ["dateReq", "dateDue", "install_date", "tl_due_date"]],
    ["ข้อมูลติดตาม/คืนเงิน", ["dateCheck", "dateAcc", "service_cancel_date", "date_return", "inspected_by", "depReturn", "demoReturn"]],
  ] as const;
  const form = page.locator(".deposit-form");
  await expect(form.locator(":scope > fieldset.deposit-fields > .deposit-form-section")).toHaveCount(4);
  const sectionGridExpectations = [
    ["deposit-form-section-related", 3],
    ["deposit-form-section-money", 4],
    ["deposit-form-section-schedule", 4],
    ["deposit-form-section-followup", 4],
  ] as const;
  for (const [className, columns] of sectionGridExpectations) {
    await expect(form.locator(`.${className} .deposit-form-fields`)).toHaveCount(1);
    await expect.poll(async () => form.locator(`.${className} .deposit-form-fields`).evaluate(element => getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length)).toBe(columns);
  }
  await expect(page.getByText("ต้องระบุเมื่อค่าใช้จ่ายอื่นมากกว่า 0", { exact: true })).toBeVisible();
  await expect(page.locator('[name="other_desc"]')).toHaveAttribute("aria-describedby", "other-desc-hint");
  for (const [heading, fields] of groups) {
    const section = form.locator(".deposit-form-section", { has: page.getByRole("heading", { name: heading, exact: true }) });
    await expect(section).toHaveCount(1);
    await expect(section.locator("input,select")).toHaveCount(fields.length);
    for (const name of fields) await expect(section.locator(`[name="${name}"]`)).toHaveCount(1);
  }
  await expect(page.getByLabel("อาคาร *", { exact: true })).toHaveAttribute("required", "");
  await expect(page.getByRole("combobox", { name: "พื้นที่ / ทีมติดตั้ง", exact: true })).toHaveAttribute("required", "");
  await expect(page.locator('[name="tl_team"]')).toHaveAttribute("readonly", "");
  const savebar = page.locator(".deposit-savebar");
  await expect(savebar).toHaveCSS("position", "static");
  const geometry = await page.evaluate(() => {
    const save = document.querySelector<HTMLElement>(".deposit-savebar")!.getBoundingClientRect();
    const fields = [...document.querySelectorAll<HTMLElement>(".deposit-form-section input, .deposit-form-section select")];
    const last = fields.at(-1)!.getBoundingClientRect();
    return { saveTop: save.top, lastBottom: last.bottom, viewport: innerWidth, scroll: document.documentElement.scrollWidth, clipped: fields.some(field => { const box = field.getBoundingClientRect(); return box.left < 0 || box.right > innerWidth || box.width <= 0 || box.height <= 0; }) };
  });
  expect(geometry.saveTop).toBeGreaterThanOrEqual(geometry.lastBottom);
  expect(geometry.scroll).toBeLessThanOrEqual(geometry.viewport);
  expect(geometry.clipped).toBe(false);
  for (const [width, expectedColumns] of [[760, 2], [390, 1]] as const) {
    await page.setViewportSize({ width, height: 1000 });
    for (const [className] of sectionGridExpectations) {
      await expect.poll(async () => form.locator(`.${className} .deposit-form-fields`).evaluate(element => getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length)).toBe(expectedColumns);
    }
    const responsive = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, viewport: innerWidth, clipped: [...document.querySelectorAll<HTMLElement>(".deposit-form-section input, .deposit-form-section select")].some(field => { const box = field.getBoundingClientRect(); return box.left < 0 || box.right > innerWidth || box.width <= 0 || box.height <= 0; }) }));
    expect(responsive.scroll).toBeLessThanOrEqual(responsive.viewport);
    expect(responsive.clipped).toBe(false);
  }
  clean(guard);
});

async function bounds(page: Page) { const dialog = page.locator("dialog[open]").last(); const box = await dialog.boundingBox(), vp = page.viewportSize()!; expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.y).toBeGreaterThanOrEqual(0); expect(box!.x + box!.width).toBeLessThanOrEqual(vp.width); expect(box!.y + box!.height).toBeLessThanOrEqual(vp.height); await dialog.locator("button").last().scrollIntoViewIfNeeded(); await expect(dialog.locator("button").last()).toBeInViewport(); }

test("long Thai title: actual shared tooltip focus, Escape and reflow", async ({ page }) => {
  const guard = await mount(page, { path: `/guarantees/${id}`, state: "long", width: 320, theme: "dark" });
  const text = page.locator('h1 .truncated-text[tabindex="0"]'); await expect(text).toHaveCount(1); await text.focus();
  const tooltip = page.locator('h1 [role="tooltip"]'); await expect(tooltip).toBeVisible(); await expect(tooltip).toContainText("TEST อาคารรายละเอียด");
  await page.keyboard.press("Escape"); await expect(tooltip).toBeHidden(); await expect(text).toBeFocused(); await check(page, "long-title-dark-320"); clean(guard);
});
for (const theme of ["light", "dark"]) test(`table hover/focus ${theme}: actual contrast and keyboard scroll`, async ({ page }) => {
  const guard = await mount(page, { theme }); await view(page, "list");
  await page.locator("tbody tr").first().hover(); await check(page, `hover-table-${theme}`);
  const region = page.getByRole("region", { name: "รายการเงินประกัน เลื่อนแนวนอนได้" }); await region.focus(); await page.keyboard.press("ArrowRight"); await expect(region).toBeFocused();
  await page.locator(".copy-cid").first().focus(); await check(page, `focus-table-${theme}`); clean(guard);
});
for (const [id] of views) for (const theme of ["light", "dark"]) test(`${id} ${theme}: 320/390/768/1440 real route view`, async ({ page }) => {
  const guard = await mount(page, { theme }); await view(page, id);
  for (const width of [1440, 768, 390, 320]) { await page.setViewportSize({ width, height: 1000 }); await check(page, `view-${id}-${theme}-${width}`); if (width === 1440 && theme === "light" || width === 390 && theme === "dark" && ["dashboard", "list", "analytics"].includes(id)) await snapshot(page, `view-${id}-${theme}-${width}`); }
  clean(guard);
});
for (const kind of ["new", "manager", "readonly", "tl"]) for (const theme of ["light", "dark"]) test(`${kind} ${theme}: actual route detail/form and four widths`, async ({ page }) => {
  const guard = await mount(page, { path: kind === "new" ? "/guarantees/new" : `/guarantees/${id}`, state: kind === "readonly" || kind === "tl" ? kind : "ready", status: kind === "tl" ? "tl" : "new", theme });
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  for (const width of [1440, 768, 390, 320]) { await page.setViewportSize({ width, height: 1000 }); await check(page, `route-${kind}-${theme}-${width}`); if (width === 1440 && theme === "light" || width === 390 && theme === "dark") await snapshot(page, `route-${kind}-${theme}-${width}`); }
  if (kind === "readonly") await expect(page.locator('.deposit-module-page input[type="file"],.deposit-module-page form')).toHaveCount(0);
  clean(guard);
});
test("installation-team/team query: actual pending selection, tabs and analytics return", async ({ page }) => { const guard = await mount(page, { query: "&view=installation-team&team=TEST-team" }); await expect(page.getByRole("heading", { level: 1 })).toContainText("ทีมติดตั้ง"); expect(await page.evaluate(() => (window as unknown as { TESTread: object }).TESTread)).toEqual({ limit: 500, team: "TEST-team", tl: true }); await expect(page.locator(".legacy-module-nav button")).toHaveCount(2); await view(page, "analytics"); await page.getByRole("button", { name: "กลับรายการเงินประกัน", exact: true }).click(); await expect(page.locator(".deposit-queue")).toBeVisible(); await check(page, "installation-team"); await snapshot(page, "installation-team-light-1440"); clean(guard); });
for (const state of ["empty", "unavailable", "not_configured", "truncated", "denied", "readonly", "loading"]) test(`main ${state} boundary`, async ({ page }) => { const guard = await mount(page, { state, width: 390, theme: "dark" }); await check(page, `state-${state}`); if (state === "denied") await expect(page.locator(".deposit-workspace")).toHaveCount(0); if (state === "readonly") await expect(page.getByRole("button", { name: "＋ เพิ่มรายการใหม่", exact: true })).toBeDisabled(); if (state === "empty") { await view(page, "list"); await expect(page.getByText("ไม่พบรายการที่ตรงกับเงื่อนไข", { exact: true })).toBeVisible(); } clean(guard); });
test("list controls: search/status/owner/area/clear, NO sort, CSV bytes and copy failure", async ({ page }) => {
  const guard = await mount(page); await view(page, "list"); const search = page.getByRole("searchbox", { name: "ค้นหารายการ" }); await search.fill("TEST ไม่มี"); await expect(page.locator("tbody tr")).toHaveCount(0); await page.getByRole("button", { name: "ล้างตัวกรอง", exact: true }).click();
  for (const [name, value] of [["กรองสถานะ", "fin"], ["กรองเจ้าของงาน", "TEST เจ้าของสอง"], ["กรองพื้นที่", "BKK 4"]]) await page.getByRole("combobox", { name, exact: true }).selectOption(value);
  await expect(page.locator("tbody tr")).toHaveCount(1); await page.getByRole("button", { name: "NO." }).click(); await expect(page.locator('th[aria-sort="ascending"]')).toBeVisible(); await page.getByRole("button", { name: "NO." }).click(); await expect(page.locator('th[aria-sort="descending"]')).toBeVisible();
  await page.getByRole("combobox", { name: "เดือนสำหรับส่งออก" }).selectOption("8"); await page.getByRole("combobox", { name: "ปีสำหรับส่งออก" }).selectOption("2026"); const download = page.waitForEvent("download"); await page.getByRole("button", { name: "⇩ Export CSV", exact: true }).click(); const file = await download; expect(file.suggestedFilename()).toBe("deposit-report-2026-9.csv"); await file.saveAs(resolve(evidence, "TEST-register.csv")); expect(readFileSync(resolve(evidence, "TEST-register.csv"), "utf8")).toContain('"TEST-1"');
  await page.evaluate(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: () => Promise.reject(Error("TEST denied")) } })); await page.locator(".copy-cid").click(); await expect(page.getByRole("status").filter({ hasText: "คัดลอกไม่สำเร็จ" })).toBeVisible(); await view(page, "analytics"); await page.getByRole("button", { name: "กลับรายการเงินประกัน", exact: true }).click(); await expect(page.getByRole("combobox", { name: "กรองสถานะ" })).toHaveValue("fin"); clean(guard);
});
for (const kind of ["new", "manager"]) test(`${kind} form: controlled failed draft, pending, retry, exact decimalstrings, unsaved confirmation`, async ({ page }) => {
  const guard = await mount(page, { path: kind === "new" ? "/guarantees/new" : `/guarantees/${id}`, width: 390, theme: "dark" });
  await page.getByLabel("อาคาร *", { exact: true }).fill("TEST ร่างอาคาร"); await page.getByRole("combobox", { name: "พื้นที่ / ทีมติดตั้ง", exact: true }).selectOption("CMI"); await page.getByLabel("ประกันติดตั้ง", { exact: true }).fill("1234.50"); await page.getByLabel("หมายเหตุ", { exact: true }).fill("TEST ร่างคงอยู่"); await page.getByRole("combobox", { name: "มอบหมายผู้รับผิดชอบทีมติดตั้ง", exact: true }).selectOption("TEST-user");
  const back = page.getByRole("link", { name: "← กลับรายการ", exact: true }); await back.click(); let dialog = page.getByRole("dialog", { name: "ทิ้งข้อมูลที่กรอกไว้หรือไม่" }); await expect(dialog).toBeVisible(); await bounds(page); await check(page, `overlay-discard-${kind}`); if (kind === "new") await snapshot(page, "overlay-discard-dark-390", true); await page.keyboard.press("Escape"); await expect(dialog).toHaveCount(0); await expect(back).toBeFocused();
  await expect(page.getByRole('combobox', { name: 'พื้นที่ / ทีมติดตั้ง', exact: true })).toHaveValue('CMI');
  guard.fail = true; guard.hold = true; const save = page.getByRole("button", { name: kind === "new" ? "สร้างรายการ" : "บันทึกการแก้ไข", exact: true }); await save.click(); await expect.poll(() => guard.release.length).toBe(1); await expect(page.getByLabel("อาคาร *", { exact: true })).toBeDisabled(); guard.release.shift()!(); await expect(page.getByRole("alert")).toContainText("TEST ข้อมูลเปลี่ยนแปลง"); await expect(page.getByLabel("อาคาร *", { exact: true })).toHaveValue("TEST ร่างอาคาร"); await expect(page.getByRole("combobox", { name: "พื้นที่ / ทีมติดตั้ง", exact: true })).toHaveValue("CMI"); await expect(page.getByLabel("ประกันติดตั้ง", { exact: true })).toHaveValue("1234.50"); await expect(page.getByLabel("หมายเหตุ", { exact: true })).toHaveValue("TEST ร่างคงอยู่"); await check(page, `form-error-${kind}`);
  guard.fail = false; await save.click(); await expect.poll(() => guard.release.length).toBe(1); guard.release.shift()!(); await expect(page.getByRole("status").filter({ hasText: "TEST บันทึกแล้ว" })).toBeVisible(); expect(guard.commands[1].body).toContain('name="deposit"\r\n\r\n1234.50'); if (kind === "manager") { expect(guard.commands[1].body).toContain('name="version"\r\n\r\n7'); await page.getByLabel("หมายเหตุ", { exact: true }).fill("TEST รอบสอง"); await back.click(); dialog = page.getByRole("dialog", { name: "ทิ้งข้อมูลที่กรอกไว้หรือไม่" }); await dialog.getByRole("button", { name: "ทิ้งข้อมูล", exact: true }).click(); await expect(page).toHaveURL(/\/guarantees$/); } clean(guard);
});
for (const status of depositStatuses) test(`manager ${status}: every existing transition confirm, focus, pending/error/retry`, async ({ page }) => {
  const guard = await mount(page, { path: `/guarantees/${id}`, status, width: 390, theme: "dark" }); const targets = availableDepositTransitions(status);
  expect(await page.locator(".deposit-transition>button").count()).toBe(targets.length);
  for (const target of targets) { const label = target === "Cancel" ? "ยกเลิกรายการ" : `ไปขั้นตอน ${workflowLabels[target] || target}`; const opener = page.getByRole("button", { name: label, exact: true }); await page.getByRole("textbox", { name: "เหตุผล", exact: true }).fill(`TEST เหตุผล ${target}`); await opener.click(); const dialog = page.getByRole("dialog", { name: "ยืนยันขั้นตอนเงินประกัน" }); await bounds(page); await page.keyboard.press("Escape"); await expect(dialog).toHaveCount(0); await expect(opener).toBeFocused(); await opener.click(); guard.fail = true; guard.hold = true; await dialog.getByRole("button", { name: "ยืนยันขั้นตอน", exact: true }).click(); await expect.poll(() => guard.release.length).toBe(1); await page.keyboard.press("Escape"); await expect(dialog).toBeVisible(); guard.release.shift()!(); await expect(dialog.getByRole("alert")).toBeVisible(); await expect(page.getByRole("textbox", { name: "เหตุผล", exact: true })).toHaveValue(`TEST เหตุผล ${target}`); if (status === "new" && target === "Cancel") { await check(page, "overlay-cancel-error"); await snapshot(page, "overlay-cancel-error-dark-390", true); } guard.fail = false; await dialog.getByRole("button", { name: "ยืนยันขั้นตอน", exact: true }).click(); await expect.poll(() => guard.release.length).toBe(1); guard.release.shift()!(); await expect(dialog).toHaveCount(0); expect(guard.commands.at(-1)!.body).toContain(`name="to"\r\n\r\n${target}`); expect(guard.commands.at(-1)!.body).toContain('name="version"\r\n\r\n7'); await expect(page.getByRole("textbox", { name: "เหตุผล", exact: true })).toHaveValue(""); }
  clean(guard);
});
for (const status of ["tl", "On Process", "done"]) test(`TL ${status}: exact controls and role-limited evidence`, async ({ page }) => { const guard = await mount(page, { path: `/guarantees/${id}`, status, state: "tl" }); await expect(page.locator('input[type="file"]')).toHaveCount(status === "done" ? 0 : 2); await expect(page.locator(".deposit-form")).toHaveCount(0); const count = status === "tl" ? 2 : status === "On Process" ? 1 : 0; await expect(page.locator(".deposit-transition>button")).toHaveCount(count); for (let i = 0; i < count; i++) { await page.locator(".deposit-transition>button").nth(i).click(); await page.getByRole("dialog").getByRole("button", { name: "ยืนยันขั้นตอน", exact: true }).click(); await expect(page.getByRole("dialog")).toHaveCount(0); } clean(guard); });
test("all seven evidence slots: private href, pending lock, failure retains file, same-file reselect after success", async ({ page }) => { const guard = await mount(page, { path: `/guarantees/${id}`, width: 320 }); const uploads = page.locator(".deposit-evidence"); await expect(uploads).toHaveCount(7); await expect(uploads.first().getByRole("link")).toHaveAttribute("href", `/api/guarantees/${id}/documents/pdf_payment`); for (let i = 0; i < 7; i++) { const row = uploads.nth(i), input = row.locator('input[type="file"]'); await input.setInputFiles({ name: "TEST-evidence.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 TEST ONLY not a production document") }); guard.fail = true; guard.hold = true; await row.getByRole("button", { name: "อัปโหลด", exact: true }).click(); await expect.poll(() => guard.release.length).toBe(1); await expect(input).toBeDisabled(); guard.release.shift()!(); await expect(row.getByRole("status")).toContainText("TEST อัปโหลดไม่สำเร็จ"); expect(await input.evaluate(el => (el as HTMLInputElement).files?.length)).toBe(1); guard.fail = false; await row.getByRole("button", { name: "อัปโหลด", exact: true }).click(); await expect.poll(() => guard.release.length).toBe(1); guard.release.shift()!(); await expect(input).toHaveValue(""); await input.setInputFiles({ name: "TEST-evidence.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 TEST ONLY") }); await expect(row.getByRole("button", { name: "อัปโหลด", exact: true })).toBeEnabled(); } expect(guard.commands).toHaveLength(14); clean(guard); });
test("analytics: original formatter CSV bytes, area/owner filters, month controls, data disclosure and print", async ({ page }) => { const guard = await mount(page); await view(page, "analytics"); const report = page.getByRole("region", { name: "รายงานเงินประกันสำหรับผู้บริหาร" }); await report.getByRole("combobox", { name: "พื้นที่", exact: true }).selectOption("BKK 1"); await report.getByRole("combobox", { name: "เจ้าของงาน", exact: true }).selectOption("TEST เจ้าของหนึ่ง"); await report.locator(".gr-month-chart button").last().click(); await page.getByText("ดูตัวเลขรายเดือนทั้งหมด", { exact: true }).click(); const download = page.waitForEvent("download"); await page.getByRole("button", { name: "ส่งออก CSV รายงานปัจจุบัน", exact: true }).click(); await (await download).saveAs(resolve(evidence, "TEST-analytics.csv")); expect(readFileSync(resolve(evidence, "TEST-analytics.csv"), "utf8")).toContain("TEST"); await page.evaluate(() => { window.print = () => { Object.assign(window, { TESTprinted: true }); }; }); await page.getByRole("button", { name: "พิมพ์ / บันทึก PDF", exact: true }).click(); expect(await page.evaluate(() => (window as unknown as { TESTprinted: boolean }).TESTprinted)).toBe(true); await page.emulateMedia({ media: "print" }); await expect(page.locator('.skip-link')).toBeHidden(); const printChart = await page.locator('.gr-month-chart').boundingBox(); const printLastMonth = await page.locator('.gr-month-chart button').last().boundingBox(); expect(printLastMonth!.x + printLastMonth!.width).toBeLessThanOrEqual(printChart!.x + printChart!.width + 1); await page.pdf({ path: resolve(evidence, "TEST-analytics.pdf"), preferCSSPageSize: true }); clean(guard); });

for (const kind of ["discard", "transition"]) for (const theme of ["light", "dark"]) for (const width of [320, 390, 768, 1440]) test(`overlay ${kind} ${theme} ${width}: bounds focus and axe`, async ({ page }) => {
  const guard = await mount(page, { path: `/guarantees/${id}`, theme, width });
  let opener;
  if (kind === "discard") { await page.getByLabel("หมายเหตุ", { exact: true }).fill("TEST ร่าง"); opener = page.getByRole("link", { name: "← กลับรายการ", exact: true }); }
  else opener = page.getByRole("button", { name: "ยกเลิกรายการ", exact: true });
  await opener.click(); const dialog = page.getByRole("dialog"); await expect(dialog).toBeVisible(); await bounds(page); await check(page, `overlay-${kind}-${theme}-${width}`);
  if (theme === "light" && width === 1440) await snapshot(page, `overlay-${kind}-light-1440`, true);
  await page.keyboard.press("Tab"); await expect(dialog).toBeVisible(); await page.keyboard.press("Escape"); await expect(dialog).toHaveCount(0); await expect(opener).toBeFocused(); clean(guard);
});
for (const theme of ["light", "dark"]) test(`installation-team ${theme} all widths`, async ({ page }) => { const guard = await mount(page, { theme, query: "&view=installation-team&team=TEST-team" }); for (const width of [320, 390, 768, 1440]) { await page.setViewportSize({ width, height: 1000 }); await check(page, `view-installation-team-${theme}-${width}`); } clean(guard); });
for (const path of ["/guarantees/new", `/guarantees/${id}`]) for (const state of ["denied", "loading"]) test(`${path} ${state}: route state`, async ({ page }) => { const guard = await mount(page, { path, state }); await check(page, `route-${path.endsWith("new") ? "new" : "detail"}-${state}`); if (state === "denied") await expect(page.locator(".deposit-form")).toHaveCount(0); clean(guard); });
test("preview query preserves read-only banner and disabled create", async ({ page }) => { const guard = await mount(page, { state: "preview", query: "&preview=1" }); await expect(page.getByText(/ข้อมูลตัวอย่างจาก workflow V2/)).toBeVisible(); await expect(page.getByRole("button", { name: "＋ เพิ่มรายการใหม่", exact: true })).toBeDisabled(); await check(page, "query-preview"); clean(guard); });
test("25 TEST records: pagination, export all pages, keyboard search and row navigation", async ({ page }) => { const guard = await mount(page, { state: "many" }); await view(page, "list"); await expect(page.locator("tbody tr")).toHaveCount(20); await page.getByRole("button", { name: "ถัดไป →", exact: true }).click(); await expect(page.locator("tbody tr")).toHaveCount(5); await page.getByRole("button", { name: "← ก่อนหน้า", exact: true }).click(); await expect(page.locator("tbody tr")).toHaveCount(20); await page.locator(".legacy-module-nav button").first().focus(); await page.keyboard.press("/"); await expect(page.getByRole("searchbox", { name: "ค้นหารายการ" })).toBeFocused(); const download = page.waitForEvent("download"); await page.getByRole("button", { name: "⇩ Export CSV", exact: true }).click(); const path = await (await download).path(); expect(readFileSync(path!, "utf8").split("\r\n")).toHaveLength(26); await page.locator("tbody tr").first().focus(); await page.keyboard.press("Enter"); await expect(page).toHaveURL(/\/guarantees\/TEST-page-0$/); clean(guard); });
