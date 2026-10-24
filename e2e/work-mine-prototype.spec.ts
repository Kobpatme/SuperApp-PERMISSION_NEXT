import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { build } from "esbuild";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Component regression only. Actual authenticated screenshots are a separate acceptance gate.
test.use({ launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {} });
let script: string;
let moduleCss: string;
const css = ["src/styles/tokens.css","src/app/globals.css","src/styles/shell.css","src/styles/components.css","src/styles/ui.css","src/styles/notifications.css","src/styles/work.css","src/styles/auth.css","src/styles/motion.css"].map(file=>readFileSync(file,"utf8")).join("\n");
const fonts = [['manrope','manrope'],['nunito','nunito'],['thai','noto-sans-thai'],['code','source-code-pro']].map(([name,file])=>`@font-face{font-family:fixture-${name};src:url(data:font/woff2;base64,${readFileSync(`src/app/fonts/${file}.woff2`).toString('base64')}) format('woff2');font-weight:100 900}:root{--font-${name}:fixture-${name}}`).join('');
test.beforeAll(async()=>{
  const result=await build({stdin:{resolveDir:process.cwd(),loader:"tsx",contents:`
    import React from 'react';import{createRoot}from'react-dom/client';
    import{AppShell}from'./src/components/app-shell';import{MyTasksWorkspace}from'./src/features/work/screens/my-tasks-workspace';import{WorkFiltersForm}from'./src/features/work/components/work-filters';
    const tasks=Array.from({length:23},(_,i)=>({id:'synthetic-'+i,title:'ตรวจสอบเอกสารและประสานงานอาคารเพื่อเตรียมความพร้อมสำหรับทีมบริการ '+i,description:null,status:i%3===0?'completed':i%3===1?'in_progress':'queued',statusLabel:i%3===0?'เสร็จสิ้น':i%3===1?'กำลังทำ':'รอรับงาน',priority:'normal',dueAt:null,completedAt:null,updatedAt:'2026-10-23T10:00:00Z',ownerId:'synthetic-user',ownerName:'ผู้ใช้ทดสอบ',teamId:null,teamName:'ทีมสมมติ',jobCode:'JOB-'+i,mainKpi:'งานประสานงาน',subKpi:'ตรวจเอกสาร',note:null,kpiWeight:null,version:1}));
    const model={source:{moduleId:'work',status:'ready',itemCount:23,message:''},tasks,assignmentOptions:[]};
    createRoot(document.getElementById('root')).render(<AppShell displayName="ผู้ใช้ทดสอบ" allowedModuleIds={['work','buildings','guarantees','duct-rental','car-booking']} canAdmin workNavigation={[{href:'/work',label:'ภาพรวมงาน',icon:'work'},{href:'/work/mine',label:'งานของฉัน',icon:'check'},{href:'/work/new',label:'เพิ่มงาน',icon:'info'}]} scopeLabel="ทีมของตน"><MyTasksWorkspace model={model} userId="synthetic-user" canCreate filters={<WorkFiltersForm filters={{}} model={model} appearance="workspace"/>}/></AppShell>);
  `},bundle:true,write:false,outdir:"fixture-output",platform:"browser",jsx:"automatic",define:{"process.env.NODE_ENV":'"development"'},plugins:[{name:"presentation-boundaries",setup(builder){
    builder.onResolve({filter:/^next\/(link|navigation)$/},args=>({path:args.path,namespace:"fixture"}));
    builder.onResolve({filter:/^@\/app\/.*actions$/},()=>({path:"actions",namespace:"fixture"}));
    builder.onLoad({filter:/.*/,namespace:"fixture"},args=>({loader:"tsx",resolveDir:process.cwd(),contents:args.path==="actions"?'export async function logoutAction(){throw new Error("Server mutations are disabled in the component fixture")}export const addWorkTaskNoteAction=logoutAction,deleteWorkTaskAction=logoutAction,editWorkTaskAction=logoutAction,transitionWorkTaskAction=logoutAction;':args.path==="next/link"?`import React from'react';export default function Link({prefetch,...props}){return <a {...props}/>}`:`export function usePathname(){return '/work/mine'}export function useSearchParams(){return new URLSearchParams()}export function useRouter(){return {push:()=>{},replace:()=>{},refresh:()=>{}}}`}));
  }}]});
  script=result.outputFiles.find(file=>file.path.endsWith('.js'))!.text;moduleCss=result.outputFiles.find(file=>file.path.endsWith('.css'))!.text;
});
async function mount(page:Page,theme:string,width:number){
  await page.setViewportSize({width,height:1000});
  await page.route('**/*',route=>route.request().url()==='https://prototype.test/'?route.fulfill({contentType:'text/html',body:`<!doctype html><html lang="th" data-theme="${theme}"><head><title>ทดสอบ UI งานของฉัน</title><style>${css}${moduleCss}${fonts}</style></head><body><div id="root"></div></body></html>`}):route.abort());
  await page.goto('https://prototype.test/');await page.evaluate(theme=>localStorage.setItem('permission-next-workspace-theme',theme),theme);await page.addScriptTag({content:script});
  await expect(page.locator('[data-work-mine-prototype]')).toBeVisible();
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all(document.getAnimations().filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));});
}
for(const theme of ['light','dark'])for(const width of [375,768,1440])test(`mine ${theme} ${width}`,async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await mount(page,theme,width);
  await expect(page.getByRole('heading',{name:'งานของฉัน',exact:true})).toBeVisible();
  await expect(page.locator('tbody tr')).toHaveCount(10);
  if(width>=1000){const header=page.locator('main header').first();const action=page.getByRole('link',{name:'เพิ่มงานใหม่',exact:true});expect(Math.abs((await header.boundingBox())!.x+(await header.boundingBox())!.width-(await action.boundingBox())!.x-(await action.boundingBox())!.width)).toBeLessThanOrEqual(2);}
  const overflow=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,offenders:[...document.querySelectorAll('body *')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.right>innerWidth+1&&!el.closest('[role="region"]')}).slice(0,12).map(el=>({tag:el.tagName,cls:el.className,right:el.getBoundingClientRect().right,width:el.getBoundingClientRect().width}))}));
  expect(overflow.scroll,JSON.stringify(overflow)).toBeLessThanOrEqual(overflow.width);
  const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();
  expect(results.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
  await page.screenshot({path:info.outputPath('component-fixture.png'),fullPage:true});
  await page.getByRole('button',{name:'หน้าถัดไป',exact:true}).click();await expect(page.locator('main')).toContainText('แสดง 11–20');
  await page.getByRole('combobox',{name:'แสดงต่อหน้า'}).selectOption('25');await expect(page.locator('tbody tr')).toHaveCount(23);
  await page.getByText('ตัวกรองเพิ่มเติม',{exact:false}).click();await expect(page.getByRole('combobox',{name:'สถานะ',exact:true})).toBeVisible();
  if(width<=900){await page.getByRole('button',{name:'เปิดเมนูพื้นที่ทำงาน'}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'เปิดเมนูพื้นที่ทำงาน'})).toBeFocused();}
  await page.getByRole('button',{name:theme==='light'?'เปลี่ยนเป็นโหมดมืด':'เปลี่ยนเป็นโหมดสว่าง'}).click();
  await expect.poll(()=>page.evaluate(()=>document.documentElement.dataset.theme)).toBe(theme==='light'?'dark':'light');
  expect(errors).toEqual([]);
});
