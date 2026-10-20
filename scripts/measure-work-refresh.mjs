import {spawn} from 'node:child_process';
import {writeFile} from 'node:fs/promises';
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const base='http://localhost:3110',kinds=[];
const child=spawn(process.execPath,['scripts/sync-session-test-db.mjs','server'],{cwd:process.cwd(),windowsHide:true,env:{...process.env,PARITY_QUERY_METRICS:'1'},stdio:['ignore','pipe','pipe']});
let buffer='',ready=false,failed=false;
child.stdout.on('data',chunk=>{buffer+=chunk.toString();let end;while((end=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,end);buffer=buffer.slice(end+1);if(line.includes('Ready in'))ready=true;try{const event=JSON.parse(line);if(event.event==='fixture.db.query')kinds.push(event.kind);}catch{}}});
child.stderr.on('data',chunk=>{if(chunk.toString().includes('EADDRINUSE'))failed=true;});
let browser;
try{
 for(let attempt=0;!ready&&attempt<150;attempt++){if(failed||child.exitCode!==null)throw Error('Dedicated fixture server failed');await new Promise(resolve=>setTimeout(resolve,100));}
 assert(ready);console.log('Fixture ready');browser=await chromium.launch({headless:true});const context=await browser.newContext({baseURL:base});const page=await context.newPage();page.setDefaultTimeout(15000);
 await page.goto('/login?next=%2Fwork');await page.getByLabel('อีเมล',{exact:true}).fill('sync-admin@example.test');await page.getByLabel('รหัสผ่าน',{exact:true}).fill('FixturePassword123!');await page.getByRole('button',{name:'เข้าสู่ระบบ',exact:true}).click();await page.getByRole('heading',{name:'ภาพรวมงานของฉัน',exact:true}).waitFor();
 const measurements=[];
  await page.close();
 for(const route of ['/work/team','/work/mine']){
  console.log('Measure '+route);await new Promise(resolve=>setTimeout(resolve,100));
  const before=kinds.length,start=performance.now();
  const response=await context.request.get(route+'?_rsc=fixture-measure',{headers:{rsc:'1'},timeout:15000});await response.text();await new Promise(resolve=>setTimeout(resolve,50));
  const queries=kinds.slice(before),byKind={};for(const kind of queries)byKind[kind]=(byKind[kind]||0)+1;
  assert.equal(response.status(),200);assert(queries.length>0);
  measurements.push({route,queries:queries.length,byKind,status:response.status(),elapsedMs:Math.round(performance.now()-start),request:'authenticated RSC refresh'});
 }
await writeFile('docs/quality/sync-session-health/refresh-query-counts.json',JSON.stringify({syntheticFixture:true,requestScopedIdentityCache:true,measurements,queryTextLogged:false,productionBenchmark:false},null,2)+'\n');
 console.log(JSON.stringify(measurements));
}finally{await browser?.close();child.kill();}
