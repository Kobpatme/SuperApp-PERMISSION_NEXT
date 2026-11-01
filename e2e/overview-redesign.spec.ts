import { test, expect, type Page } from "@playwright/test";
import { build } from "esbuild";
import fs from "node:fs/promises";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";

test.use({ launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {} });
const evidence = "docs/quality/overview";
let script = "", css = "";

test.beforeAll(async () => {
  await fs.mkdir(evidence, { recursive:true });
  const output = await build({ bundle:true, write:false, platform:"browser", format:"iife", jsx:"automatic", outfile:"overview.js",
    define:{ "process.env.NODE_ENV":'"development"' },
    stdin:{ resolveDir:process.cwd(), loader:"tsx", contents:`
      import React from "react"; import { createRoot } from "react-dom/client";
      import "./src/styles/tokens.css"; import "./src/app/globals.css"; import "./src/styles/shell.css";
      import "./src/styles/components.css"; import "./src/styles/ui.css"; import "./src/styles/notifications.css";
      import "./src/styles/work.css"; import "./src/styles/auth.css"; import "./src/styles/motion.css";
      import { DashboardOverview } from "./src/components/dashboard-overview";
      import { OverviewMessages } from "./src/components/overview-messages";
      const mode = new URLSearchParams(location.search).get("fixture") || "ready";
      const allowed = mode === "denied" ? [] : mode === "limited" ? ["work"] : ["work","buildings","guarantees"];
      // Explicit TEST model only: never requests a server/API/database or proves authentication.
      const items = Array.from({length:11},(_,i)=>({id:"TEST-"+i,code:"TEST-"+String(i+1).padStart(3,"0"),
        moduleId:["work","buildings","guarantees"][i%3],kind:"task",priority:i%3===0?"urgent":i%3===1?"attention":"normal",
        title:["ตรวจสอบเอกสารอาคาร","ติดตามการอนุมัติพื้นที่","ตรวจสอบรายการคืนประกัน"][i%3]+" · ทดสอบ "+(i+1),
        buildingName:"อาคารทดสอบ "+(i+1), ownerId:i%2===0?"TEST-USER":"TEST-OTHER", ownerName:i%2===0?"ผู้ใช้ทดสอบ":"ทีมประสานงาน",
        href:"/work/mine?recordId=TEST-"+i,dueAt:"2026-11-01T09:00:00+07:00",updatedAt:"2026-11-01T08:00:00+07:00",
        statusLabel:i%2===0?"รอดำเนินการ":"กำลังดำเนินการ",description:"ข้อมูลทดสอบสำหรับตรวจรูปแบบและการโต้ตอบ ไม่ใช่รายการจากระบบจริง",
        nextAction:"ตรวจสอบเอกสารกับผู้รับผิดชอบก่อนดำเนินการต่อ"})).filter(i=>allowed.includes(i.moduleId));
      const snapshot={generatedAt:"2026-11-01T10:00:00+07:00",items:["empty","unavailable","preparing"].includes(mode)?[]:items,
        sources:allowed.map((moduleId,i)=>({moduleId,status:mode==="unavailable"?"unavailable":mode==="preparing"?"not_configured":mode==="partial"&&i===2?"unavailable":"ready",itemCount:mode==="limit"?500:items.filter(x=>x.moduleId===moduleId).length,message:"TEST source"}))};
      createRoot(document.getElementById("root")!).render(<><OverviewMessages announcements={[{id:"TEST-NOTE",message:"พื้นที่ทดสอบ UI · ข้อมูลสมมติ ไม่มีการเชื่อมต่อระบบจริง"}]} links={[
        {id:"TEST-LINK",name:"คู่มือทดสอบ",url:"/test-manual",description:"ลิงก์ตัวอย่างสำหรับตรวจการแสดงผล",status:"Active"},
        {id:"TEST-MAINTENANCE",name:"ระบบทดสอบ",url:"/test-system",description:"สถานะระบบที่ยังไม่พร้อมใช้งาน",status:"Maintenance"},
        {id:"TEST-COMING",name:"ระบบทดสอบถัดไป",url:"/test-coming",description:"ระบบที่กำลังเตรียมเปิดใช้งาน",status:"Coming"}]}/>
        <DashboardOverview displayName="ผู้ใช้ทดสอบ" userId="TEST-USER" allowedModuleIds={allowed} developmentMode={mode==="preview"} preview={mode==="preview"} snapshot={snapshot}/></>);
    `},
    plugins:[{ name:"overview-next-boundaries", setup(builder){
      builder.onResolve({filter:/^next\/(link|navigation)$/},args=>({path:args.path,namespace:"fixture"}));
      builder.onLoad({filter:/.*/,namespace:"fixture"},args=>({loader:"tsx",resolveDir:process.cwd(),contents:args.path==="next/link" ? `export default function Link(p){ return <a {...p}/> }` : `
        import {useSyncExternalStore} from "react";
        for(const name of ["pushState","replaceState"]){ const original=history[name].bind(history); history[name]=(...args)=>{original(...args); window.dispatchEvent(new Event("fixture-navigation"));}; }
        const subscribe=fn=>{window.addEventListener("fixture-navigation",fn); window.addEventListener("popstate",fn); return ()=>{window.removeEventListener("fixture-navigation",fn);window.removeEventListener("popstate",fn);};};
        export function useSearchParams(){const search=useSyncExternalStore(subscribe,()=>location.search);return new URLSearchParams(search);}
        export function usePathname(){return location.pathname;}
        export function useRouter(){return {refresh:()=>{window.__refreshes=(window.__refreshes||0)+1}};}
      `}));
    }}]
  });
  script=output.outputFiles.find(file=>file.path.endsWith(".js"))!.text;
  css=output.outputFiles.find(file=>file.path.endsWith(".css"))!.text;
});

