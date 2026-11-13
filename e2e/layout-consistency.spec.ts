import { test, expect } from "@playwright/test";
import { build } from "esbuild";
import { mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// Real presentation and Core shell; synthetic records and isolated server boundaries.
// No database, authentication, imports, or business mutations are exercised here.
const evidence = resolve("docs/quality/layout-consistency");
const css = ["src/styles/tokens.css", "src/app/globals.css", "src/styles/shell.css", "src/styles/components.css", "src/styles/ui.css", "src/styles/work.css", "src/styles/auth.css", "src/styles/motion.css", "src/features/po-tracking/po-tracking.css"].map(p => readFileSync(p, "utf8")).join("\n");
const fonts = [["nunito", "nunito"], ["thai", "noto-sans-thai"], ["manrope", "manrope"], ["code", "source-code-pro"]].map(([name, file]) => `@font-face{font-family:fixture-${name};src:url(data:font/woff2;base64,${readFileSync(`src/app/fonts/${file}.woff2`).toString("base64")}) format('woff2');font-weight:100 900}:root{--font-${name}:fixture-${name}}`).join("");
let script = "", moduleCss = "";
test.beforeAll(async () => {
  mkdirSync(evidence, { recursive: true });
  const result = await build({ bundle: true, write: false, outdir: "fixture-output", platform: "browser", jsx: "automatic", loader: { ".png": "dataurl" }, define: { "process.env.NODE_ENV": '"development"' }, stdin: { resolveDir: process.cwd(), loader: "tsx", contents: `
import React from 'react';import{createRoot}from'react-dom/client';
import{AppShell}from'./src/components/app-shell';import{PageHeader}from'./src/components/ui/page-header';
import{PoTrackingList,PoTrackingReport}from'./src/features/po-tracking/po-tracking-list';
import{PoLineDetail}from'./src/features/po-tracking/po-line-detail';
import{ManualPoForm}from'./src/features/po-tracking/po-forms';import{PoExcelForm}from'./src/features/po-tracking/po-excel-form';
import{deriveLineTotals}from'./src/modules/po-tracking/domain';
import{PermissionOutWorkspace}from'./src/modules/permission-out/workspace';import{SiteFacilityWorkspace}from'./src/modules/site-facility/workspace';
const mode=location.pathname.split('/').pop();
const line={id:'TEST-line',origin:'manual',poNumber:'TEST-PO-001',materialCode:'TEST-001',description:'วัสดุทดสอบข้อความภาษาไทยยาวเพื่อให้ตรวจการจัดวางในตารางและหน้ารายละเอียดได้ครบถ้วน',unit:'PC',orderedQty:'10',initialReceivedQty:'4',receiptQty:'0',receiptCount:0,unitPrice:'100',poAmount:'1000',sourceOutstandingQty:'6',poReleaseDate:'2026-11-01',lastGrDate:null,etaDate:'2026-11-12',etaText:null,orderCode:'TEST-project',vendorCode:'TEST',vendorName:'ผู้ขายทดสอบ',status:'open',note:'',version:1,sourceId:null,importSnapshot:null,totals:deriveLineTotals({orderedQty:'10',initialReceivedQty:'4',receiptQty:'0'})};
const report={priceVisible:true,canViewImport:true,counts:{lines:1,receivedLines:0,partialLines:1,pendingLines:0,incompleteLines:0,overdueLines:1},units:[{unit:'PC',lines:1,incompleteLines:0,ordered:'10',initialReceived:'4',receiptQty:'0',outstanding:'6',amount:'1000'}],importRun:{snapshot:'TEST-synthetic',status:'reconciled',sourceCount:1,importedCount:1,anomalyCount:0,finishedAt:'2026-11-13T00:00:00Z'}};
const po=mode==='po-list'?<PoTrackingList data={{rows:[line],total:1,page:1,pageSize:50,priceVisible:true,query:{q:'',unit:'',status:'',delivery:'',order:'',page:1},orders:[]}} report={report} today="2026-11-13" canManage/>:mode==='po-report'?<PoTrackingReport report={report} canManage/>:mode==='po-detail'?<PoLineDetail line={line} receipts={[]} importRun={null} priceVisible canRecord canCorrect canManage/>:mode==='po-create'?<ManualPoForm/>:<PoExcelForm/>;
const content=mode.startsWith('po-')?<main data-ui-screen="po-tracking"><PageHeader title="ติดตาม PO" parent={{label:'ภาพรวม',href:'/'}} description="ตรวจการจัดวางด้วยข้อมูลจำลอง"/>{po}</main>:mode.startsWith('route-')?<PermissionOutWorkspace view={mode.slice(6)} permissions={['*']}/>:<SiteFacilityWorkspace view={mode.slice(5)} permissions={['*']}/>;
createRoot(document.getElementById('root')).render(<AppShell displayName="ผู้ใช้ทดสอบ" allowedModuleIds={['po-tracking','permission-out','site-facility']}>{content}</AppShell>);
` }, plugins: [{ name: "layout-fixture-boundaries", setup(builder) {
    builder.onResolve({ filter: /^next\/(link|navigation|image)$/ }, args => ({ path: args.path, namespace: "fixture" }));
    builder.onResolve({ filter: /^@\/app\/.*actions$/ }, () => ({ path: "actions", namespace: "fixture" }));
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ loader: "tsx", resolveDir: process.cwd(), contents:
      args.path === "actions" ? `${["logoutAction", "correctReceiptAction", "createManualPoAction", "recordReceiptAction", "updateLineAction", "updateManualLineAction", "previewExcelAction", "confirmExcelAction"].map(n => `export async function ${n}(){throw Error('No mutations in layout fixture')}`).join(";")}` :
      args.path === "next/link" ? `import React from'react';export default function Link({prefetch,...p}){return <a {...p}/>} ` :
      args.path === "next/image" ? `import React from'react';export default function Image({priority,unoptimized,fill,...p}){return <img {...p}/>} ` :
      `export function usePathname(){return location.pathname}export function useSearchParams(){return new URLSearchParams(location.search)}export function useRouter(){return{push(){},replace(){},refresh(){}}}`
    }));
  }}] });
  script = result.outputFiles.find(f => f.path.endsWith(".js"))!.text;
  moduleCss = result.outputFiles.find(f => f.path.endsWith(".css"))?.text ?? "";
});

