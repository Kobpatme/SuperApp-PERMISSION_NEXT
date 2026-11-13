import { build } from "esbuild";
import {createServer} from "node:http";
import {resolve} from "node:path";
const bundle=await build({entryPoints:["tests/fixtures/permission-out-browser.tsx"],bundle:true,write:false,outdir:".data/pout-browser-bundle",platform:"browser",format:"iife",jsx:"automatic",loader:{".png":"dataurl"},alias:{"next/link":resolve("tests/fixtures/review-browser-router.tsx"),"next/navigation":resolve("tests/fixtures/review-browser-router.tsx"),"@":resolve("src")}});
const js=bundle.outputFiles.find(f=>f.path.endsWith(".js")),css=bundle.outputFiles.find(f=>f.path.endsWith(".css"));
const dataset="00000000-0000-4000-8000-000000000002",project="00000000-0000-4000-8000-000000000003";
const site={key:"SITE-001",code:"SITE-001",name:"ไซต์ทดสอบ",regional:"กลาง",area:"กรุงเทพ",province:"กรุงเทพมหานคร",grade:"A",type:"Node",owner:"ทีมทดสอบ",latitude:13.75,longitude:100.5,customers:20,properties:{"Site grade":"A"}};
const server=createServer(async(request,response)=>{
  const url=new URL(request.url,"http://127.0.0.1:3227");
  if(url.pathname==="/app.js"){response.setHeader("Content-Type","application/javascript");response.end(js.contents);return;}
  if(url.pathname==="/app.css"){response.setHeader("Content-Type","text/css");response.end(css.contents);return;}
  if(/^\/api\/(permission-out|site-facility)\//.test(url.pathname)){
    response.setHeader("Content-Type","application/json");const path=url.pathname.replace(/^\/api\/(permission-out|site-facility)\//,"");
    if(request.method==="POST"){request.resume();response.statusCode=400;response.end(JSON.stringify({error:"ข้อมูลทดสอบ: ไม่บันทึกข้อมูลจริง"}));return;}
    const rows=[{datasetId:dataset,baseVersion:dataset,key:site.key,data:site,editVersion:0,opex:null}];
    const segment={key:"route",name:"เส้นทางทดสอบ",coords:[[100,13],[100.001,13]],diameter:null,poles:null,province:"กรุงเทพมหานคร",provinces:["กรุงเทพมหานคร"],cableStatus:"",sourceFile:"test.kml",metadata:{},category:"network",status:"new",overlapType:"none",length:108};
    let data=[];
    if(path==="network")data={items:[segment],limited:false};
    if(path.startsWith("sites"))data={rows:url.searchParams.get("q")==="ไม่พบ"?[]:rows,total:url.searchParams.get("q")==="ไม่พบ"?0:1,withoutCoordinates:1,yearly:null,monthly:null,page:1,groups:[],mapLimited:false};
    if(path===`sites/${dataset}`)data=rows[0];
    if(path==="site-options")data={province:["กรุงเทพมหานคร"],grade:["A"]};
    if(path==="datasets")data=[{id:dataset,name:"ชุดข้อมูลทดสอบ",kind:"sites",activeVersion:dataset,version:1}];
    if(path===`datasets/${dataset}`)data=[{id:project,state:"staging",filename:"test.xlsx",report:{added:1,updated:0,removed:0,unchanged:0}}];
    if(path.startsWith("projects/"))data={id:project,title:"โครงการทดสอบ",snapshot:{segments:url.searchParams.get("status")==="remove"?[]:[segment],areas:[]},fee:null,totalSegments:1};
    response.end(JSON.stringify(data));return;
  }
  response.setHeader("Content-Type","text/html; charset=utf-8");response.end('<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Permission Out component fixture</title><link rel="stylesheet" href="/app.css"><style>body{font:14px sans-serif;background:var(--color-bg);color:var(--color-text);margin:16px}*{box-sizing:border-box}a{color:var(--color-brand)}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden}h1{font-size:24px}h2{font-size:19px}h3{font-size:16px}p{line-height:1.6}fieldset{margin:0}</style></head><body><div id="root"></div><script src="/app.js"></script></body></html>');
});
server.listen(3227,"127.0.0.1",()=>console.log("Permission Out component fixture on loopback port 3227"));
