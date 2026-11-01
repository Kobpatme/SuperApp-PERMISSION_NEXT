import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { build } from "esbuild";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

// Real route components, real CSS/fonts, explicit TEST models. No auth/server acceptance.
test.use({ launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {} });
const evidence = resolve("docs/quality/work");
const css = ["src/styles/tokens.css", "src/app/globals.css", "src/styles/shell.css", "src/styles/components.css", "src/styles/ui.css", "src/styles/notifications.css", "src/styles/work.css", "src/styles/auth.css", "src/styles/motion.css"].map(p => readFileSync(resolve(p), "utf8")).join("\n");
const fonts = [["manrope", "manrope"], ["nunito", "nunito"], ["thai", "noto-sans-thai"], ["code", "source-code-pro"]].map(([name, file]) => `@font-face{font-family:fixture-${name};src:url(data:font/woff2;base64,${readFileSync(resolve(`src/app/fonts/${file}.woff2`)).toString("base64")}) format('woff2');font-weight:100 900}:root{--font-${name}:fixture-${name}}`).join("");
const routes = ["/work", "/work/mine", "/work/new", "/work/team", "/work/assign", "/work/people", "/work/tracker", "/work/kpi", "/work/reports"];
const titles = ["ภาพรวมงานของฉัน", "งานของฉัน", "เพิ่มงาน", "ภาพรวมทีม", "ศูนย์มอบหมายงาน", "บุคลากร", "Job Tracker", "KPI ของฉัน", "รายงานงาน"];
let script = "", moduleCss = "";

