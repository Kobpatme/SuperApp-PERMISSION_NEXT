import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { build } from "esbuild";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Real presentation components, synthetic data, no server/database/credentials.
// Router and server actions are deliberately isolated: this is not authenticated UAT.
test.use({ launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {} });
const css = ["src/styles/tokens.css", "src/app/globals.css", "src/styles/shell.css", "src/styles/components.css", "src/styles/ui.css", "src/styles/notifications.css", "src/styles/work.css", "src/styles/auth.css", "src/styles/motion.css", "src/app/(platform)/buildings/permission-buildings.css", "src/features/buildings/map/building-map.css"];
let bundle: string;
const fonts = [['manrope','manrope'],['nunito','nunito'],['thai','noto-sans-thai'],['code','source-code-pro']].map(([name,file])=>`@font-face{font-family:fixture-${name};src:url(data:font/woff2;base64,${readFileSync(resolve(`src/app/fonts/${file}.woff2`)).toString('base64')}) format('woff2');font-weight:100 900}:root{--font-${name}:fixture-${name}}`).join('');
let moduleCss: string;
test.beforeAll(async () => {
  const result = await build({ stdin: { resolveDir: process.cwd(), loader: "tsx", contents: `
    import React from 'react'; import {createRoot} from 'react-dom/client';
    import {AppShell} from './src/components/app-shell';
    import {DashboardOverview} from './src/components/dashboard-overview';
    import {MyWorkDashboard} from './src/features/work/screens/my-work';
    import {BuildingsWorkspace} from './src/app/(platform)/buildings/buildings-workspace';
    import {TrackingWorkspace} from './src/modules/duct-rental/components/tracking-workspace';
    import {BuildingEditorForm} from './src/features/buildings/building-editor-form';
    import {TruncatedText} from './src/components/ui/truncated-text';
    import {ErrorState} from './src/components/ui/error-state';
    import {EmptyState} from './src/components/ui/empty-state';
    import {PageSkeleton} from './src/components/ui/page-skeleton';
    import {StatusBadge} from './src/components/ui/status-badge';
    import {EXTREME_THAI_NAME} from './src/lib/ui-fixtures';
    const source={moduleId:'work',status:'ready',itemCount:0,message:'ข้อมูลสมมติ'};
    const snapshot={generatedAt:'2026-10-23T10:00:00Z',items:[{id:'fixture-task',moduleId:'work',kind:'task',priority:'normal',title:EXTREME_THAI_NAME,description:'รายการสมมติสำหรับตรวจหน้าจอ',href:'/work/mine',statusLabel:'รอเริ่ม',ownerId:'fixture',ownerName:'ผู้ใช้ทดสอบ'}],sources:[source]};
    const model={generatedAt:snapshot.generatedAt,source,tasks:[{id:'fixture-task',title:EXTREME_THAI_NAME,description:null,status:'queued',statusLabel:'รอเริ่ม',priority:'normal',dueAt:null,completedAt:null,updatedAt:snapshot.generatedAt,ownerId:'fixture',ownerName:'ผู้ใช้ทดสอบ',teamId:null,teamName:'ทีมสมมติ',jobCode:'FIXTURE-001',mainKpi:null,subKpi:null,note:null,kpiWeight:null,version:1}],activities:[],items:snapshot.items,people:[],jobGroups:[],kpiCards:[],scores:[],facts:[],personalAssignments:[],assignmentOptions:[],kpiOptions:[],report:{taskCount:1,overdue:0,dueSoon:0,completion:null,sla:null}};
    const mode=window.fixtureMode;
    const content=mode==='dashboard'?<DashboardOverview displayName="ผู้ใช้ทดสอบ" userId="fixture" allowedModuleIds={['work','buildings','duct-rental']} developmentMode={false} preview={false} snapshot={snapshot}/>:
      mode==='work'?<MyWorkDashboard model={model} userId="fixture" canCreate={false}/>:
      mode==='buildings'?<BuildingsWorkspace buildings={[]} total={0}/>:
      mode==='duct'?<TrackingWorkspace/>:
      mode==='form'?<><h1>เพิ่มอาคาร</h1><BuildingEditorForm apiKey="" teams={[]} canCreateWithoutTeam/></>:
      <><h1>สถานะและองค์ประกอบกลาง</h1><div style={{width:180}}><TruncatedText text={EXTREME_THAI_NAME} lines={1}/></div><div className="ui-toolbar"><button className="primary" disabled>บันทึก</button><button className="secondary-action">ยกเลิก</button></div><StatusBadge label="สำเร็จ" tone="success"/><EmptyState title="ยังไม่มีรายการ" description="ลองเพิ่มรายการแรกได้เลย"/><ErrorState reset={()=>{window.fixtureReset=true}} embedded/><PageSkeleton shape="table"/></>;
    createRoot(document.getElementById('root')).render(<AppShell displayName="ผู้ใช้ทดสอบ" allowedModuleIds={['work','buildings','duct-rental']} workNavigation={[{href:'/work/mine',label:'งานของฉัน',icon:'check'}]} scopeLabel="ทีมของตน">{content}</AppShell>);
  ` }, bundle: true, write: false, outdir: "fixture-output", platform: "browser", jsx: "automatic", define: { "process.env.NODE_ENV": '"development"' }, plugins: [{ name: "isolated-presentation", setup(builder) {
    builder.onResolve({filter: /^next\/(link|navigation)$/}, args => ({path:args.path, namespace:"fixture"}));
    builder.onResolve({filter: /^@\/app\/.*actions$/}, () => ({path:"actions",namespace:"fixture"}));
    builder.onLoad({filter: /.*/,namespace:"fixture"}, args => ({loader:"tsx",resolveDir:process.cwd(),contents:args.path==='actions' ? 'export async function logoutAction(){throw new Error("Server action disabled in presentation fixture")} export const addWorkTaskNoteAction=logoutAction, deleteWorkTaskAction=logoutAction, editWorkTaskAction=logoutAction, transitionWorkTaskAction=logoutAction, createPersonalTaskAction=logoutAction, previewWorkDeadlineAction=logoutAction;' : args.path==='next/link' ? `import React from 'react';export default function Link({prefetch,...props}){return <a {...props}/>}` : `const router={push:(url)=>window.fixtureDestination=url,replace:()=>{},refresh:()=>{}};export function useRouter(){return router}export function useSearchParams(){return new URLSearchParams()}export function usePathname(){return '/'} `}));
  }}] });
  bundle = result.outputFiles.find(file=>file.path.endsWith('.js'))!.text;
  moduleCss = result.outputFiles.find(file=>file.path.endsWith('.css'))?.text ?? '';
});
async function mount(page: Page, mode = "shared", theme = "light", width = 1440) {
  await page.setViewportSize({width,height:900});
  await page.route('**/*', route => {
    const url=new URL(route.request().url());
    if(url.origin==='https://operational.test' && url.pathname==='/') return route.fulfill({contentType:'text/html',body:`<!doctype html><html lang="th" data-theme="${theme}"><head><title>ทดสอบการแสดงผล</title><style>${css.map(file=>readFileSync(resolve(file),'utf8')).join('\n')}${moduleCss}${fonts}</style></head><body><div id="root"></div></body></html>`});
    if(url.pathname.startsWith('/api/duct-rental/tracking')) return route.fulfill({json:{data:{counts:{total:0,completed:0,nearDue:0,overdue:0,active:0},rows:[],nextOffset:null}}});
    return route.abort();
  });
  await page.goto('https://operational.test/');
  await page.evaluate(mode=>Object.assign(window,{fixtureMode:mode}),mode);
  await page.addScriptTag({content:bundle});
  await expect(page.locator('main')).toBeVisible();
  await page.evaluate(async()=>{await document.fonts.ready;await new Promise<void>(done=>requestAnimationFrame(()=>requestAnimationFrame(()=>done())));await Promise.all(document.getAnimations().filter(animation=>animation.effect?.getComputedTiming().iterations!==Infinity).map(animation=>animation.finished.catch(()=>undefined)));});
}
async function axe(page: Page) {
  const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();
  expect(results.violations.map(({id,nodes})=>({id,targets:nodes.map(node=>node.target)}))).toEqual([]);
}
for(const theme of ['light','dark']) for(const width of [375,768,1024,1440]) {
  test(`Direction A and responsive ${theme} ${width}`,async({page},info)=>{
    await mount(page,'dashboard',theme,width);
    await page.screenshot({path:info.outputPath('dashboard.png'),fullPage:true});
    if(width>=1024) {
      expect(await page.locator('.workspace-sidebar').evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgb(15, 23, 42)');
      await expect(page.locator('.workspace-sidebar')).toBeVisible();
      expect(await page.locator('.workspace-sidebar').evaluate(el=>({left:el.getBoundingClientRect().left,width:el.getBoundingClientRect().width,transform:getComputedStyle(el).transform}))).toEqual({left:0,width:260,transform:'none'});
    } else {
      await page.getByRole('button',{name:'เปิดเมนูพื้นที่ทำงาน'}).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      expect(await page.getByRole('dialog').evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgb(15, 23, 42)');
      await axe(page);
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).not.toBeVisible();
      await expect(page.getByRole('button',{name:'เปิดเมนูพื้นที่ทำงาน'})).toBeFocused();
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await axe(page);
  });
  for(const mode of ['work','buildings','duct']) test(`${mode} responsive ${theme} ${width}`,async({page},info)=>{
    const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
    await mount(page,mode,theme,width);
    if(mode==='duct') await expect(page.locator('main')).toContainText('อัปเดตล่าสุด');
    await page.screenshot({path:info.outputPath(`${mode}.png`),fullPage:true});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await axe(page);expect(errors).toEqual([]);
  });
}
test('tooltip is keyboard reachable and dismissible without losing focus',async({page})=>{
  await mount(page);
  const text=page.locator('.truncated-text[tabindex="0"]').first();await text.focus();
  await expect(page.getByRole('tooltip')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('tooltip')).not.toBeVisible();await expect(text).toBeFocused();
});
test('account popover supports Escape and correct semantics',async({page})=>{
  await mount(page);const trigger=page.getByRole('button',{name:'บัญชีผู้ใช้ ผู้ใช้ทดสอบ'});
  await trigger.click();await expect(page.getByRole('button',{name:'ออกจากระบบ'})).toBeVisible();await axe(page);
  await page.keyboard.press('Escape');await expect(trigger).toHaveAttribute('aria-expanded','false');await expect(trigger).toBeFocused();
});
test('shared disabled state does not change on hover and error retry works',async({page})=>{
  await mount(page);const button=page.getByRole('button',{name:'บันทึก',exact:true});
  const before=await button.evaluate(el=>getComputedStyle(el).backgroundColor);await button.hover();
  expect(await button.evaluate(el=>getComputedStyle(el).backgroundColor)).toBe(before);
  await page.getByRole('button',{name:'ลองอีกครั้ง',exact:true}).click();
  expect(await page.evaluate(()=>Reflect.get(window,'fixtureReset'))).toBe(true);
});
test('command palette is keyboard operable and announces recovery without raw errors',async({page})=>{
  await mount(page);await page.keyboard.press('Control+k');const input=page.getByRole('combobox');await expect(input).toBeFocused();
  await page.keyboard.press('ArrowDown');await expect(input).toHaveAttribute('aria-activedescendant',/./);
  await page.keyboard.press('Enter');expect(await page.evaluate(()=>Reflect.get(window,'fixtureDestination'))).toBeTruthy();
  await page.keyboard.press('Control+k');await input.fill('ไม่พบข้อมูล');
  await expect(page.locator('.search-feedback')).toContainText('ค้นหารายการไม่สำเร็จ');
  await page.keyboard.press('Escape');await expect(input).toHaveAttribute('aria-expanded','false');
});
for(const theme of ['light','dark']) test(`form validation and recovery ${theme}`,async({page})=>{
  await mount(page,'form',theme,375);
  await page.getByRole('button',{name:'บันทึกข้อมูล',exact:true}).click();
  await expect(page.locator('[name=nameTh]')).toBeFocused();
  await expect(page.locator('[name=nameTh]')).toHaveAttribute('aria-describedby','building-editor-error');
  await page.locator('[name=nameTh]').fill('อาคารสมมติ');
  await page.locator('[name=damage_deposit]').fill('-1');
  await page.getByRole('button',{name:'บันทึกข้อมูล',exact:true}).click();
  await expect(page.locator('[name=damage_deposit]')).toBeFocused();
  await expect(page.locator('[name=damage_deposit]')).toHaveAttribute('aria-describedby','building-editor-error');
  await axe(page);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('[name=damage_deposit]').fill('123456789');
  await page.route('**/api/buildings',route=>route.fulfill({status:500,json:{error:'SQL internal detail must not be displayed'}}));
  await page.getByRole('button',{name:'บันทึกข้อมูล',exact:true}).click();
  await expect(page.locator('#building-editor-error')).toContainText('บันทึกไม่สำเร็จ');
  await expect(page.locator('body')).not.toContainText('SQL internal detail');
  await expect(page.locator('[name=nameTh]')).toHaveValue('อาคารสมมติ');
  await page.route('**/api/buildings',route=>route.fulfill({status:201,json:{id:'synthetic-id'}}));
  await page.getByRole('button',{name:'บันทึกข้อมูล',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>Reflect.get(window,'fixtureDestination'))).toBe('/buildings/synthetic-id?saved=1');
});
test('collapsed rail keeps its saved geometry and readable keyboard destinations',async({page})=>{
  await mount(page,'dashboard');
  await page.getByRole('button',{name:'ยุบเมนูด้านข้าง'}).click();
  expect(await page.locator('.workspace-sidebar').evaluate(el=>el.getBoundingClientRect().width)).toBe(80);
  expect(await page.locator('main').evaluate(el=>el.getBoundingClientRect().left)).toBe(80);
  await axe(page);
});
for(const mode of ['dashboard','work','buildings','duct','form']) test(`reflow and touch targets ${mode}`,async({page})=>{
  await mount(page,mode,'light',320);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const small=await page.locator('main :is(button,input:not([type=checkbox]):not([type=radio]),select,textarea), .top-actions button').evaluateAll(elements=>elements.filter(el=>el.getClientRects().length && getComputedStyle(el).visibility!=='hidden' && !el.closest('[hidden]')).filter(el=>el.getBoundingClientRect().height<43.9).map(el=>({tag:el.tagName,text:el.textContent?.slice(0,40),height:el.getBoundingClientRect().height})));
  expect(small).toEqual([]);
  if(mode==='dashboard') expect(await page.locator('.page-heading-actions button').evaluate(el=>el.getBoundingClientRect().height)).toBe(44);
});
