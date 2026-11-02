import { test, expect, type Page } from "@playwright/test";
import { build } from "esbuild";
import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";

const css = ["src/styles/tokens.css", "src/app/globals.css", "src/styles/shell.css", "src/styles/components.css", "src/styles/ui.css", "src/styles/notifications.css", "src/styles/work.css", "src/styles/auth.css", "src/styles/motion.css"].map(path => readFileSync(path, "utf8")).join("\n");
let moduleCss = "";
const fonts = [["manrope", "manrope"], ["nunito", "nunito"], ["thai", "noto-sans-thai"]].map(([name, file]) => `@font-face{font-family:TEST-${name};src:url(data:font/woff2;base64,${readFileSync(`src/app/fonts/${file}.woff2`).toString("base64")})}:root{--font-${name}:TEST-${name}}`).join("");

test.use({ launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {} });
let bundle = "";
let assignmentBundle = "";

test.beforeAll(async () => {
  const result = await build({
    bundle: true, write: false, outdir: "TEST-output", platform: "browser", format: "iife", jsx: "automatic",
    define: { "process.env.NODE_ENV": '"development"' },
    stdin: { resolveDir: process.cwd(), loader: "tsx", contents: `
      import React from "react"; import { createRoot } from "react-dom/client";
      import { MyWorkDashboard } from "./src/features/work/screens/my-work";
      import { WorkCreateForm } from "./src/components/work-create-form";
      import { WorkScreenShell } from "./src/features/work/components/work-screen-shell";
      import { copy } from "./src/lib/copy";
      const model = { source:{status:"ready",message:""}, tasks:[], activities:[],
        assignmentOptions:[{id:"00000000-0000-0000-0000-000000000001",name:"ผู้ใช้ทดสอบ",teamId:"00000000-0000-0000-0000-000000000010",teamName:"ทีมเริ่มต้น"}],
        kpiOptions:[{id:"00000000-0000-0000-0000-000000000101",teamId:"00000000-0000-0000-0000-000000000010",mainKpi:"คุณภาพ",subKpi:"ตรวจสอบ"},{id:"00000000-0000-0000-0000-000000000102",teamId:"00000000-0000-0000-0000-000000000010",mainKpi:"ประสิทธิภาพ",subKpi:"ความเร็ว"}],
        creationKey:"00000000-0000-0000-0000-000000000999" };
      const standalone = location.pathname === "/work/new";
      createRoot(document.getElementById("root")!).render(standalone
        ? <main><WorkScreenShell title="เพิ่มงาน" description={copy.feedback.workCreateDescription} parent={{label:"งานและ KPI",href:"/work"}} appearance="workspace"><WorkCreateForm model={model as any} userId="00000000-0000-0000-0000-000000000001" /></WorkScreenShell></main>
        : <MyWorkDashboard model={model as any} userId="00000000-0000-0000-0000-000000000001" canCreate />);
    ` },
    plugins: [{ name: "dialog-fixture-stubs", setup(builder) {
      builder.onResolve({ filter: /^next\/(link|navigation)$/ }, args => ({ path: args.path, namespace: "fixture" }));
      builder.onResolve({ filter: /^@\/app\/.*actions$/ }, () => ({ path: "actions", namespace: "fixture" }));
      builder.onResolve({ filter: /task-table$/ }, () => ({ path: "table", namespace: "fixture" }));
      builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ loader: "tsx", resolveDir: process.cwd(), contents:
        args.path === "actions" ? `export async function createPersonalTaskAction(){ return new Promise(resolve => window.__createResolvers.push(resolve)); } export async function previewWorkDeadlineAction(){ return new Promise(resolve => window.__previewResolvers.push(resolve)); }` :
        args.path === "shell" ? `export function WorkScreenShell(p){return <main>{p.action}{p.children}</main>} export const WorkEmpty=()=>null; export const WorkMetricStrip=()=>null; export const WorkUnavailable=()=>null;` :
        args.path === "table" ? `export const WorkTaskDetail=()=>null; export const WorkTaskTable=()=>null;` :
        args.path === "next/link" ? `export default function Link(p){return <a {...p}/>} ` :
        `export function useRouter(){return {refresh:()=>window.refreshCount=(window.refreshCount||0)+1}}` }));
    }}]
  });
  bundle = result.outputFiles.find(file => file.path.endsWith(".js"))!.text;
  moduleCss = result.outputFiles.find(file => file.path.endsWith(".css"))?.text ?? "";
  const assignmentResult = await build({
    bundle: true, write: false, platform: "browser", format: "iife", jsx: "automatic",
    define: { "process.env.NODE_ENV": '\"development\"' },
    stdin: { resolveDir: process.cwd(), loader: "tsx", contents: `
      import React from "react"; import { createRoot } from "react-dom/client";
      import { AssignmentCenterScreen } from "./src/features/work/screens/assignment-center";
      const model = { source:{status:"ready",message:""}, tasks:[], activities:[],
        assignmentOptions:[{id:"user-a",name:"ผู้รับผิดชอบ A",teamId:"team-a",teamName:"ทีม A"},{id:"user-b",name:"ผู้รับผิดชอบ B",teamId:"team-b",teamName:"ทีม B"}],
        kpiOptions:[{id:"rule-a",teamId:"team-a",mainKpi:"คุณภาพ",subKpi:"ตรวจสอบ"},{id:"rule-fixture",teamId:"team-a",mainKpi:"คุณภาพ",subKpi:"fixture: แจ้ง Job ให้ผู้รับเหมา + ประสานงานอาคาร + open job sap + open job owf"},{id:"rule-b",teamId:"team-b",mainKpi:"ความเร็ว",subKpi:"ตอบกลับ"}],
        creationKey:"creation-assignment" };
      createRoot(document.getElementById("root")!).render(<AssignmentCenterScreen model={model as any} />);
    ` },
    plugins: [{ name: "assignment-fixture-stubs", setup(builder) {
      builder.onResolve({ filter: /^@\/app\/.*actions$/ }, () => ({ path: "actions", namespace: "fixture" }));
      builder.onResolve({ filter: /work-screen-shell$/ }, () => ({ path: "shell", namespace: "fixture" }));
      builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ loader: "tsx", resolveDir: process.cwd(), contents:
        args.path === "actions" ? `export async function assignWorkTasksAction(_state, formData){ window.__assignmentSubmissions.push(Object.fromEntries(formData.entries())); return new Promise(resolve => window.__assignmentResolvers.push(resolve)); } export async function previewWorkDeadlineAction(){ return Promise.resolve({ok:true,message:"กำหนดส่ง"}); }` :
        args.path === "shell" ? `export function WorkScreenShell(p){return <main><h1>{p.title}</h1>{p.children}</main>} export const WorkEmpty=()=>null; export const WorkUnavailable=()=>null;` :
        `export {}` }));
    }}]
  });
  assignmentBundle = assignmentResult.outputFiles[0].text;
});