test.beforeAll(async () => {
  mkdirSync(evidence, { recursive: true });
  const result = await build({ bundle: true, write: false, outdir: "fixture-output", platform: "browser", jsx: "automatic", define: { "process.env.NODE_ENV": '"development"' }, stdin: { loader: "tsx", resolveDir: process.cwd(), contents: `
import React from 'react'; import {createRoot} from 'react-dom/client';
import {AppShell} from './src/components/app-shell';
import {WorkRoutePage} from './src/components/work-route-page';
import Main from './src/app/(platform)/work/page';
${routes.slice(1).map((route, i) => `import Route${i} from './src/app/(platform)${route}/page';`).join("\n")}
const now='2026-11-01T03:00:00Z';
const statuses=['queued','in_progress','blocked','completed','cancelled'];
const labels=['รอรับงาน','กำลังทำ','พักงาน','เสร็จสิ้น','ยกเลิก'];
const tasks=Array.from({length:12},(_,i)=>({id:'TEST-task-'+i,title:'TEST ตรวจสอบเอกสารและประสานงานอาคาร '+String(i).padStart(2,'0'),description:'ข้อมูลทดสอบเท่านั้น ไม่ใช่งานจริง',status:statuses[i%5],statusLabel:labels[i%5],priority:'normal',dueAt:'2026-10-30T03:00:00Z',completedAt:i%5===3?now:null,updatedAt:now,ownerId:'TEST-user',ownerName:'ผู้ใช้ทดสอบ',teamId:'TEST-team',teamName:'ทีมทดสอบ',jobCode:'TEST-JOB-'+i,mainKpi:'คุณภาพ',subKpi:'Open PR',note:'บันทึก TEST',notes:[{id:'TEST-note',body:'บันทึกที่มีอยู่',createdAt:now}],timeline:[],kpiWeight:'25%',version:1,extraData:{},ownerOptions:[],kpiOptions:[]}));
const state=new URLSearchParams(location.search).get('fixtureState');
const model={generatedAt:now,source:{moduleId:'work',status:state==='unavailable'?'unavailable':'ready',itemCount:tasks.length,message:'TEST แหล่งข้อมูลยังไม่พร้อม'},tasks:state==='empty'?[]:tasks,activities:state==='empty'?[]:[{id:'TEST-event',eventLabel:'อัปเดตงานทดสอบ',ownerName:'ผู้ใช้ทดสอบ',occurredAt:now,entityId:'TEST-task-1'}],items:[],people:state==='empty'?[]:[{id:'TEST-user',name:'ผู้ใช้ทดสอบ',positionName:'เจ้าหน้าที่',teamName:'ทีมทดสอบ',weightedPerformance:92,total:12,pending:3,inProgress:3,onHold:2,completed:2,overdue:4}],jobGroups:state==='empty'?[]:[{key:'TEST-JOB',label:'TEST-JOB งานตรวจอาคาร',hasJobCode:true,tasks:[tasks[1]]}],kpiCards:state==='empty'?[]:[{id:'TEST-kpi',metric:'คุณภาพเอกสาร TEST',actual:'92',unit:'%',target:'90%',progress:100,periodStart:'2026-10-01',periodEnd:'2026-10-31',factCount:12,weight:'25%',calculatedAt:now}],scores:[],facts:state==='empty'?[]:[{id:'TEST-fact',metric:'คุณภาพเอกสาร TEST',value:'92',status:'applied',occurredAt:now,calculationVersion:'TEST-v1'}],personalAssignments:state==='empty'?[]:[{name:'คุณภาพ',weight:25,version:1,enabled:true}],assignmentOptions:state==='empty'?[]:[{id:'TEST-user',name:'ผู้ใช้ทดสอบ',teamId:'TEST-team',teamName:'ทีมทดสอบ'}],kpiOptions:[{id:'TEST-rule',teamId:'TEST-team',mainKpi:'คุณภาพ',subKpi:'Open PR'}],report:{taskCount:state==='empty'?0:12,overdue:4,dueSoon:2,completion:20,sla:92},statusCounts:{'รอรับงาน':3,'กำลังทำ':3,'พักงาน':2,'เสร็จสิ้น':2,'ยกเลิก':2},weightedReport:{totalWeight:'300'},creationKey:'TEST-create-key'};
const subject={userId:'TEST-user',teamIds:['TEST-team'],grants:['work.task.update','work.task.manage','work.task.delete','work.task.assign','work.task.create','work.note.create','work.task.read','kpi.score.read','kpi.team.read','work.report.read','activity.event.read'].map(permission=>({permission,scope:'ALL'}))};
window.TESTmodel=model; window.TESTaccess={allowed:state!=='denied',userId:'TEST-user',subject:state==='readonly'?undefined:subject,permissions:subject.grants.map(g=>g.permission)};window.TESTcommands=[];window.TESTresolvers=[];
const root=createRoot(document.getElementById('root')); const pages={'/work':Main,${routes.slice(1).map((r,i)=>`'${r}':Route${i}`).join(',')}};
async function render(){const page=pages[location.pathname]||Main;let content=await page({searchParams:Promise.resolve(Object.fromEntries(new URLSearchParams(location.search)))});if(content.type===WorkRoutePage) content=await WorkRoutePage(content.props);root.render(<AppShell displayName="TEST ผู้ใช้ทดสอบ" allowedModuleIds={['work']} workNavigation={${JSON.stringify(routes.map((href,i)=>({href,label:titles[i],icon:'work'})))}}>{content}</AppShell>);}
window.TESTrender=render;render();
` }, plugins: [{ name: "work-test-boundaries", setup(builder) {
    builder.onResolve({ filter: /^next\/(link|navigation)$/ }, args => ({ path: args.path, namespace: "TEST" }));
    builder.onResolve({ filter: /^@\/app\/.*actions$/ }, () => ({ path: "actions", namespace: "TEST" }));
    builder.onResolve({ filter: /^@\/lib\/(access|work-read-model|work-page-data|env)$/ }, () => ({ path: "data", namespace: "TEST" }));
    builder.onLoad({ filter: /.*/, namespace: "TEST" }, args => ({ loader: "tsx", resolveDir: process.cwd(), contents:
      args.path === "data" ? `export function getServerEnv(){return {SUPPORT_CONTACT_TEXT:"TEST ผู้ดูแลระบบ"}} export async function getAccessContext(){return window.TESTaccess} export async function getWorkReadModel(){return window.TESTmodel} export async function loadWorkPage(){return window.TESTaccess.allowed?{model:window.TESTmodel,access:window.TESTaccess,filters:{}}:null}` :
      args.path === "actions" ? `async function command(previous,data){window.TESTcommands.push(Object.fromEntries(data));return new Promise(resolve=>window.TESTresolvers.push(resolve))}export const createPersonalTaskAction=command,previewWorkDeadlineAction=command,assignWorkTasksAction=command,addWorkTaskNoteAction=command,transitionWorkTaskAction=command,editWorkTaskAction=command,deleteWorkTaskAction=command;export async function logoutAction(){throw Error('Disabled in TEST fixture')}` :
      args.path === "next/link" ? `import React from'react';export default function Link({prefetch,...props}){return <a {...props}/>} ` :
      `import {useSyncExternalStore} from'react';function subscribe(fn){addEventListener('popstate',fn);return()=>removeEventListener('popstate',fn)}export function useSearchParams(){const value=useSyncExternalStore(subscribe,()=>location.search);return new URLSearchParams(value)}export function usePathname(){return location.pathname}export function useRouter(){return {push:url=>{history.pushState({},'',url);dispatchEvent(new PopStateEvent('popstate'));window.TESTrender()},replace:url=>{history.replaceState({},'',url);dispatchEvent(new PopStateEvent('popstate'));window.TESTrender()},refresh:()=>{window.TESTrefreshes=(window.TESTrefreshes||0)+1}}}export function notFound(){throw Error('TEST_NOT_FOUND')}`
    }));
  }}] });
  script = result.outputFiles.find(f => f.path.endsWith('.js'))!.text;
  moduleCss = result.outputFiles.find(f => f.path.endsWith('.css'))?.text ?? '';
});