async function mount(page:Page, mode="ready", theme="light", width=1440) {
  await page.setViewportSize({width,height:1000});
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.route("https://overview.fixture/**", async route=>{
    const url=new URL(route.request().url());
    if(url.pathname.startsWith("/fonts/")) return route.fulfill({contentType:"font/woff2",body:await fs.readFile(path.join(process.cwd(),"src/app",url.pathname))});
    if(url.pathname==="/fixture.css") return route.fulfill({contentType:"text/css",body:css});
    return route.fulfill({contentType:"text/html",body:`<!doctype html><html lang="th" data-theme="${theme}"><head><title>Overview TEST fixture</title><link rel="stylesheet" href="/fixture.css"><style>
      @font-face{font-family:FixtureThai;src:url('/fonts/noto-sans-thai.woff2')}@font-face{font-family:FixtureNunito;src:url('/fonts/nunito.woff2')}@font-face{font-family:FixtureManrope;src:url('/fonts/manrope.woff2')}
      :root{--font-thai:FixtureThai;--font-nunito:FixtureNunito;--font-manrope:FixtureManrope}body{padding:24px}main{max-width:1200px;margin:auto;min-width:0}@media(max-width:650px){body{padding:16px}}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
      </style></head><body><main id="root"></main></body></html>`});
  });
  await page.goto(`https://overview.fixture/?fixture=${mode}`);
  await page.evaluate(()=>{Object.defineProperty(navigator,"clipboard",{value:{writeText:async(text:string)=>{(window as unknown as {__copied:string}).__copied=text}},configurable:true});});
  await page.addScriptTag({content:script});
  await expect(page.getByRole("heading",{name:"วันนี้ต้องจัดการอะไรบ้าง"})).toBeVisible();
  await page.evaluate(()=>document.fonts.ready);
}
async function shot(page:Page,name:string){await page.screenshot({path:`${evidence}/${name}.png`,fullPage:!name.startsWith("detail-")});}