async function mount(page: Page) {
  await page.goto("https://work-dialog.fixture/");
  await page.addStyleTag({ content: css + moduleCss + fonts });
  await page.addScriptTag({ content: bundle });
  await page.evaluate(() => { window.__createResolvers = []; window.__previewResolvers = []; });
  await expect(page.getByRole("button", { name: "เพิ่มงาน", exact: true })).toBeVisible();
}

async function openForm(page: Page) {
  await page.getByRole("button", { name: "เพิ่มงาน", exact: true }).click();
  return page.locator("form.work-create-form");
}

async function resolveCreate(page: Page, result: { ok: boolean; message: string }) {
  await page.evaluate((value) => window.__createResolvers.shift()?.(value), result);
}

async function resolvePreview(page: Page) {
  await page.evaluate(() => window.__previewResolvers.shift()?.({ ok: true, message: "กำหนดส่ง 02/11/2026" }));
}

async function mountAssignment(page: Page) {
  await page.goto("https://assignment.fixture/");
  await page.addScriptTag({ content: assignmentBundle });
  await page.evaluate(() => { window.__assignmentResolvers = []; window.__assignmentSubmissions = []; });
  await expect(page.getByRole("heading", { name: "ศูนย์มอบหมายงาน", exact: true })).toBeVisible();
}