async function mount(page: Page, route: string, theme = 'light', width = 1440) {
  await page.setViewportSize({ width, height: 1000 });
  await page.route('https://work-client.test/**', r => r.fulfill({ contentType: 'text/html', body: `<!doctype html><html lang="th" data-theme="${theme}"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>TEST Work client fixture</title><style>${css}${moduleCss}${fonts}</style></head><body><div id="root"></div></body></html>` }));
  await page.goto('https://work-client.test' + route);
  await page.evaluate(value => localStorage.setItem('permission-next-workspace-theme', value), theme);
  page.on('pageerror', error => console.log('TEST pageerror:', error.message));
  await page.addScriptTag({ content: script });
  await expect(page.locator('[data-app-shell]')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all(document.getAnimations().filter(a => a.effect?.getComputedTiming().iterations !== Infinity).map(a => a.finished.catch(() => {}))); });
}
async function snapshot(page: Page, name: string) { await page.evaluate(()=>window.scrollTo(0,0)); await page.screenshot({ path: resolve(evidence, name + '.png'), fullPage: !/dialog|modal/.test(name) }); }
async function resolveCommand(page: Page, ok: boolean) { await page.evaluate(value => (window as unknown as {TESTresolvers: ((result: object) => void)[]}).TESTresolvers.shift()?.({ok:value,message:value?'TEST บันทึกสำเร็จ':'TEST ข้อมูลเปลี่ยนแปลง กรุณาลองอีกครั้ง'}), ok); }

