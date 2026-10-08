// Explicit owner-authorized local UAT only. Never called by ordinary test runners.
import {readFile,writeFile} from 'node:fs/promises';
import {parse} from 'dotenv';
import {randomBytes,randomUUID,createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import postgres from 'postgres';
import {chromium,expect} from '@playwright/test';
if(process.argv[2]!=='--allow-local-main')throw Error('Explicit local main authorization flag required');
const env=parse(await readFile('.env.local','utf8')),url=new URL(env.DATABASE_URL);
assert(['localhost','127.0.0.1'].includes(url.hostname));assert.equal(url.pathname,'/permission_superapp_dev');assert.equal(url.port||'5432','5432');
const state=JSON.parse(await readFile('.data/car-booking-uat/state.json','utf8'));
assert.equal(state.installed,true);
const db=postgres(url.href,{max:1,prepare:false}),token=randomBytes(32).toString('base64url'),tokenHash=createHash('sha256').update(token).digest('hex'),sessionId=randomUUID();
let browser;
const evidence={localMain:true,temporarySession:true,domainWrites:false,apiChecks:[],browserChecks:[],sessionRevoked:false};
const audit=async(tx,action)=>tx`insert into audit_logs(actor_id,module_id,action,entity_type,entity_id,request_id,metadata) values(${state.actor},'core',${action},'auth_session',${sessionId},${randomUUID()},${tx.json({ownerAuthorizedLocalUat:true,temporarySession:true,expiresWithinMinutes:10})})`;
try{
 await db.begin(async tx=>{await tx`insert into auth_sessions(id,user_id,token_hash,expires_at,user_agent) values(${sessionId},${state.actor},${tokenHash},now()+interval '10 minutes','Owner-authorized local UAT smoke')`;await audit(tx,'auth.uat.session.created');});
 browser=await chromium.launch({headless:true});const context=await browser.newContext({baseURL:'http://localhost:3000',viewport:{width:1440,height:1000}});
 const noSession=await context.request.get('/api/car-booking/cars');assert.equal(noSession.status(),401);evidence.apiChecks.push({case:'anonymous',status:401});
 await context.addCookies([{name:'pn_session',value:token,domain:'localhost',path:'/',httpOnly:true,sameSite:'Lax',expires:Math.floor(Date.now()/1000)+600}]);
 const routes=['/api/car-booking/cars','/api/car-booking/settings','/api/car-booking/bookings?start=2026-10-01T00%3A00%3A00Z&end=2026-11-01T00%3A00%3A00Z','/api/car-booking/calendar?start=2026-10-01T00%3A00%3A00Z&end=2026-11-01T00%3A00%3A00Z','/api/car-booking/reports?month=all','/api/car-booking/dashboard?month=all','/api/car-booking/osp-sync'];
 for(const route of routes){const response=await context.request.get(route);assert.equal(response.status(),200,route);await response.json();evidence.apiChecks.push({route:route.split('?')[0],status:200});}
 const denied=await context.request.post('/api/car-booking/cars',{headers:{origin:'https://invalid.example'},data:{}});assert.equal(denied.status(),403);evidence.apiChecks.push({case:'invalid_origin',status:403});
 const page=await context.newPage();const errors=[];page.on('pageerror',()=>errors.push('pageerror'));
 await page.goto('/car-booking');await page.getByRole('heading',{name:'ระบบจองรถ',exact:true}).waitFor();
 await expect(page.getByRole('button',{name:'โหลดใหม่',exact:true})).toBeEnabled({timeout:30000});
 await page.getByRole('button',{name:'จัดการรถ',exact:true}).click();await page.getByRole('button',{name:'เพิ่มรถ',exact:true}).waitFor();evidence.browserChecks.push('main_car_admin_ui');
 await page.screenshot({path:'.data/car-booking-uat/main-desktop.png',fullPage:true});
 await page.getByRole('button',{name:'ชั้นจอด',exact:true}).click();await page.getByRole('button',{name:'รายงาน OSP',exact:true}).click();await page.getByRole('button',{name:'แดชบอร์ด',exact:true}).click();evidence.browserChecks.push('settings_reports_dashboard');
 await page.goto('/admin/car-booking');await page.getByRole('heading',{name:/สิทธิ์.*จองรถ/}).waitFor();evidence.browserChecks.push('main_car_access_editor');
 await page.setViewportSize({width:390,height:844});await page.goto('/car-booking');await page.getByRole('heading',{name:'ระบบจองรถ',exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);evidence.browserChecks.push('mobile_no_page_overflow');assert.equal(errors.length,0);evidence.pageErrors=0;
}catch(error){evidence.failed=true;evidence.errorType=error.name;await writeFile('.data/car-booking-uat/browser-error.txt',error.message??error.name);console.error('Local main smoke failed:',error.message?.startsWith('/api/')?error.message:'Inspect private trace/log');process.exitCode=1;}
finally{
 await browser?.close();
 await db.begin(async tx=>{await tx`delete from auth_sessions where id=${sessionId} and token_hash=${tokenHash}`;await audit(tx,'auth.uat.session.revoked');});
 assert.equal((await db`select id from auth_sessions where id=${sessionId}`).length,0);evidence.sessionRevoked=true;
 await writeFile('docs/quality/car-booking-uat/main-browser.json',JSON.stringify(evidence,null,2)+'\n');await db.end();
 if(!evidence.failed)console.log('Local main API/browser smoke passed; temporary session revoked');
}
