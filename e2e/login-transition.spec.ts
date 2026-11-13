import {test,expect} from "@playwright/test";
import {build} from "esbuild";
import {readFileSync,mkdirSync} from "node:fs";
import {resolve} from "node:path";

let script="",moduleCss="";
const css=["tokens","shell","components","ui","auth","motion"].map(name=>readFileSync(`src/styles/${name}.css`,"utf8")).join("\n");
test.beforeAll(async()=>{
 const result=await build({bundle:true,write:false,outdir:"fixture",platform:"browser",jsx:"automatic",define:{"process.env.NODE_ENV":'"development"'},stdin:{resolveDir:process.cwd(),loader:"tsx",contents:`
 import React from 'react';import {createRoot} from 'react-dom/client';
 import {AuthShell} from './src/components/auth/auth-shell';import {LoginForm} from './src/components/login-form';import {AppShell} from './src/components/app-shell';
 import {LoginTransitionArrival} from './src/components/auth/login-transition';
 const root=createRoot(document.getElementById('root'));
 window.destination=()=>{history.replaceState(null,'','/workspace');root.render(<React.StrictMode><LoginTransitionArrival/><AppShell allowedModuleIds={[]}><div className="loading-workspace">กำลังโหลดหน้าปลายทาง</div></AppShell></React.StrictMode>);window.finishDestination=()=>root.render(<React.StrictMode><LoginTransitionArrival/><AppShell allowedModuleIds={[]}><h1>หน้าระบบทดสอบ</h1><div style={{height:1600}}>เนื้อหาทดสอบหน้าที่ยาวกว่าจอ</div></AppShell></React.StrictMode>);if(!window.holdDestination)setTimeout(window.finishDestination,180);};
 root.render(<React.StrictMode><LoginTransitionArrival/><AuthShell title="เข้าสู่ระบบ" teamBrand imageSrc="/logo.png"><LoginForm next="/work"/></AuthShell></React.StrictMode>);
 `},plugins:[{name:"auth-fixture",setup(builder){
 // Reproduce route entries loading independent instances of the transition module.
 builder.onResolve({filter:/login-transition$/},args=>args.importer.endsWith("login-form.tsx")?{path:resolve("src/components/auth/login-transition.tsx"),namespace:"login-entry"}:undefined);
 builder.onLoad({filter:/.*/,namespace:"login-entry"},args=>({loader:"tsx",resolveDir:process.cwd(),contents:readFileSync(args.path,"utf8")}));
 builder.onResolve({filter:/^next\/(navigation|image|link)$/},args=>({path:args.path,namespace:"fixture"}));
 builder.onResolve({filter:/^@\/app\/login\/actions$/},args=>({path:args.path,namespace:"fixture"}));
 builder.onLoad({filter:/.*/,namespace:"fixture"},args=>({loader:"tsx",resolveDir:process.cwd(),contents:
 args.path.endsWith("actions")?`export async function loginAction(){const result=await(await fetch('/test-login',{method:'POST'})).json();return result.ok?{destination:'/workspace'}:{error:'ทดสอบเข้าสู่ระบบไม่สำเร็จ'};}export async function logoutAction(){}`:
 args.path==="next/image"?`import React from'react';export default function Image({priority,...props}){return <img {...props}/>}`:
 args.path==="next/link"?`import React from'react';export function useLinkStatus(){return {pending:false};}export default function Link({prefetch,...props}){return <a {...props}/>}`:
 `export function usePathname(){return location.pathname;}export function useSearchParams(){return new URLSearchParams();}export function useRouter(){return {push(){},prefetch(){},replace(){window.destination();}}}`
 }));
 }}]});
 script=result.outputFiles.find(file=>file.path.endsWith(".js"))!.text;
 moduleCss=result.outputFiles.find(file=>file.path.endsWith(".css"))?.text??"";
});