for (const mode of ["po-list", "po-report", "po-detail", "po-create", "po-excel", "route-analysis", "route-projects", "route-datasets", "route-settings", "site-sites", "site-reports", "site-datasets"]) {
  for (const theme of ["light", "dark"]) test(`${mode} ${theme}: layout at four widths`, async ({ page }) => {
    const errors: string[] = [];
    const reads: string[] = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.route("**/*", async route => {
      const url = new URL(route.request().url());
      if (url.hostname !== "layout.test") { await route.abort(); return; }
      if (url.pathname === "/logo.png") { await route.fulfill({ path: resolve("public/logo.png") }); return; }
      if (url.pathname.startsWith("/api/")) {
        reads.push(url.pathname + url.search);
        expect(route.request().method()).toBe("GET");
        const name = url.pathname.split("/").pop();
        const value = name === "TEST-project" ? {id:"TEST-project",title:"โครงการทดสอบ",version:1,snapshot:{segments:[],areas:[]},fee:null,totalSegments:0} : name === "site-options" ? {} : name === "sites" || url.pathname.endsWith("/sites/map") ? { rows: [], total: 0, page: 1, yearly: "0", monthly: "0", withoutCoordinates: 0, groups: [], mapLimited:false } : ["network", "references"].includes(name ?? "") ? { items: [], limited: false } : [];
        await route.fulfill({ contentType: "application/json", body: JSON.stringify(value) }); return;
      }
      await route.fulfill({ contentType: "text/html", body: `<!doctype html><html lang="th" data-theme="${theme}"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}${moduleCss}${fonts}</style></head><body><div id="root"></div></body></html>` });
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`https://layout.test/fixture/${mode}`);
    await page.evaluate(value => localStorage.setItem("permission-next-workspace-theme", value), theme);
    await page.addScriptTag({ content: script });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.evaluate(async () => { await document.fonts.ready; });
    if (mode.startsWith("site-")) await expect(page.locator(".ui-field-error")).toHaveCount(0);
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      // Controls inside scrolling tables are deliberately exempt: the table owns overflow.
      const overflow = await page.locator("#workspace-content :is(.ui-button,.ui-field,.page-heading,.po-toolbar)").evaluateAll(elements => elements.filter(el => {
        if (!el.checkVisibility() || el.closest(".ui-table-scroll")) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && (r.left < -1 || r.right > innerWidth + 1);
      }).map(el => ({ tag: el.tagName, text: el.textContent?.slice(0, 80) })));
      expect(overflow).toEqual([]);
      await expect(page.locator(".page-heading h1")).toHaveCSS("margin-top", "0px");
      if (["route-analysis", "site-sites", "site-reports"].includes(mode) && width >= 768) {
        const controls = await page.locator(".ui-map-toolbar").first().locator("select,button").evaluateAll(elements => elements.map(el => {
          const { top, bottom, height } = el.getBoundingClientRect();
          return { top, bottom, height };
        }));
        expect(controls).toHaveLength(3);
        for (const control of controls) {
          expect(Math.abs(control.top - controls[0].top)).toBeLessThanOrEqual(1);
          expect(Math.abs(control.bottom - controls[0].bottom)).toBeLessThanOrEqual(1);
          expect(control.height).toBeGreaterThanOrEqual(44);
        }
      }
      if (mode.startsWith("site-")) await expect(page.locator(".page-heading")).not.toContainText("MOD 2");
      if (["route-analysis", "site-sites", "site-reports"].includes(mode)) {
        const toolbarPosition = await page.locator(".ui-map-header-tools").evaluate(bar => {
          const b = bar.getBoundingClientRect(), header = bar.closest(".page-heading")!.getBoundingClientRect(), map = document.querySelector(".ui-map-surface")!.getBoundingClientRect();
          return b.bottom <= map.top && b.top >= header.top && b.bottom <= header.bottom;
        });
        expect(toolbarPosition).toBe(true);
        if(width>=768) {
          const compact=await page.locator(".ui-map-heading").evaluate(header=>{
            const title=header.querySelector("strong")!.getBoundingClientRect();
            const group=header.querySelector(".ui-map-layers")!;
            const layers=group.getBoundingClientRect();
            return (!group.children.length||Math.abs((title.top+title.bottom)/2-(layers.top+layers.bottom)/2)<=1)&&header.getBoundingClientRect().height<=44;
          });
          expect(compact).toBe(true);
        }
        await expect(page.getByRole("navigation", {name:"ส่วนงาน Site Facility"})).toHaveCount(0);
        await expect(page.locator(".ui-map-sidebar")).toHaveCount(0);
        const bounds = await page.locator(".ui-map-filter-card").evaluate(card => {
          const c = card.getBoundingClientRect(), m = card.parentElement!.getBoundingClientRect();
          return { scroll:card.scrollHeight-card.clientHeight, within:c.left>=m.left&&c.right<=m.right&&c.top>=m.top&&c.bottom<=m.bottom };
        });
        expect(bounds.within).toBe(true);
        expect(bounds.scroll).toBeLessThanOrEqual(1);
        if(mode!=="route-analysis") await expect(page.locator(".ui-map-filter-card input")).toHaveCount(7);
        else {
          await expect(page.getByRole("navigation",{name:"ส่วนงานวิเคราะห์เส้นทาง"})).toHaveCount(0);
          await expect(page.locator('input[type="file"][multiple]')).toHaveCount(2);
          await expect(page.locator('select[multiple][name$="Versions"]')).toHaveCount(2);
        }
      }
      if (width === 1440 || width === 390) await page.screenshot({ path: resolve(evidence, `${mode}-${theme}-${width}.png`), fullPage: true });
    }
    if (mode.endsWith("datasets")) {
      const gap = await page.locator(".ui-map-stack > form").evaluate(form => {
        const fields = form.querySelector(".ui-map-fields")!.getBoundingClientRect();
        const action = form.querySelector("button[type=submit]")!.getBoundingClientRect();
        return action.top - fields.bottom;
      });
      expect(gap).toBeGreaterThanOrEqual(16);
    }
    if (mode === "route-analysis") {
      const card=page.locator(".ui-map-filter-card");
      await card.locator('input[name="title"]').fill("โครงการทดสอบการจัดวาง");
      await card.getByText("ชุดข้อมูลวิเคราะห์",{exact:true}).click();
      await expect(card.locator('input[name="baseFiles"]')).toBeVisible();
      await expect(card.locator('input[name="compareFiles"]')).toBeVisible();
      await card.getByText("เลือกจากชุดข้อมูลกลาง",{exact:true}).first().click();
      await expect(card.locator('select[name="baseVersions"]')).toBeVisible();
      expect(await card.evaluate(el=>el.scrollHeight-el.clientHeight)).toBeLessThanOrEqual(1);
      await card.getByText("ชุดข้อมูลวิเคราะห์",{exact:true}).click();
      await card.getByText("ตัวเลือกการวิเคราะห์",{exact:true}).click();
      await expect(card.locator('input[name="threshold"]')).toHaveValue("10");
      await expect(card.locator('input[name="interval"]')).toHaveValue("10");
      await card.locator('input[name="dedupe"]').check();
      await card.locator('input[name="threshold"]').fill("0");
      await card.getByText("ตัวเลือกการวิเคราะห์",{exact:true}).click();
      await card.getByRole("button",{name:"วิเคราะห์และบันทึกโครงการ",exact:true}).click();
      await expect(card.locator('input[name="threshold"]')).toBeVisible();
      await card.locator('input[name="threshold"]').fill("10");
      await card.getByText("ตัวเลือกการวิเคราะห์",{exact:true}).click();
      await card.locator(":scope > summary").click();
      await expect(card).not.toHaveAttribute("open");
      await card.locator(":scope > summary").click();
      await expect(card.locator('input[name="title"]')).toHaveValue("โครงการทดสอบการจัดวาง");
      await expect(card.locator('input[name="dedupe"]')).toBeChecked();
      await page.goto(`https://layout.test/fixture/${mode}?project=TEST-project`);
      await page.addScriptTag({content:script});
      await expect(card.getByText("ตัวกรองผลวิเคราะห์",{exact:true})).toBeVisible();
      await card.getByText("ตัวกรองผลวิเคราะห์",{exact:true}).click();
      await card.getByRole("textbox",{name:"ค้นหาเส้นทาง",exact:true}).fill("TEST-route");
      await expect.poll(()=>reads.some(url=>url.includes("/projects/TEST-project?")&&url.includes("q=TEST-route"))).toBe(true);
      await card.getByRole("button",{name:"ล้างตัวกรอง",exact:true}).click();
      await expect(card.getByRole("textbox",{name:"ค้นหาเส้นทาง",exact:true})).toHaveValue("");
      await expect(card.getByRole("button",{name:"วิเคราะห์ใหม่จากข้อมูลโครงการนี้",exact:true})).toBeVisible();
      await expect(page.getByRole("link",{name:"ส่งออก CSV",exact:true})).toBeVisible();
      expect(await card.evaluate(el=>el.scrollHeight-el.clientHeight)).toBeLessThanOrEqual(1);
    }
    if (["route-analysis", "site-sites", "site-reports"].includes(mode)) {
      if(mode!=="route-analysis") {
      const card = page.locator(".ui-map-filter-card");
      await card.getByLabel("ค้นหา Site Code หรือชื่อ", { exact:true }).fill("TEST-card");
      await expect.poll(()=>reads.some(url=>url.includes("/sites?")&&url.includes("q=TEST-card"))).toBe(true);
      await card.getByRole("button", { name:"ล้างตัวกรองไซต์" }).click();
      await expect(card.getByLabel("ค้นหา Site Code หรือชื่อ", { exact:true })).toHaveValue("");
      await card.locator("summary").click();
      await expect(card).not.toHaveAttribute("open");
      await card.locator("summary").click();
      await expect(card).toHaveAttribute("open");
      }
      await page.locator(".ui-map-header-tools").getByRole("combobox", { name:"แผนที่พื้นหลัง", exact:true }).selectOption("none");
      await page.getByRole("button", { name:"ขยายแผนที่", exact:true }).click();
      await expect(page.locator(".ui-map-expanded")).toBeVisible();
      await expect(page.locator(".ui-map-expanded").getByRole("combobox", { name:"แผนที่พื้นหลัง", exact:true })).toHaveValue("none");
      await page.keyboard.press("Escape");
      await expect(page.locator(".ui-map-expanded")).toHaveCount(0);
      await expect(page.locator(".ui-map-header-tools").getByRole("combobox", { name:"แผนที่พื้นหลัง", exact:true })).toHaveValue("none");
    }
    expect(errors).toEqual([]);
  });
}
