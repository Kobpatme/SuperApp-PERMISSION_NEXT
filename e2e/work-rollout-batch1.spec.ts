import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { build } from "esbuild";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

test.use({ launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {} });

const globalCss = ["src/styles/tokens.css","src/app/globals.css","src/styles/shell.css","src/styles/components.css","src/styles/ui.css","src/styles/notifications.css","src/styles/work.css","src/styles/auth.css","src/styles/motion.css"]
  .map(file => readFileSync(resolve(file), "utf8")).join("\n");
const fonts = [["manrope","manrope"],["nunito","nunito"],["thai","noto-sans-thai"],["code","source-code-pro"]]
  .map(([name,file]) => `@font-face{font-family:fixture-${name};src:url(data:font/woff2;base64,${readFileSync(resolve(`src/app/fonts/${file}.woff2`)).toString("base64")}) format('woff2');font-weight:100 900}:root{--font-${name}:fixture-${name}}`).join("");
let script: string;
let moduleCss = "";

test.beforeAll(async () => {
  const result = await build({ stdin: { resolveDir: process.cwd(), loader: "tsx", contents: `
    import React from 'react'; import {createRoot} from 'react-dom/client';
    import {AppShell} from './src/components/app-shell';
    import {MyWorkDashboard} from './src/features/work/screens/my-work';
    import {KpiWorkspaceScreen} from './src/features/work/screens/kpi-workspace';
    import {WorkFiltersForm} from './src/features/work/components/work-filters';
    const now='2026-10-23T10:00:00Z';
    const tasks=Array.from({length:3},(_,i)=>({id:'task-'+i,title:'ตรวจสอบเอกสารและประสานงานอาคาร '+i,description:'รายละเอียดงาน',status:i===0?'completed':'in_progress',statusLabel:i===0?'เสร็จสิ้น':'กำลังทำ',priority:'normal',dueAt:'2026-10-30T10:00:00Z',completedAt:i===0?now:null,updatedAt:now,ownerId:'fixture',ownerName:'ผู้ใช้ทดสอบ',teamId:'team-1',teamName:'ทีมทดสอบ',jobCode:'JOB-'+i,mainKpi:'คุณภาพงาน',subKpi:'ความครบถ้วน',note:'บันทึกงาน',notes:[],kpiWeight:'25%',version:1}));
    const source={moduleId:'work',status:'ready',itemCount:3,message:''};
    const model={generatedAt:now,source,tasks,activities:[{id:'a1',eventLabel:'อัปเดตงาน',ownerName:'ผู้ใช้ทดสอบ',occurredAt:now,entityId:'task-1'}],items:[],people:[],jobGroups:[],kpiCards:[{id:'k1',metric:'คุณภาพงาน',actual:'92',unit:'%',target:'90%',progress:100,periodStart:'2026-10-01',periodEnd:'2026-10-31',factCount:3,weight:'25%',calculatedAt:now}],scores:[],facts:[{id:'f1',metric:'คุณภาพงาน',value:'92',status:'applied',occurredAt:now,calculationVersion:'v1'}],personalAssignments:[{name:'คุณภาพงาน',weight:25,version:1,enabled:true}],assignmentOptions:[{id:'fixture',name:'ผู้ใช้ทดสอบ',teamId:'team-1',teamName:'ทีมทดสอบ'}],kpiOptions:[],report:{taskCount:3,overdue:0,dueSoon:1,completion:33,sla:92},creationKey:'fixture-key'};
    const path=window.fixturePath;
    const content=path==='/work'
      ? <MyWorkDashboard model={model} userId="fixture" canCreate />
      : <KpiWorkspaceScreen model={model} filters={<WorkFiltersForm filters={{}} model={model} appearance="workspace" resetHref="/work/kpi"/>}/>;
    createRoot(document.getElementById('root')).render(<AppShell displayName="ผู้ใช้ทดสอบ" allowedModuleIds={['work','buildings','guarantees']} canAdmin workNavigation={[{href:'/work',label:'ภาพรวมงาน',icon:'work'},{href:'/work/mine',label:'งานของฉัน',icon:'check'},{href:'/work/kpi',label:'KPI ของฉัน',icon:'check'}]} scopeLabel="ทีมของตน">{content}</AppShell>);
  ` }, bundle: true, write: false, outdir: "fixture-output", platform: "browser", jsx: "automatic", define: { "process.env.NODE_ENV": '"development"' }, plugins: [{ name: "batch1-boundaries", setup(builder) {
    builder.onResolve({filter:/^next\/(link|navigation)$/}, args=>({path:args.path,namespace:"fixture"}));
    builder.onResolve({filter:/^@\/app\/.*actions$/},()=>({path:"actions",namespace:"fixture"}));
    builder.onLoad({filter:/.*/,namespace:"fixture"}, args=>({loader:"tsx",resolveDir:process.cwd(),contents:args.path==='actions'?'export async function logoutAction(){throw new Error("Mutations disabled in Batch 1 fixture")} export const addWorkTaskNoteAction=logoutAction,deleteWorkTaskAction=logoutAction,editWorkTaskAction=logoutAction,transitionWorkTaskAction=logoutAction,createPersonalTaskAction=logoutAction,previewWorkDeadlineAction=logoutAction;':args.path==='next/link'?`import React from'react';export default function Link({prefetch,...props}){return <a {...props}/>} `:`export function usePathname(){return window.fixturePath}export function useSearchParams(){return new URLSearchParams()}export function useRouter(){return {push:()=>{},replace:()=>{},refresh:()=>{}}}`}));
  }}] });
  script = result.outputFiles.find(file=>file.path.endsWith(".js"))!.text;
  moduleCss = result.outputFiles.find(file=>file.path.endsWith(".css"))?.text ?? "";
});