for(const theme of ["light","dark"])for(const width of [1440,390])test(`login split and downward entrance ${theme} ${width}`,async({page})=>{
 let requests=0;
 await page.emulateMedia({reducedMotion:theme==="dark"?"reduce":"no-preference"});
 await page.setViewportSize({width,height:900});
 await page.route("**/*",async route=>{
  const url=new URL(route.request().url());
  if(url.pathname==="/test-login"){requests++;return route.fulfill({json:{ok:true}});}
  if(["/logo.png","/icon.png"].includes(url.pathname))return route.fulfill({path:resolve("public"+url.pathname)});
  return route.fulfill({contentType:"text/html",body:`<html lang="th" data-theme="${theme}"><style>${css}${moduleCss}</style><div id="root"></div></html>`});
 });
 await page.goto("https://login.test");await page.addScriptTag({content:script});
 await page.locator('input[name="email"]').fill("test@example.invalid");
 await page.locator('input[name="password"]').fill("TEST-only-password");
 await page.getByRole("button",{name:"เข้าสู่ระบบ",exact:true}).click();
 await expect(page.locator(".auth-is-departing")).toHaveCount(1);
 const frames=await page.evaluate(()=>{
  const animations=document.getAnimations().filter(animation=>animation.effect instanceof KeyframeEffect && (animation.effect.target as Element)?.matches(".auth-intro,.auth-panel"));
  animations.forEach(animation=>animation.pause());
  return animations.map(animation=>(animation.effect as KeyframeEffect).getKeyframes().map(frame=>frame.transform).filter(Boolean));
 });
 if(width>=900)expect(frames.some(frame=>String(frame.at(-1)).startsWith("translate3d(-"))).toBe(true);
 expect(frames.some(frame=>/^translate3d\([0-9]/.test(String(frame.at(-1))))).toBe(true);
 await expect.poll(()=>requests).toBe(1);
 await expect(page.locator(".auth-transition-cover")).toHaveCount(1);
 await expect(page.locator(".auth-transition-cover .auth-submit-button")).toHaveText("กำลังเปิดพื้นที่ทำงาน…");
 await expect(page.locator('.auth-is-departing input[name="password"]')).toHaveValue("");
 await expect(page.locator(".auth-transition-cover")).toHaveAttribute("inert","");
 expect(await page.evaluate(()=>sessionStorage.getItem("permission-next-login-transition"))).toMatch(/^\d+$/);
 await page.evaluate(()=>document.getAnimations().forEach(animation=>{animation.currentTime=300;}));
 mkdirSync("docs/quality/login-transition",{recursive:true});
 await page.screenshot({path:`docs/quality/login-transition/${theme}-${width}.png`});
 await page.evaluate(()=>document.getAnimations().forEach(animation=>animation.play()));
 await expect(page.getByRole("heading",{name:"หน้าระบบทดสอบ"})).toBeVisible();
 expect(requests).toBe(1);
 await expect(page.locator("html")).toHaveAttribute("data-login-arrival","true");
 const arrival=await page.locator("[data-app-shell]").evaluate(element=>element.getAnimations({subtree:true}).filter(animation=>"animationName" in animation&&animation.animationName==="login-destination-enter").map(animation=>(animation.effect as KeyframeEffect).getKeyframes().map(frame=>frame.transform)));
 expect(arrival.flat().some(transform=>String(transform).startsWith("translate3d(0px, -"))).toBe(true);
 await expect(page.locator("[data-app-shell]")).toHaveCSS("transform","none");
 if(width>=900){
  const during=await page.locator("[data-shell-sidebar]").evaluate(sidebar=>sidebar.getBoundingClientRect().height);
  expect(during).toBe(868);
 }
 await expect(page.locator("html")).not.toHaveAttribute("data-login-arrival","true");
 if(width>=900)expect(await page.locator("[data-shell-sidebar]").evaluate(sidebar=>sidebar.getBoundingClientRect().height)).toBe(868);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
});

test("keeps login cover stationary until the streamed skeleton is replaced",async({page})=>{
 await page.route("**/*",route=>route.request().url().endsWith("/test-login")?route.fulfill({json:{ok:true}}):route.fulfill({contentType:"text/html",body:`<style>${css}${moduleCss}</style><div id="root"></div>`}));
 await page.goto("https://login.test");await page.addScriptTag({content:script});
 await page.evaluate(()=>Object.assign(window,{holdDestination:true}));
 await page.locator('input[name="email"]').fill("test@example.invalid");
 await page.locator('input[name="password"]').fill("TEST-only-password");
 await page.getByRole("button",{name:"เข้าสู่ระบบ",exact:true}).click();
 await expect(page.locator(".loading-workspace")).toHaveCount(1);
 await expect(page.locator("html")).toHaveAttribute("data-login-arrival","preparing");
 await expect(page.locator(".auth-transition-cover")).toHaveCount(1);
 await expect(page.locator(".auth-is-departing")).toHaveCount(0);
 await expect(page.locator("[data-shell-main]")).toHaveCSS("visibility","hidden");
 await page.evaluate(()=>{(window as unknown as {finishDestination:()=>void}).finishDestination();});
 await expect(page.locator(".auth-is-departing")).toHaveCount(1);
 await expect(page.locator("html")).toHaveAttribute("data-login-arrival","true");
 const timing=await page.locator("[data-app-shell]").evaluate(element=>element.getAnimations({subtree:true}).filter(animation=>"animationName" in animation&&animation.animationName==="login-destination-enter").map(animation=>animation.effect!.getTiming()));
 expect(timing.length).toBeGreaterThan(0);
 expect(timing.every(item=>item.delay===1500)).toBe(true);
 const splitTiming=await page.locator(".auth-transition-cover").evaluate(element=>element.getAnimations({subtree:true}).map(animation=>animation.effect!.getTiming()));
 expect(splitTiming.length).toBeGreaterThan(0);
 expect(splitTiming.every(item=>Number(item.duration)+500===timing[0].delay)).toBe(true);
 await expect(page.locator(".auth-transition-cover")).toHaveCount(0);
});

for(const success of [true,false])test(`does not move before authentication returns; success ${success}`,async({page})=>{
 let release:(()=>void)|undefined;
 await page.route("**/*",async route=>{
  if(route.request().url().endsWith("/test-login")){
   await new Promise<void>(resolve=>{release=resolve;});
   return route.fulfill({json:{ok:success}});
  }
  return route.fulfill({contentType:"text/html",body:`<style>${css}${moduleCss}</style><div id="root"></div>`});
 });
 await page.goto("https://login.test");await page.addScriptTag({content:script});
 await page.locator('input[name="email"]').fill("test@example.invalid");
 await page.locator('input[name="password"]').fill("TEST-only-password");
 await page.getByRole("button",{name:"เข้าสู่ระบบ",exact:true}).click();
 await expect.poll(()=>!!release).toBe(true);
 await expect(page.locator(".auth-submit-button")).toBeDisabled();
 await expect(page.locator(".auth-is-departing")).toHaveCount(0);
 await expect(page.locator(".auth-panel")).toHaveCSS("transform","none");
 release!();
 if(success){
  await expect(page.locator(".auth-is-departing")).toHaveCount(1);
  await expect(page.getByRole("heading",{name:"หน้าระบบทดสอบ"})).toBeVisible();
 }else{
  await expect(page.getByRole("alert")).toContainText("ไม่สำเร็จ");
  await expect(page.locator(".auth-is-departing")).toHaveCount(0);
  await expect(page.locator('input[name="password"]')).toBeFocused();
 }
});

for(const [reduced,success] of [[false,false],[true,false],[true,true]])test(`login result ${success}; reduced motion ${reduced}`,async({page})=>{
 await page.emulateMedia({reducedMotion:reduced?"reduce":"no-preference"});
 await page.route("**/*",route=>route.request().url().endsWith("/test-login")?route.fulfill({json:{ok:success}}):route.fulfill({contentType:"text/html",body:`<style>${css}${moduleCss}</style><div id="root"></div>`}));
 await page.goto("https://login.test");await page.addScriptTag({content:script});
 await page.locator('input[name="email"]').fill("test@example.invalid");
 await page.locator('input[name="password"]').fill("TEST-only-password");
 await page.getByRole("button",{name:"เข้าสู่ระบบ",exact:true}).click();
 if(success)await expect(page.getByRole("heading",{name:"หน้าระบบทดสอบ"})).toBeVisible();
 else await expect(page.getByRole("alert")).toContainText("ไม่สำเร็จ");
 if(!success){await expect(page.locator(".auth-is-departing")).toHaveCount(0);await expect(page.locator('input[name="password"]')).toBeFocused();}
 else {
  await expect(page.locator("html")).toHaveAttribute("data-login-arrival","true");
  expect(await page.locator("[data-app-shell]").evaluate(node=>node.getAnimations({subtree:true}).length)).toBeGreaterThan(0);
  await expect(page.locator("html")).not.toHaveAttribute("data-login-arrival","true");
  await expect(page.locator(".auth-transition-cover")).toHaveCount(0);
 }
});
