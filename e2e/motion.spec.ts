import {expect,test,type Page} from "@playwright/test";
import fs from "node:fs/promises";
import {settlePresentation} from "./settle";
async function checkMotion(page:Page,reduced:boolean) {
  const result=await page.evaluate(()=>({
    animations:document.getAnimations().map(a=>({duration:a.effect?.getComputedTiming().duration,iterations:a.effect?.getComputedTiming().iterations,keys:(a.effect as KeyframeEffect).getKeyframes().flatMap(f=>Object.keys(f).filter(k=>!["offset","computedOffset","easing","composite"].includes(k))),name:(a as CSSAnimation).animationName||"transition"})),
    styles:[...document.querySelectorAll("*")].flatMap(el=>[null,"::before","::after"].map(p=>{const s=getComputedStyle(el,p);return {animation:s.animationName,transition:s.transitionDuration};})),
  }));
  if(reduced){expect(result.animations).toEqual([]);expect(result.styles.every(s=>s.animation==="none"&&s.transition.split(",").every(v=>parseFloat(v)===0))).toBe(true);}
  else for(const a of result.animations){expect(Number(a.duration)).toBeLessThanOrEqual(200);expect(a.keys.every(k=>["opacity","transform"].includes(k))).toBe(true);if(a.iterations===Infinity)expect(a.name).toMatch(/spin|skeleton/);}
  return result.animations;
}
for(const reduced of [false,true])test(`motion respects preference ${reduced?"reduce":"normal"}`,async({page})=>{
  await page.emulateMedia({reducedMotion:reduced?"reduce":"no-preference"});
  await page.addInitScript(()=>{
    const values:number[]=[];
    Object.assign(window,{uxShifts:values});
    new PerformanceObserver(list=>{for(const e of list.getEntries()) {const shift=e as PerformanceEntry&{hadRecentInput:boolean;value:number};if(!shift.hadRecentInput)values.push(shift.value);}}).observe({type:"layout-shift",buffered:true});
  });
  await page.goto("/login");await settlePresentation(page);
  const observations=await checkMotion(page,reduced);
  await page.locator("input[name=email]").fill("staff@example.test");await page.locator("input[name=password]").fill("FixturePassword123!");
  // Hold a real action request briefly so the immediate pending feedback is measurable.
  let release:()=>void=()=>{};const held=new Promise<void>(r=>{release=r;});
  await page.route("**/login",async route=>{if(route.request().method()==="POST")await held;await route.continue();});
  const started=await page.evaluate(()=>performance.now());
  await page.getByRole("button",{name:"เข้าสู่ระบบ",exact:true}).click();
  await expect(page.locator(".auth-spinner")).toBeVisible();
  const feedbackMs=await page.evaluate(t=>performance.now()-t,started);
  expect(feedbackMs).toBeLessThanOrEqual(200);
  observations.push(...await checkMotion(page,reduced));release();
  await page.waitForURL("http://localhost:3100/");await settlePresentation(page);
  observations.push(...await checkMotion(page,reduced));
  // Start the settled measurement window: no count-up or layout transitions remain.
  await page.evaluate(()=>{(window as unknown as {uxShifts:number[]}).uxShifts.length=0;});
  const trigger=page.locator(".record-title").first();await trigger.click();
  await expect(page.locator(".detail-panel")).toBeVisible();
  observations.push(...await checkMotion(page,reduced));await settlePresentation(page);
  await page.getByRole("button",{name:"ปิดรายละเอียด",exact:true}).click();
  await expect(page.locator(".detail-panel")).toHaveCount(0);await expect(trigger).toBeFocused();
  await page.locator(".account-trigger").click();
  observations.push(...await checkMotion(page,reduced));await page.keyboard.press("Escape");
  const cls=await page.evaluate(()=>(window as unknown as {uxShifts:number[]}).uxShifts.reduce((a,b)=>a+b,0));
  expect(cls).toBe(0);
  await fs.writeFile(`docs/quality/ux-login-evidence/cp4-motion-${reduced?"reduce":"normal"}.json`,JSON.stringify({feedbackMs,settledWindowCLS:cls,observations},null,2));
});