test("mounted Overview light/dark/mobile composition and accessibility", async({page})=>{
  const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
  for(const [name,theme,width] of [["light","light",1440],["dark","dark",1440],["mobile-light","light",390],["mobile-dark","dark",390],["narrow","light",320],["tablet","light",768]] as const){
    await mount(page,"ready",theme,width);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await expect(page.locator("tbody tr")).toHaveCount(8);
    await expect(page.getByRole("navigation",{name:"เปิดพื้นที่ทำงาน"}).getByRole("link")).toHaveCount(3);
    await page.evaluate(()=>document.fonts.ready);
    await expect(page.locator(".ui-metric strong > span").first()).toHaveCSS("font-size","24px");
    if(width<780) {const table=page.getByRole("region",{name:"ตารางรายการติดตาม เลื่อนแนวนอนได้"});await table.evaluate(node=>node.scrollLeft=node.scrollWidth);expect(await table.evaluate(node=>node.scrollLeft)).toBeGreaterThan(0);await table.evaluate(node=>node.scrollLeft=0);}
    await shot(page,name);
    const axe=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze();
    await fs.writeFile(`${evidence}/axe-${name}.json`,JSON.stringify(axe.violations,null,2));
    expect(axe.violations).toEqual([]);
  }
  expect(errors).toEqual([]);
});

test("filters, KPI groups, sorting, pagination and saved view lifecycle",async({page})=>{
  await mount(page);
  await page.getByRole("button",{name:/เร่งด่วน/}).click();
  await expect(page).toHaveURL(/view=urgent/);
  await expect(page.locator("tbody tr")).toHaveCount(4);
  await page.locator(".ui-metric").first().click();
  await page.getByRole("button",{name:"ตัวกรอง",exact:true}).click();
  await page.getByRole("combobox",{name:"สถานะ",exact:true}).selectOption("รอดำเนินการ");
  await page.getByRole("combobox",{name:"เรียงตาม",exact:true}).selectOption("title");
  await expect(page.locator("tbody tr")).toHaveCount(6);
  await shot(page,"filters");
  await page.locator(".saved-views summary").click();
  await page.getByLabel("ชื่อมุมมอง").fill("งานที่ต้องติดตาม TEST");
  await page.getByRole("button",{name:"บันทึกมุมมองปัจจุบัน"}).click();
  await expect(page.getByText("บันทึกมุมมองแล้ว",{exact:true})).toBeVisible();
  await shot(page,"saved-views");
  await page.keyboard.press("Escape");
  await page.getByRole("button",{name:"ล้างตัวกรองทั้งหมด"}).click();
  await page.locator(".saved-views summary").click();
  await page.getByRole("button",{name:"งานที่ต้องติดตาม TEST",exact:true}).click();
  await expect(page.getByRole("combobox",{name:"สถานะ",exact:true})).toHaveValue("รอดำเนินการ");
  await page.locator(".saved-views summary").click();
  await page.getByRole("button",{name:"ลบมุมมอง งานที่ต้องติดตาม TEST"}).click();
  await expect(page.getByText("ลบมุมมองแล้ว",{exact:true})).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button",{name:"ล้างตัวกรองทั้งหมด"}).click();
  await page.getByRole("button",{name:"ถัดไป",exact:true}).click();
  await expect(page.locator("tbody tr")).toHaveCount(3);
  await page.getByRole("button",{name:"ก่อนหน้า",exact:true}).click();
  await page.getByRole("searchbox",{name:"ค้นหาในรายการ"}).fill("NO-MATCH");
  await expect(page.getByText("ไม่พบรายการที่ตรงกับตัวกรอง",{exact:true})).toBeVisible();
  await page.getByRole("button",{name:"แสดงรายการทั้งหมด"}).click();
  await expect(page.locator("tbody tr")).toHaveCount(8);
});

