// Execute only the frozen PDF renderer, in an offline browser with synthetic inputs.
// Never execute source stores/auth, modify the source checkout, or fetch remote bytes.
import { readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import ts from "typescript";
import { chromium } from "@playwright/test";
const root=resolve("_discovery_sources/METRIX"), sourcePath="components/pdf/ntFormFiller.ts", sha="f87220bf94b765e4896388632c3dbeabb5286510";
if(execFileSync("git",["-C",root,"rev-parse","HEAD"],{encoding:"utf8"}).trim()!==sha)throw new Error("Frozen source SHA changed");
const source=await readFile(resolve(root,sourcePath),"utf8"), committed=execFileSync("git",["-C",root,"show",`${sha}:${sourcePath}`],{encoding:"utf8"});
const hash=text=>createHash("sha256").update(text.replaceAll("\r\n","\n")).digest("hex");if(hash(source)!==hash(committed))throw new Error("Source renderer differs from frozen commit");
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
const input=JSON.parse(await readFile("tests/fixtures/metrix-golden/validation.json","utf8")).fixtures[0].input;
const request={id:"RQ-TEST",designData:{...input,cableCount:3,designContactName:"ผู้ประสานงานทดสอบ",routeDetail:"ถนนทดสอบในกรุงเทพมหานคร"}};
const browser=await chromium.launch(), page=await browser.newPage();let blocked=0;
try{
 await page.route("**/*",async route=>{
  const url=new URL(route.request().url()), path=decodeURIComponent(url.pathname);
  if(url.origin==="http://duct-pdf-fixture.test"&&path==="/")return route.fulfill({contentType:"text/html",body:'<!doctype html><html><head><style>@font-face{font-family:Sarabun;src:url(/fonts/Sarabun-Regular.ttf)}body{font-family:Sarabun}</style></head><body>ข้อมูลจำลอง</body></html>'});
  if(url.origin==="http://duct-pdf-fixture.test"&&path==="/pdf.mjs")return route.fulfill({contentType:"text/javascript",body:await readFile("node_modules/pdfjs-dist/build/pdf.mjs")});
  if(url.origin==="https://unpkg.com"&&/^\/pdfjs-dist@[\d.]+\/build\/pdf.worker.min.mjs$/.test(path))return route.fulfill({contentType:"text/javascript",headers:{"Access-Control-Allow-Origin":"*"},body:await readFile("node_modules/pdfjs-dist/build/pdf.worker.min.mjs")});
  if(url.origin==="http://duct-pdf-fixture.test"&&["/fonts/Sarabun-Regular.ttf","/templates/แบบฟอร์มคำขอใช้บริการท่อร้อยสายสื่อสารตัวอย่าง.pdf"].includes(path))return route.fulfill({body:await readFile(resolve(root,"public",path.slice(1)))});
  blocked++;await route.abort();
 });
 await page.goto("http://duct-pdf-fixture.test/");await page.evaluate(async()=>{await document.fonts.load("14px Sarabun");globalThis.sourcePdfJs=await import("/pdf.mjs");});
 await page.addScriptTag({path:"node_modules/pdf-lib/dist/pdf-lib.min.js"});await page.addScriptTag({path:"node_modules/@pdf-lib/fontkit/dist/fontkit.umd.min.js"});
 await page.addScriptTag({content:`var process={env:{NODE_ENV:"production"}},exports={};function require(name){if(name==="pdf-lib")return PDFLib;if(name==="@pdf-lib/fontkit")return fontkit;if(name==="pdfjs-dist")return sourcePdfJs;throw new Error("Unexpected source import");}\n${js}\nwindow.sourceRenderer=exports;`});
 const signature=(await readFile("tests/fixtures/metrix-golden/signature.png")).toString("base64");
 const result=await page.evaluate(async({request,signature})=>{const original=await sourceRenderer.fillNTDuctRentalForm(request),signed=await sourceRenderer.generateSignedPermission1PdfBytes(request,{signatureDataUrl:`data:image/png;base64,${signature}`,signerName:"ผู้ลงนามทดสอบ",signDateText:"01/01/2031"});return {original:Array.from(original),signed:Array.from(signed)};},{request,signature});
 await writeFile("docs/quality/duct-rental/source-nt-form.pdf",Buffer.from(result.original));await writeFile("docs/quality/duct-rental/source-nt-form-signed.pdf",Buffer.from(result.signed));
 await writeFile("docs/quality/duct-rental/source-pdf-evidence.json",JSON.stringify({sourceCommit:sha,rendererSha256:hash(source),synthetic:true,networkBytesFetched:0,unknownRequestsBlocked:blocked,approvedDifference:"DQ03 source count=1; native count=3",rendererDifference:"source canvas rasterization; native flattened vector text"},null,2));
 console.log("Created two offline source PDF references from frozen renderer and synthetic inputs");
}finally{await browser.close();}