async function mount(page: Page, route: "/"|"/work"|"/work/kpi", theme: "light"|"dark", width: number) {
  await page.setViewportSize({ width, height: 1000 });
  await page.route("**/*", request => request.request().url() === "https://batch1.test/"
    ? request.fulfill({ contentType: "text/html", body: `<!doctype html><html lang="th" data-theme="${theme}"><head><title>Batch 1 fixture</title><style>${globalCss}${moduleCss}${fonts}</style></head><body><div id="root"></div></body></html>` })
    : request.abort());
  await page.goto("https://batch1.test/");
  await page.evaluate(routeName => { window.fixturePath = routeName; }, route);
  await page.addScriptTag({ content: script });
  await expect(page.locator("[data-app-shell]")).toBeVisible();
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all(document.getAnimations().filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));});
}

async function axe(page: Page) {
  const result = await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa","wcag22aa"]).analyze();
  expect(result.violations.map(item=>({id:item.id,targets:item.nodes.map(node=>node.target)}))).toEqual([]);
}

for (const route of ["/work","/work/kpi"] as const) for (const theme of ["light","dark"] as const) for (const width of [375,768,1440]) {
  test(`${route} ${theme} ${width}`, async ({page}, info) => {
    const errors:string[]=[]; page.on("pageerror", error=>errors.push(error.message));
    await mount(page, route, theme, width);
    await expect(page.getByRole("heading", {name: route==="/work"?"ภาพรวมงานของฉัน":"KPI ของฉัน", exact:true})).toBeVisible();
    if (route === "/work/kpi") {
      const heading = page.getByRole("heading", {name:"KPI ของฉัน", exact:true});
      const filter = page.locator('form[aria-label="ตัวกรองงาน"]');
      expect((await heading.boundingBox())!.y).toBeLessThan((await filter.boundingBox())!.y);
      await expect(filter.getByRole("link", {name:"ล้างตัวกรอง"})).toHaveAttribute("href", "/work/kpi");
      await filter.getByText("ตัวกรองเพิ่มเติม", {exact:false}).click();
      await expect(filter.getByRole("combobox", {name:"สถานะ", exact:true})).toBeVisible();
    }
    if (route === "/work" && width === 375) {
      await expect(page.locator("thead")).toBeHidden();
      expect(await page.locator("tbody tr").first().evaluate(el=>getComputedStyle(el).display)).toBe("grid");
    }
    if (route === "/work" && width === 1440) {
      const sidebar = page.locator("[data-shell-sidebar]");
      const navigation = sidebar.locator(".sidebar-nav");
      const before = await sidebar.boundingBox();
      const navigationWidth = await navigation.evaluate(element => element.clientWidth);
      expect(await navigation.evaluate(element => getComputedStyle(element).scrollbarWidth)).toBe("none");
      await page.getByRole("button", {name:"เงินประกัน", exact:true}).click();
      await expect(page.locator("#sidebar-section-guarantees")).toHaveClass(/is-open/);
      await page.waitForTimeout(250);
      expect((await sidebar.boundingBox())!.width).toBe(before!.width);
      expect(await navigation.evaluate(element => element.clientWidth)).toBe(navigationWidth);
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await axe(page);
    expect(errors).toEqual([]);
    await page.screenshot({path:info.outputPath("batch1-fixture.png"),fullPage:true});
  });
}

test("sidebar follows the workspace theme", async ({page}) => {
  await mount(page, "/work", "light", 1440);
  const sidebar = page.locator("[data-shell-sidebar]");
  const light = await sidebar.evaluate(element => ({
    background: getComputedStyle(element).backgroundColor,
    color: getComputedStyle(element).color,
  }));

  await page.evaluate(() => { document.documentElement.dataset.theme = "dark"; });
  await expect.poll(() => sidebar.evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe(light.background);
  expect(await sidebar.evaluate(element => getComputedStyle(element).color)).not.toBe(light.color);
});

test("overview route uses the canonical topbar and sidebar", async ({page}) => {
  await mount(page, "/", "light", 1440);
  const shell = page.locator("[data-app-shell]");
  await expect(shell).toBeVisible();
  await expect(shell).not.toHaveClass(/workspace-shell/);
  expect((await page.locator("[data-shell-sidebar]").boundingBox())!.width).toBe(248);
  expect(await page.locator("[data-shell-sidebar] .sidebar-nav").evaluate(element => getComputedStyle(element).scrollbarWidth)).toBe("none");
});

declare global { interface Window { fixturePath: "/"|"/work"|"/work/kpi"; } }