test("detail overlay, copy, selection and focus return at desktop/mobile",async({page})=>{
  for(const [theme,width] of [["light",1440],["dark",390]] as const){
    await mount(page,"ready",theme,width);
    const opener=page.locator(".record-title").first();await opener.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("dialog").getByRole("link",{name:"เปิดรายละเอียดรายการ"})).toHaveAttribute("href",/TEST-/);
    await page.getByRole("button",{name:"คัดลอกรหัส",exact:true}).click();
    await expect(page.getByText("คัดลอกรหัสรายการแล้ว",{exact:true})).toBeVisible();
    const overlayAxe=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze();
    await fs.writeFile(`${evidence}/axe-detail-${theme}.json`,JSON.stringify(overlayAxe.violations,null,2));
    expect(overlayAxe.violations).toEqual([]);
    const actionContrast=await page.locator(".detail-actions > *").evaluateAll(nodes=>nodes.map(node=>{
      const style=getComputedStyle(node);
      const luminance=(color:string)=>{const channels=(color.match(/[\d.]+/g)||[]).slice(0,3).map(Number).map(c=>{const s=c/255;return s<=0.04045?s/12.92:((s+0.055)/1.055)**2.4;});return channels[0]*0.2126+channels[1]*0.7152+channels[2]*0.0722;};
      const foreground=luminance(style.color),background=luminance(style.backgroundColor);
      return {text:node.textContent,color:style.color,background:style.backgroundColor,ratio:(Math.max(foreground,background)+0.05)/(Math.min(foreground,background)+0.05)};
    }));
    await fs.writeFile(`${evidence}/contrast-detail-${theme}.json`,JSON.stringify(actionContrast,null,2));
    for(const pair of actionContrast) expect(pair.ratio).toBeGreaterThanOrEqual(4.5);
    await shot(page,`detail-${theme}`);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);await expect(opener).toBeFocused();
    await opener.click();await page.getByRole("button",{name:"ปิดรายละเอียด"}).click();await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.getByRole("checkbox",{name:"เลือกทุกรายการในหน้านี้"}).check();
    await page.getByRole("button",{name:"คัดลอกรหัสที่เลือก"}).click();
    await expect(page.getByText("คัดลอกรหัส 8 รายการแล้ว",{exact:true})).toBeVisible();
    await page.getByRole("button",{name:"ยกเลิกการเลือก"}).click();
    await expect(page.getByRole("checkbox",{name:"เลือกทุกรายการในหน้านี้"})).not.toBeChecked();
  }
});

test("ready empty / unavailable / preparing / partial / limited / denied / preview / truncation",async({page})=>{
  for(const mode of ["empty","unavailable","preparing","partial","limited","denied","preview","limit"]){
    await mount(page,mode);
    if(mode==="empty") await expect(page.getByText("ไม่มีรายการที่ต้องติดตาม",{exact:true})).toBeVisible();
    if(mode==="unavailable") {await expect(page.getByText("เชื่อมต่อข้อมูลไม่สำเร็จ",{exact:true})).toBeVisible();await expect(page.locator(".ui-metric strong").first()).toHaveText("—");}
    if(mode==="preparing") await expect(page.getByText("อยู่ระหว่างเตรียมข้อมูล",{exact:true})).toBeVisible();
    if(mode==="partial") await expect(page.getByText(/แสดงข้อมูลบางส่วน บางระบบ/)).toBeVisible();
    if(mode==="limited") await expect(page.getByRole("navigation",{name:"เปิดพื้นที่ทำงาน"}).getByRole("link")).toHaveCount(1);
    if(mode==="denied") {await expect(page.getByText("ยังไม่มีพื้นที่ทำงานที่เข้าถึงได้",{exact:true})).toBeVisible();await expect(page.locator("table")).toHaveCount(0);}
    if(mode==="preview") {await page.locator(".record-title").first().click();await expect(page.getByRole("dialog").getByRole("link")).toHaveCount(0);await page.keyboard.press("Escape");await expect(page.getByRole("navigation",{name:"เปิดพื้นที่ทำงาน"}).getByRole("link").first()).toHaveAttribute("href",/preview=1/);}
    if(mode==="limit") await expect(page.locator(".queue-notice")).toBeVisible();
    await shot(page,`state-${mode}`);
  }
});

test("refresh boundary, invalid record dismiss, storage and clipboard errors",async({page})=>{
  await mount(page);
  await page.getByRole("button",{name:"อัปเดตข้อมูล",exact:true}).click();
  expect(await page.evaluate(()=>(window as unknown as {__refreshes:number}).__refreshes)).toBe(1);
  await page.evaluate(()=>history.pushState(null,"","?fixture=ready&record=missing"));
  await expect(page.getByText("รายการนี้ไม่อยู่ในข้อมูลติดตามที่เข้าถึงได้ในขณะนี้")).toBeVisible();
  await page.getByRole("button",{name:"ปิดข้อความ"}).click();await expect(page).not.toHaveURL(/record=/);
  await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw new Error("TEST storage unavailable")};Object.defineProperty(navigator,"clipboard",{value:{writeText:async()=>{throw new Error("TEST clipboard denied")}},configurable:true});});
  await page.locator(".saved-views summary").click();await page.getByLabel("ชื่อมุมมอง").fill("TEST");await page.getByRole("button",{name:"บันทึกมุมมองปัจจุบัน"}).click();
  await expect(page.getByText(/บันทึกไม่สำเร็จ โปรดตรวจสอบ/)).toBeVisible();await page.keyboard.press("Escape");
  await page.locator(".record-title").first().click();await page.getByRole("button",{name:"คัดลอกรหัส",exact:true}).click();await expect(page.getByText(/คัดลอกไม่สำเร็จ กรุณาเลือกรหัส/)).toBeVisible();
});

