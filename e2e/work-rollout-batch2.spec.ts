import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { build } from "esbuild";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

test.use({ launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {} });
const globalCss = ["src/styles/tokens.css","src/app/globals.css","src/styles/shell.css","src/styles/components.css","src/styles/ui.css","src/styles/notifications.css","src/styles/work.css","src/styles/auth.css","src/styles/motion.css"].map(file=>readFileSync(resolve(file),"utf8")).join("\n");
const fonts = [["manrope","manrope"],["nunito","nunito"],["thai","noto-sans-thai"],["code","source-code-pro"]].map(([name,file])=>`@font-face{font-family:fixture-${name};src:url(data:font/woff2;base64,${readFileSync(resolve(`src/app/fonts/${file}.woff2`)).toString("base64")}) format('woff2');font-weight:100 900}:root{--font-${name}:fixture-${name}}`).join("");
let script:string; let moduleCss="";

test.beforeAll(async()=>{
 const result=await build({stdin:{resolveDir:process.cwd(),loader:"tsx",contents:`
 import React from 'react'; import {createRoot} from 'react-dom/client';
 import {AppShell} from './src/components/app-shell';
 import {TeamCommandScreen} from './src/features/work/screens/team-command';
 import {AssignmentCenterScreen} from './src/features/work/screens/assignment-center';
 import {WorkFiltersForm} from './src/features/work/components/work-filters';
 const now='2026-10-23T10:00:00Z';
 const tasks=[{id:'task-1',title:'ตรวจสอบเอกสารและประสานงานอาคาร',description:'รายละเอียดงาน',status:'in_progress',statusLabel:'กำลังทำ',priority:'normal',dueAt:'2026-10-30T10:00:00Z',completedAt:null,updatedAt:now,ownerId:'fixture',ownerName:'ผู้ใช้ทดสอบ',teamId:'team-1',teamName:'ทีมทดสอบ',jobCode:'JOB-1',mainKpi:'คุณภาพงาน',subKpi:'ความครบถ้วน',note:'บันทึกงาน',notes:[],kpiWeight:'25%',version:1}];
 const model={generatedAt:now,source:{moduleId:'work',status:'ready',itemCount:1,message:''},tasks,activities:[],items:[],people:[],jobGroups:[],kpiCards:[],scores:[],facts:[],personalAssignments:[],assignmentOptions:[{id:'fixture',name:'ผู้ใช้ทดสอบ',teamId:'team-1',teamName:'ทีมทดสอบ'}],kpiOptions:[],report:{taskCount:1,overdue:0,dueSoon:1,completion:0,sla:92},creationKey:'fixture-key'};
 const path=window.fixturePath; const filters=<WorkFiltersForm filters={{}} model={model} appearance="workspace" resetHref={path}/>;
 const content=path==='/work/team'?<TeamCommandScreen model={model} filters={filters}/>:<AssignmentCenterScreen model={model} filters={filters}/>;
 createRoot(document.getElementById('root')).render(<AppShell displayName="ผู้ใช้ทดสอบ" allowedModuleIds={['work']} canAdmin workNavigation={[{href:'/work/team',label:'ภาพรวมทีม',icon:'work'},{href:'/work/assign',label:'มอบหมายงาน',icon:'check'}]} scopeLabel="ทีมของตน">{content}</AppShell>);
 `},bundle:true,write:false,outdir:"fixture-output",platform:"browser",jsx:"automatic",define:{"process.env.NODE_ENV":'"development"'},plugins:[{name:"batch2-boundaries",setup(builder){
  builder.onResolve({filter:/^next\/(link|navigation)$/},args=>({path:args.path,namespace:"fixture"})); builder.onResolve({filter:/^@\/app\/.*actions$/},()=>({path:"actions",namespace:"fixture"}));
  builder.onLoad({filter:/.*/,namespace:"fixture"},args=>({loader:"tsx",resolveDir:process.cwd(),contents:args.path==='actions'?`export async function noop(){return {ok:false,message:''}} export const assignWorkTasksAction=noop,previewWorkDeadlineAction=noop,addWorkTaskNoteAction=noop,deleteWorkTaskAction=noop,editWorkTaskAction=noop,transitionWorkTaskAction=noop,createPersonalTaskAction=noop,logoutAction=noop;`:args.path==='next/link'?`import React from'react';export default function Link({prefetch,...props}){return <a {...props}/>} `:`export function usePathname(){return window.fixturePath}export function useSearchParams(){return new URLSearchParams()}export function useRouter(){return {push:()=>{},replace:()=>{},refresh:()=>{}}}`}));
 }}]});
 script=result.outputFiles.find(file=>file.path.endsWith('.js'))!.text; moduleCss=result.outputFiles.find(file=>file.path.endsWith('.css'))?.text??'';
});

async function mount(page:Page,route:"/work/team"|"/work/assign",theme:"light"|"dark",width:number){
 await page.setViewportSize({width,height:1000});
 await page.route('**/*',request=>request.request().url()==='https://batch2.test/'?request.fulfill({contentType:'text/html',body:`<!doctype html><html lang="th" data-theme="${theme}"><head><title>Batch 2 fixture</title><style>${globalCss}${moduleCss}${fonts}</style></head><body><div id="root"></div></body></html>`}):request.abort());
 await page.goto('https://batch2.test/'); await page.evaluate(routeName=>{window.fixturePath=routeName},route); await page.addScriptTag({content:script});
 await expect(page.locator('[data-app-shell]')).toBeVisible(); await page.evaluate(async()=>{await document.fonts.ready});
}
async function axe(page:Page){const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();expect(result.violations.map(item=>({id:item.id,targets:item.nodes.map(node=>node.target)}))).toEqual([])}
for(const route of ['/work/team','/work/assign'] as const)for(const theme of ['light','dark'] as const)for(const width of [375,768,1440])test(`${route} ${theme} ${width}`,async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));await mount(page,route,theme,width);
 const heading=page.getByRole('heading',{name:route==='/work/team'?'ภาพรวมทีม':'ศูนย์มอบหมายงาน',exact:true});const filter=page.locator('form[aria-label="ตัวกรองงาน"]');
 await expect(heading).toBeVisible();expect((await heading.boundingBox())!.y).toBeLessThan((await filter.boundingBox())!.y);await expect(filter.getByRole('link',{name:'ล้างตัวกรอง'})).toHaveAttribute('href',route);
 if(route==='/work/team'){await expect(page.locator('#workspace-content').getByRole('link',{name:'มอบหมายงาน',exact:true})).toHaveAttribute('href','/work/assign');if(width===375){await expect(page.locator('thead')).toBeHidden();expect(await page.locator('tbody tr').first().evaluate(el=>getComputedStyle(el).display)).toBe('grid')}}
 else {await expect(page.getByRole('heading',{name:'รายละเอียดการมอบหมาย',exact:true})).toBeVisible();for(const name of ['ดู deadline ล่วงหน้า','มอบหมายงาน'])expect((await page.getByRole('button',{name,exact:true}).boundingBox())!.height).toBeGreaterThanOrEqual(44)}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await axe(page);expect(errors).toEqual([]);await page.screenshot({path:info.outputPath('batch2-fixture.png'),fullPage:true});
});
declare global{interface Window{fixturePath:"/work/team"|"/work/assign"}}