for (const [i, route] of routes.entries()) for (const [theme, width] of [['light',1440], ['dark',1440], ['light',390]] as const) {
  test(`${route} ${theme} ${width}: actual route controls, reflow, axe`, async ({ page }) => {
    const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
    await mount(page, route, theme, width);
    await expect(page.getByRole('heading', {level:1,name:titles[i],exact:true})).toBeVisible();
    if (!['/work','/work/new'].includes(route)) {
      const filter = page.getByRole('form', {name:'ตัวกรองงาน'});
      await expect(filter.getByRole('searchbox')).toBeVisible();
      await filter.locator('summary').click();
      await expect(filter.getByRole('spinbutton',{name:'ปี',exact:true})).toBeVisible();
      for (const name of ['เดือน','สถานะ','ทีม','แหล่งที่มา']) await expect(filter.getByRole('combobox',{name,exact:true})).toBeVisible();
      await expect(filter.getByRole('link',{name:'ล้างตัวกรอง'})).toHaveAttribute('href',route);
      await filter.locator('summary').click();
    }
    if (route==='/work/mine') { await page.getByLabel('เรียงตาม').selectOption('title'); await page.getByRole('button',{name:'หน้าถัดไป'}).click(); await expect(page.locator('tbody tr')).toHaveCount(2); await page.getByLabel('แสดงต่อหน้า').selectOption('25'); await expect(page.locator('tbody tr')).toHaveCount(12); }
    if (route==='/work/people') await expect(page.getByRole('link',{name:'ดูงานของคนนี้'})).toHaveAttribute('href','/work/tracker?owner=TEST-user');
    if (route==='/work/tracker') { await page.getByRole('searchbox',{name:/ค้นหา Job code/}).fill('ไม่พบ TEST'); await expect(page.getByRole('button',{name:/TEST-JOB งานตรวจอาคาร/})).toHaveCount(0); await page.getByRole('searchbox',{name:/ค้นหา Job code/}).fill('TEST-JOB'); await page.getByRole('button',{name:/TEST-JOB งานตรวจอาคาร/}).click(); await expect(page.getByText('บันทึกและประวัติ',{exact:true})).toBeVisible(); }
    if (route==='/work/kpi') { await expect(page.getByRole('progressbar')).toHaveAttribute('value','100'); await page.getByText('เปิดรายละเอียดตรวจสอบ',{exact:true}).click(); await expect(page.getByRole('cell',{name:'TEST-v1'})).toBeVisible(); }
    if (route==='/work/reports') { await expect(page.getByRole('link',{name:'Export CSV'})).toHaveAttribute('href',/\/api\/work\/export\?/); await expect(page.getByRole('button',{name:'พิมพ์',exact:true})).toBeVisible(); }
    if (['/work/new','/work/assign'].includes(route)) { await expect(page.locator('form.work-assignment-form fieldset legend')).toBeVisible(); await expect(page.getByRole('button',{name:'ดู deadline ล่วงหน้า'})).toBeVisible(); }
    if(width===390) expect(await page.locator('#workspace-content .work-action-row button, #workspace-content .work-action-row a').evaluateAll(elements=>elements.every(e=>e.getBoundingClientRect().height>=44))).toBe(true);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const axe = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();
    writeFileSync(resolve(evidence, `axe-${route.split('/').pop()||'work'}-${theme}-${width}.json`),JSON.stringify(axe.violations,null,2));
    const workAxe = await new AxeBuilder({page}).include('#workspace-content').withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();
    expect(workAxe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
    expect(errors).toEqual([]);
    if(theme==='light'&&width===1440 || route==='/work/kpi'&&theme==='dark' || width===390&&['/work/new','/work/people','/work/tracker','/work/reports'].includes(route)) await snapshot(page,`${route.replaceAll('/','-').slice(1)}-${theme}-${width}`);
    expect(axe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
  });
}

for (const state of ['empty','unavailable','denied']) for (const route of routes) test(`${route} ${state} fixture branch`,async({page})=>{
  await mount(page,route+'?fixtureState='+state);
  if(state==='denied') { await expect(page.getByText(/ยังไม่มีสิทธิ์|ไม่ได้รับสิทธิ์|ไม่มีสิทธิ์/).first()).toBeVisible(); return; }
  if(route==='/work/new') { await expect(page.getByRole('button',{name:'เพิ่มงาน',exact:true})).toBeVisible(); return; } // Existing create has no unavailable guard; remains OPEN.
  await expect(page.locator(state==='empty'?'.work-state-empty':'.work-state-unavailable')).toBeVisible();
});

for (const [view, title] of [['mine','ภาพรวมงานของฉัน'],['mine-list','งานของฉัน'],['team','ภาพรวมทีม'],['assign','ศูนย์มอบหมายงาน'],['people','บุคลากร'],['tracker','Job Tracker'],['kpi','KPI ของฉัน'],['reports','รายงานงาน'],['activity','กิจกรรมงาน'],['due','งานที่ควรเร่ง']]) test(`query view=${view} dispatch preserved`,async({page})=>{
 await mount(page,'/work?view='+view);await expect(page.getByRole('heading',{level:1,name:title,exact:true})).toBeVisible();
});

test('task detail edit / all transitions / delete use shared modal, keyboard and pending',async({page})=>{
 await mount(page,'/work?record=TEST-task-1','dark',390);
 await expect(page.locator('.work-task-detail')).toBeVisible();
 for(const name of ['พักงาน','เสร็จสิ้น','ยกเลิกงาน','แก้ไขงาน','ลบงาน']) {
   const trigger=page.getByRole('button',{name,exact:true});await trigger.click();const dialog=page.getByRole('dialog',{name,exact:true});await expect(dialog).toBeVisible();
   if(name==='เสร็จสิ้น') {await expect(dialog.getByLabel('Fund Number')).toBeVisible();await expect(dialog.getByLabel('จำนวนเงิน')).toHaveAttribute('step','0.01');}
   if(name==='แก้ไขงาน') for(const label of ['ชื่องาน','รหัสงาน','รายละเอียด','Main KPI','Sub KPI','ผู้รับผิดชอบ','กฎ KPI ใหม่','SSR Number','OSP Number','กำหนดส่ง','ความสำคัญ']) await expect(label==='กำหนดส่ง'?dialog.locator('input[type="date"]'):dialog.getByRole(['ผู้รับผิดชอบ','กฎ KPI ใหม่','ความสำคัญ'].includes(label)?'combobox':'textbox',{name:label,exact:true})).toBeVisible();
   if(name==='พักงาน') {
      await dialog.getByLabel('เหตุผล / ความคืบหน้า').fill('TEST รอเอกสาร');await dialog.getByRole('button',{name:'ยืนยัน',exact:true}).click();await expect(dialog.getByRole('button',{name:'กำลังบันทึก…'})).toBeDisabled();await page.keyboard.press('Escape');await expect(dialog).toBeVisible();await resolveCommand(page,false);await expect(dialog.getByRole('status')).toContainText('TEST ข้อมูลเปลี่ยนแปลง');await expect(dialog.getByRole('textbox',{name:'เหตุผล / ความคืบหน้า'})).toHaveValue('TEST รอเอกสาร');await snapshot(page,'task-dialog-mobile-dark-error');
   }
   await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await expect(trigger).toBeFocused();
 }
 await page.getByLabel('เพิ่มบันทึก',{exact:true}).fill('TEST บันทึกใหม่');await page.getByRole('button',{name:'เพิ่มบันทึก',exact:true}).click();await expect(page.getByRole('button',{name:'กำลังบันทึก…'})).toBeDisabled();await resolveCommand(page,true);await expect(page.getByRole('status').last()).toContainText('TEST บันทึกสำเร็จ');
});

test('queued accept and blocked resume preserve task payload and success close',async({page})=>{
 for(const [id,name] of [['0','รับงาน'],['2','ดำเนินการต่อ']]) {
   await mount(page,'/work?record=TEST-task-'+id);await page.getByRole('button',{name,exact:true}).click();const dialog=page.getByRole('dialog',{name,exact:true});await dialog.getByRole('button',{name:'ยืนยัน',exact:true}).click();await resolveCommand(page,true);await expect(dialog).not.toBeVisible();
   expect(await page.evaluate(()=> (window as unknown as {TESTcommands:Record<string,string>[]}).TESTcommands[0])).toMatchObject({taskId:'TEST-task-'+id,version:'1',toStatus:'in_progress'});
 }
});

test('create and assignment actual styled forms preserve failure drafts and reset after success',async({page})=>{
 for(const route of ['/work/new','/work/assign']) {
  await mount(page,route,'light',390);
  const form=page.locator('form.work-assignment-form');
  await form.locator('[name="teamId"]').selectOption('TEST-team');
  if(route==='/work/assign') {await form.locator('[name="assigneeId"]').selectOption('TEST-user');await form.locator('[name="title"]').fill('TEST ชุดงาน');}
  await form.locator('[name="mainKpi"]').selectOption('คุณภาพ');await form.locator('[name="subKpi"]').selectOption('Open PR');await form.locator('[name="jobs"]').fill('TEST งานใหม่');await form.locator('[name="notes"]').fill('TEST เก็บบันทึก');
  await form.getByRole('button',{name:'ดู deadline ล่วงหน้า'}).click();await expect(form.locator('[name="jobs"]')).toBeDisabled();await resolveCommand(page,true);await expect(form.locator('[name="jobs"]')).toBeEnabled();await expect(form.locator('[name="jobs"]')).toHaveValue('TEST งานใหม่');
  await form.getByRole('button',{name:route==='/work/new'?'เพิ่มงาน':'มอบหมายงาน',exact:true}).click();await expect(form.locator('[name="jobs"]')).toBeDisabled();await resolveCommand(page,false);await expect(form.locator('[name="jobs"]')).toHaveValue('TEST งานใหม่');await expect(form.locator('[name="subKpi"]')).toHaveValue('Open PR');await expect(form.locator('[name="notes"]')).toHaveValue('TEST เก็บบันทึก');
  await form.getByRole('button',{name:route==='/work/new'?'เพิ่มงาน':'มอบหมายงาน',exact:true}).click();await resolveCommand(page,true);await expect(form.locator('[name="jobs"]')).toHaveValue('');await expect(form.locator('[name="subKpi"]')).toHaveValue('');
 }
});

test('styled create modal retains dirty draft on cancel, traps focus and discards deliberately',async({page})=>{
 await mount(page,'/work','light',390);await page.getByRole('button',{name:'เพิ่มงาน',exact:true}).click();const dialog=page.getByRole('dialog',{name:'เพิ่มงานใหม่',exact:true});await dialog.locator('[name="jobs"]').fill('TEST ร่าง');await dialog.evaluate(async element=>{await Promise.all(element.getAnimations().map(a=>a.finished.catch(()=>{})));element.scrollTop=0;});const bounds=await dialog.boundingBox();expect(bounds!.x).toBeGreaterThanOrEqual(0);expect(bounds!.y).toBeGreaterThanOrEqual(0);expect(bounds!.x+bounds!.width).toBeLessThanOrEqual(390);expect(bounds!.y+bounds!.height).toBeLessThanOrEqual(1000);await snapshot(page,'create-modal-mobile-light');await dialog.getByRole('button',{name:'เพิ่มงาน',exact:true}).scrollIntoViewIfNeeded();await expect(dialog.getByRole('button',{name:'เพิ่มงาน',exact:true})).toBeInViewport();await page.keyboard.press('Escape');const confirm=page.getByRole('dialog',{name:'ทิ้งข้อมูลที่กรอกไว้หรือไม่'});await expect(confirm).toBeVisible();await confirm.getByRole('button',{name:'ยกเลิก',exact:true}).click();await expect(dialog.locator('[name="jobs"]')).toHaveValue('TEST ร่าง');await page.keyboard.press('Tab');expect(await page.evaluate(()=>document.activeElement?.closest('dialog')?.getAttribute('open'))).not.toBeNull();await page.keyboard.press('Escape');await confirm.getByRole('button',{name:'ทิ้งข้อมูล',exact:true}).click();await expect(dialog).not.toBeVisible();await expect(page.getByRole('button',{name:'เพิ่มงาน',exact:true})).toBeFocused();
});

test('work hover/action contrast and narrow reflow remain readable',async({page})=>{
 for(const theme of ['light','dark']) {
  await mount(page,'/work?record=TEST-task-1',theme);await page.getByRole('button',{name:'พักงาน',exact:true}).click();const dialog=page.getByRole('dialog',{name:'พักงาน',exact:true});const action=dialog.getByRole('button',{name:'ยืนยัน',exact:true});await action.hover();
  const ratio=await action.evaluate(element=>{const style=getComputedStyle(element);const luminance=(color:string)=>{const values=color.match(/[0-9.]+/g)!.slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return .2126*values[0]+.7152*values[1]+.0722*values[2]};const a=luminance(style.color),b=luminance(style.backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)});expect(ratio).toBeGreaterThanOrEqual(4.5);
  const axe=await new AxeBuilder({page}).include('dialog[open]').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(axe.violations).toEqual([]);writeFileSync(resolve(evidence,'dialog-contrast-'+theme+'.json'),JSON.stringify({hoverRatio:ratio,violations:axe.violations},null,2));
 }
 for(const route of routes) {await mount(page,route,'light',320);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
});

test('shared shell brand mark uses the rendered semantic pair in light and dark', async ({page}) => {
 for (const theme of ['light','dark']) {
  await mount(page, '/work', theme);
  const result = await page.locator('.app_shell_brandMark').evaluate(element => {
   const luminance = (color: string) => {
    const values = color.match(/[0-9.]+/g)!.slice(0, 3).map(Number).map(value => { value /= 255; return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4; });
    return .2126 * values[0] + .7152 * values[1] + .0722 * values[2];
   };
   const style = getComputedStyle(element);
   const foreground = luminance(style.color);
   const background = luminance(style.backgroundColor);
   return { color: style.color, backgroundColor: style.backgroundColor, ratio: (Math.max(foreground, background) + .05) / (Math.min(foreground, background) + .05) };
  });
  expect(result.ratio, `${theme} rendered brand mark pair`).toBeGreaterThanOrEqual(4.5);
 }
});

test('read-only detail exposes no task mutation controls',async({page})=>{
 await mount(page,'/work?record=TEST-task-1&fixtureState=readonly');await expect(page.locator('.work-task-detail .work-action-row')).toHaveCount(0);await expect(page.getByText('บัญชีนี้มีสิทธิ์ดูรายละเอียด แต่ยังไม่มีสิทธิ์เปลี่ยนแปลงงาน')).toBeVisible();
});