test("mobile saved views, limit, storage-read error and keyboard filters",async({page})=>{
  await mount(page,"ready","dark",390);
  await page.locator(".ui-metric").nth(3).click();await expect(page.locator("tbody tr")).toHaveCount(6);
  await page.locator(".ui-metric").nth(2).click();await expect(page.locator("tbody tr")).toHaveCount(8);
  await page.getByRole("button",{name:"ตัวกรอง",exact:true}).focus();await page.keyboard.press("Enter");
  await expect(page.getByRole("combobox",{name:"สถานะ",exact:true})).toBeVisible();
  await shot(page,"mobile-filters");
  await page.locator(".saved-views summary").focus();await page.keyboard.press("Enter");
  await page.getByLabel("ชื่อมุมมอง").fill("TEST mobile");await page.getByRole("button",{name:"บันทึกมุมมองปัจจุบัน"}).click();
  const popover=await page.locator(".saved-views-popover").boundingBox();expect(popover!.x).toBeGreaterThanOrEqual(0);expect(popover!.x+popover!.width).toBeLessThanOrEqual(390);
  await shot(page,"mobile-saved-views");
  const axe=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze();await fs.writeFile(`${evidence}/axe-mobile-saved-views.json`,JSON.stringify(axe.violations,null,2));expect(axe.violations).toEqual([]);
  await page.keyboard.press("Escape");await expect(page.locator(".saved-views summary")).toBeFocused();
  await page.evaluate(()=>{localStorage.setItem("permission-next:views:TEST-USER:overview:live",JSON.stringify(Array.from({length:8},(_,i)=>({id:String(i),name:"TEST "+i,settings:{query:"",status:"",view:"all",sort:"priority"}}))));});
  await page.locator(".saved-views summary").click();await expect(page.getByRole("button",{name:"บันทึกมุมมองปัจจุบัน"})).toBeDisabled();await expect(page.getByText("บันทึกได้สูงสุด 8 มุมมอง")).toBeVisible();await page.keyboard.press("Escape");
  await page.evaluate(()=>{Storage.prototype.getItem=()=>{throw new Error("TEST read denied")};});await page.locator(".saved-views summary").click();await expect(page.getByText("อ่านมุมมองที่บันทึกไว้ไม่สำเร็จ")).toBeVisible();
});

test("desktop detail backdrop, header sorting, system-link disclosure and forced colors",async({page})=>{
  await mount(page);
  await page.getByRole("button",{name:"กำหนด",exact:true}).click();await expect(page).toHaveURL(/sort=due/);
  await page.getByRole("button",{name:"รายการ / อาคาร",exact:true}).click();await expect(page).toHaveURL(/sort=title/);
  const opener=page.locator(".record-title").first();await opener.click();const rect=await page.getByRole("dialog").boundingBox();await page.mouse.click(rect!.x-4,20);await expect(page.getByRole("dialog")).toHaveCount(0);await expect(opener).toBeFocused();
  await page.locator("summary").filter({hasText:"ลิงก์ระบบ"}).click();await expect(page.getByRole("link",{name:"คู่มือทดสอบ"})).not.toBeVisible();await page.locator("summary").filter({hasText:"ลิงก์ระบบ"}).click();await expect(page.getByRole("link",{name:"คู่มือทดสอบ"})).toHaveAttribute("href","/test-manual");
  await page.emulateMedia({forcedColors:"active"});await page.locator(".ui-metric").first().focus();await expect(page.locator(".ui-metric").first()).toHaveCSS("outline-style","solid");await shot(page,"forced-colors");
});