async function resolveAssignment(page: Page, result: { ok: boolean; message: string }) {
  await page.evaluate((value) => window.__assignmentResolvers.shift()?.(value), result);
}

async function clickOutsideDialog(page: Page) {
  const rect = await page.locator("dialog.ui-dialog[open]").first().boundingBox();
  if (!rect) throw new Error("dialog is not laid out");
  const x = rect.x > 8 ? rect.x - 4 : rect.x + rect.width + 4;
  await page.mouse.click(x, rect.y + Math.min(24, rect.height / 2));
}

test("keeps every draft control on cancel, then discard resets defaults and KPI filtering", async ({ page }) => {
  await page.route("https://work-dialog.fixture/", route => route.fulfill({ contentType: "text/html", body: "<div id='root'></div>" }));
  await mount(page);
  const form = await openForm(page);
  await form.locator("select[name=teamId]").selectOption({ label: "ทีมเริ่มต้น" });
  await form.locator("select").nth(1).selectOption({ label: "คุณภาพ" });
  await form.locator("select").nth(2).selectOption({ label: "ตรวจสอบ" });
  await form.locator("textarea[name=jobs]").fill("draft job");
  await form.locator("textarea[name=notes]").fill("draft note");
  await page.getByRole("button", { name: "ตรวจสอบกำหนดส่ง", exact: true }).click();
  await resolvePreview(page);
  await expect(page.getByText("กำหนดส่ง 02/11/2026")).toBeVisible();
  await page.getByRole("button", { name: "ปิดหน้าต่าง", exact: true }).click();
  await expect(page.getByRole("heading", { name: "ทิ้งข้อมูลที่กรอกไว้หรือไม่", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "ยกเลิก", exact: true }).click();
  await expect(form.locator("textarea[name=jobs]")).toHaveValue("draft job");
  await expect(form.locator("select").nth(1)).toHaveValue(/.*/);
  await page.getByRole("button", { name: "ปิดหน้าต่าง", exact: true }).click();
  await page.getByRole("button", { name: "ทิ้งข้อมูล", exact: true }).click();
  await page.getByRole("button", { name: "เพิ่มงาน", exact: true }).click();
  const reopened = page.locator("form.work-create-form");
  await expect(reopened.locator("select[name=teamId]")).toHaveValue("00000000-0000-0000-0000-000000000010");
  await expect(reopened.locator("select").nth(1)).toHaveValue("");
  await expect(reopened.locator("select").nth(2)).toHaveValue("");
  await reopened.locator("select").nth(1).selectOption({ label: "ประสิทธิภาพ" });
  await expect(reopened.locator("select").nth(2).locator("option")).toHaveText(["เลือก Sub KPI", "ความเร็ว"]);
});

test("failed submit preserves draft, retry succeeds, and each success resets before the next save", async ({ page }) => {
  await page.route("https://work-dialog.fixture/", route => route.fulfill({ contentType: "text/html", body: "<div id='root'></div>" }));
  await mount(page);
  let form = await openForm(page);
  await form.locator("select[name=teamId]").selectOption({ label: "ทีมเริ่มต้น" });
  await form.locator("select").nth(1).selectOption({ label: "คุณภาพ" });
  await form.locator("select").nth(2).selectOption({ label: "ตรวจสอบ" });
  await form.locator("textarea[name=jobs]").fill("first job");
  await form.getByRole("button", { name: "เพิ่มงาน", exact: true }).click();
  await expect(form).toHaveAttribute("aria-busy", "true");
  await resolveCreate(page, { ok: false, message: "บันทึกไม่สำเร็จ" });
  await expect(form).not.toHaveAttribute("aria-busy", "true");
  await expect(form.locator("textarea[name=jobs]")).toHaveValue("first job");
  await form.locator("textarea[name=jobs]").fill("retry job");
  await form.getByRole("button", { name: "เพิ่มงาน", exact: true }).click();
  await resolveCreate(page, { ok: true, message: "บันทึกแล้ว" });
  await expect.poll(() => page.evaluate(() => window.refreshCount || 0)).toBe(1);
  await expect(page.getByRole("heading", { name: "เพิ่มงานใหม่", exact: true })).toHaveCount(0);
  form = await openForm(page);
  await expect(form.locator("select[name=teamId]")).toHaveValue("00000000-0000-0000-0000-000000000010");
  await expect(form.locator("select").nth(1)).toHaveValue("");
  await expect(form.locator("select").nth(2)).toHaveValue("");
  await form.locator("select").nth(1).selectOption({ label: "ประสิทธิภาพ" });
  await form.locator("select").nth(2).selectOption({ label: "ความเร็ว" });
  await form.locator("textarea[name=jobs]").fill("second job");
  await form.getByRole("button", { name: "เพิ่มงาน", exact: true }).click();
  await resolveCreate(page, { ok: true, message: "บันทึกแล้ว" });
  await expect.poll(() => page.evaluate(() => window.refreshCount || 0)).toBe(2);
  await expect(page.getByRole("heading", { name: "เพิ่มงานใหม่", exact: true })).toHaveCount(0);
});

test("blocks Escape and close while preview or submit is pending", async ({ page }) => {
  await page.route("https://work-dialog.fixture/", route => route.fulfill({ contentType: "text/html", body: "<div id='root'></div>" }));
  await mount(page);
  const form = await openForm(page);
  await form.locator("textarea[name=jobs]").fill("pending job");
  await form.locator("select").nth(1).selectOption({ label: "คุณภาพ" });
  await form.locator("select").nth(2).selectOption({ label: "ตรวจสอบ" });
  await page.getByRole("button", { name: "ตรวจสอบกำหนดส่ง", exact: true }).click();
  await expect(form).toHaveAttribute("aria-busy", "true");
  await page.keyboard.press("Escape");
  await clickOutsideDialog(page);
  await expect(page.getByRole("heading", { name: "เพิ่มงานใหม่", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "ปิดหน้าต่าง", exact: true })).toBeDisabled();
  await expect.poll(() => page.evaluate(() => window.refreshCount || 0)).toBe(0);
  await resolvePreview(page);
  await expect(form).not.toHaveAttribute("aria-busy", "true");
  await form.getByRole("button", { name: "เพิ่มงาน", exact: true }).click();
  await expect(form).toHaveAttribute("aria-busy", "true");
  await page.keyboard.press("Escape");
  await clickOutsideDialog(page);
  await expect(page.getByRole("heading", { name: "เพิ่มงานใหม่", exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.refreshCount || 0)).toBe(0);
  await resolveCreate(page, { ok: true, message: "บันทึกแล้ว" });
  await expect.poll(() => page.evaluate(() => window.refreshCount || 0)).toBe(1);
});

test("resets controlled assignment team and KPI state after a successful save", async ({ page }) => {
  await page.route("https://assignment.fixture/", route => route.fulfill({ contentType: "text/html", body: "<div id='root'></div>" }));
  await mountAssignment(page);
  const form = page.locator("form.work-assignment-form");
  await form.locator("select[name=teamId]").selectOption("team-a");
  await form.locator("select").nth(1).selectOption("user-a");
  await form.locator("select").nth(2).selectOption("คุณภาพ");
  await form.locator("select").nth(3).selectOption("ตรวจสอบ");
  await form.locator("input[name=title]").fill("ชุดงานแรก");
  await form.locator("textarea[name=jobs]").fill("งานแรก");
  await form.getByRole("button", { name: "มอบหมายงาน", exact: true }).click();
  await expect(form).toHaveAttribute("aria-busy", "true");
  await resolveAssignment(page, { ok: true, message: "มอบหมายแล้ว" });
  await expect(form).not.toHaveAttribute("aria-busy", "true");
  await expect(form.locator("select[name=teamId]")).toHaveValue("");
  await expect(form.locator("select").nth(1)).toHaveValue("");
  await expect(form.locator("select").nth(2)).toHaveValue("");
  await expect(form.locator("select").nth(3)).toHaveValue("");
  await expect(form.locator("input[name=ruleVersionId]")).toHaveValue("");
});

test("preserves an assignment draft on failure and resets it only after retry succeeds", async ({ page }) => {
  await page.route("https://assignment.fixture/", route => route.fulfill({ contentType: "text/html", body: "<div id='root'></div>" }));
  await mountAssignment(page);
  const form = page.locator("form.work-assignment-form");
  await form.locator("select[name=teamId]").selectOption("team-a");
  await form.locator("select").nth(1).selectOption("user-a");
  await form.locator("select").nth(2).selectOption("คุณภาพ");
  await form.locator("select").nth(3).selectOption({ label: "fixture: แจ้ง Job ให้ผู้รับเหมา + ประสานงานอาคาร + open job sap + open job owf" });
  await form.locator("select[name=workType]").selectOption("C1");
  await form.locator("input[name=contractorName]").fill("ผู้รับเหมาหลัก");
  await form.locator("input[name=building]").fill("อาคาร A");
  await form.locator("input[name=client]").fill("ลูกค้า B");
  await form.locator("input[name=contractor]").fill("ผู้รับเหมาอาคาร C");
  await form.locator("input[name=ssrNumber]").fill("SSR-123");
  await form.locator("input[name=ospNumber]").fill("OSP-456");
  await form.locator("input[name=title]").fill("งานที่ต้องลองใหม่");
  await form.locator("textarea[name=jobs]").fill("รายละเอียดเดิม");
  await form.getByRole("button", { name: "มอบหมายงาน", exact: true }).click();
  await resolveAssignment(page, { ok: false, message: "บันทึกไม่สำเร็จ" });
  await expect(form.locator("select[name=teamId]")).toHaveValue("team-a");
  await expect(form.locator("select").nth(2)).toHaveValue("คุณภาพ");
  await expect(form.locator("select").nth(3)).toHaveValue("fixture: แจ้ง Job ให้ผู้รับเหมา + ประสานงานอาคาร + open job sap + open job owf");
  await expect(form.locator("input[name=title]")).toHaveValue("งานที่ต้องลองใหม่");
  await expect(form.locator("textarea[name=jobs]")).toHaveValue("รายละเอียดเดิม");
  for (const [name, value] of Object.entries({ workType: "C1", contractorName: "ผู้รับเหมาหลัก", building: "อาคาร A", client: "ลูกค้า B", contractor: "ผู้รับเหมาอาคาร C", ssrNumber: "SSR-123", ospNumber: "OSP-456" })) {
    await expect(form.locator(`[name=${name}]`)).toHaveValue(value);
  }
  await form.getByRole("button", { name: "มอบหมายงาน", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__assignmentSubmissions.length)).toBe(2);
  await expect.poll(() => page.evaluate(() => window.__assignmentSubmissions[1])).toMatchObject({ workType: "C1", contractorName: "ผู้รับเหมาหลัก", building: "อาคาร A", client: "ลูกค้า B", contractor: "ผู้รับเหมาอาคาร C", ssrNumber: "SSR-123", ospNumber: "OSP-456" });
  await resolveAssignment(page, { ok: true, message: "มอบหมายแล้ว" });
  await expect(form.locator("select[name=teamId]")).toHaveValue("");
  await expect(form.locator("select").nth(2)).toHaveValue("");
  await expect(form.locator("select").nth(3)).toHaveValue("");
  await expect(form.locator("input[name=title]")).toHaveValue("");
  await expect(form.locator("textarea[name=jobs]")).toHaveValue("");
});

for (const theme of ["light", "dark"]) for (const width of [320, 768, 1024, 1440]) {
  test(`create popup layout, keyboard and accessibility ${theme} ${width}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.route("https://work-dialog.fixture/", route => route.fulfill({ contentType: "text/html", body: '<!doctype html><html lang="th"><head><title>TEST popup · synthetic data</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div></body></html>' }));
    await mount(page);
    await page.locator("html").evaluate((node, value) => node.setAttribute("data-theme", value), theme);
    const opener = page.getByRole("button", { name: "เพิ่มงาน", exact: true });
    const form = await openForm(page);
    const dialog = page.getByRole("dialog", { name: "เพิ่มงานใหม่", exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { level: 2 })).toHaveCount(1);
    const close = dialog.getByRole("button", { name: "ปิดหน้าต่าง", exact: true });
    await expect(close).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(form.locator('[name="teamId"]')).toBeFocused();
    expect(await form.locator('[name="teamId"]').evaluate(node => getComputedStyle(node).outlineStyle)).toBe("solid");
    await form.getByRole("button", { name: "เพิ่มงาน", exact: true }).click();
    expect(await form.locator('[name="mainKpi"]').evaluate((node: HTMLSelectElement) => node.validity.valueMissing)).toBe(true);
    await form.locator('[name="jobs"]').fill("TEST รายละเอียดงาน");
    const save = form.getByRole("button", { name: "เพิ่มงาน", exact: true });
    await save.scrollIntoViewIfNeeded();
    await expect(save).toBeInViewport();
    expect(await dialog.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
    const rect = await dialog.boundingBox();
    expect(rect!.x).toBeGreaterThanOrEqual(0);
    expect(rect!.x + rect!.width).toBeLessThanOrEqual(width);
    expect(rect!.y).toBeGreaterThanOrEqual(0);
    expect(rect!.y + rect!.height).toBeLessThanOrEqual(900);
    expect(await save.evaluate(node => node.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
    const axe = await new AxeBuilder({ page }).include('.work-create-dialog[open]').withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(axe.violations.map(item => item.id)).toEqual([]);
    await dialog.evaluate(node => { node.scrollTop = 0; });
    await page.screenshot({ path: testInfo.outputPath(`popup-${theme}-${width}.png`) });
    await page.keyboard.press("Escape");
    const discard = page.getByRole("dialog", { name: "ทิ้งข้อมูลที่กรอกไว้หรือไม่" });
    await discard.getByRole("button", { name: "ยกเลิก", exact: true }).click();
    await expect(form.locator('[name="jobs"]')).toHaveValue("TEST รายละเอียดงาน");
    await page.keyboard.press("Escape");
    await discard.getByRole("button", { name: "ทิ้งข้อมูล", exact: true }).click();
    await expect(opener).toBeFocused();
  });
}

// Actual standalone composition and CSS; synthetic model and mocked server actions, not auth acceptance.
for (const theme of ["light", "dark"]) for (const width of [320, 1440]) {
  test(`standalone Add Task styling and actions ${theme} ${width}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.route("https://work-dialog.fixture/**", route => route.fulfill({ contentType: "text/html", body: '<!doctype html><html lang="th"><head><title>TEST standalone · synthetic data</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div></body></html>' }));
    await page.goto("https://work-dialog.fixture/work/new");
    await page.locator("html").evaluate((node, value) => node.setAttribute("data-theme", value), theme);
    await page.addStyleTag({ content: css + moduleCss + fonts });
    await page.evaluate(() => { window.__createResolvers = []; window.__previewResolvers = []; });
    await page.addScriptTag({ content: bundle });
    const form = page.locator("form.work-create-page-form");
    await expect(page.getByRole("heading", { name: "เพิ่มงาน", exact: true, level: 1 })).toBeVisible();
    await expect(form).toBeVisible();
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    const controls = form.locator('input:not([type="hidden"]), select, textarea');
    for (const control of await controls.all()) {
      const style = await control.evaluate(node => {
        const s = getComputedStyle(node);
        return { height: node.getBoundingClientRect().height, radius: s.borderRadius, padding: parseFloat(s.paddingInlineStart), font: s.fontFamily, bodyFont: getComputedStyle(document.body).fontFamily, background: s.backgroundColor, color: s.color, border: s.borderTopStyle, labelDisplay: getComputedStyle(node.closest("label")!).display };
      });
      expect(style.height).toBeGreaterThanOrEqual(44);
      expect(parseFloat(style.radius)).toBeGreaterThan(0);
      expect(style.padding).toBeGreaterThanOrEqual(12);
      expect(style.font).toBe(style.bodyFont);
      expect(style.background).not.toBe("rgba(0, 0, 0, 0)");
      expect(style.color).not.toBe(style.background);
      expect(style.border).toBe("solid");
      expect(style.labelDisplay).toBe("grid");
    }
    await form.locator('[name="teamId"]').focus();
    expect(await form.locator('[name="teamId"]').evaluate(node => getComputedStyle(node).outlineStyle)).toBe("solid");
    await page.keyboard.press("Tab");
    await expect(form.locator('[name="mainKpi"]')).toBeFocused();
    const save = form.getByRole("button", { name: "เพิ่มงาน", exact: true });
    await save.click();
    expect(await form.locator('[name="mainKpi"]').evaluate((node: HTMLSelectElement) => node.validity.valueMissing)).toBe(true);
    expect(await page.evaluate(() => window.__createResolvers.length)).toBe(0);
    await form.locator('[name="mainKpi"]').selectOption("คุณภาพ");
    await form.locator('[name="subKpi"]').selectOption("ตรวจสอบ");
    await save.click();
    expect(await form.locator('[name="jobs"]').evaluate((node: HTMLTextAreaElement) => node.validity.valueMissing)).toBe(true);
    await form.locator('[name="jobs"]').fill("TEST รายละเอียดงาน");
    await form.locator('[name="notes"]').fill("TEST หมายเหตุ");
    for (const button of await form.getByRole("button").all()) {
      await button.scrollIntoViewIfNeeded();
      await expect(button).toBeInViewport();
      await expect(button).toBeEnabled();
      const bounds = (await button.boundingBox())!;
      expect(bounds.height).toBeGreaterThanOrEqual(44);
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await form.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
    const axe = await new AxeBuilder({ page }).include(".work-create-page-form").withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(axe.violations.map(item => item.id)).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath(`standalone-${theme}-${width}.png`), fullPage: true });
    await form.getByRole("button", { name: "ตรวจสอบกำหนดส่ง", exact: true }).click();
    await expect(form).toHaveAttribute("aria-busy", "true");
    await expect(save).toBeDisabled();
    await resolvePreview(page);
    await expect(form.getByRole("status").filter({ hasText: "กำหนดส่ง 02/11/2026" })).toBeVisible();
    await save.click();
    await expect(form).toHaveAttribute("aria-busy", "true");
    await resolveCreate(page, { ok: false, message: "TEST บันทึกไม่สำเร็จ" });
    await expect(form.locator('[name="jobs"]')).toHaveValue("TEST รายละเอียดงาน");
    await expect(form.locator('[name="notes"]')).toHaveValue("TEST หมายเหตุ");
    await save.click();
    await resolveCreate(page, { ok: true, message: "TEST บันทึกแล้ว" });
    await expect(form.locator('[name="jobs"]')).toHaveValue("");
    await expect(save).toBeEnabled();
    await expect(form).toBeVisible();
  });
}

declare global {
  interface Window {
    refreshCount?: number;
    __createResolvers: Array<(result: { ok: boolean; message: string }) => void>;
    __previewResolvers: Array<(result: { ok: boolean; message: string }) => void>;
    __assignmentResolvers: Array<(result: { ok: boolean; message: string }) => void>;
    __assignmentSubmissions: Array<Record<string, string>>;
  }
}