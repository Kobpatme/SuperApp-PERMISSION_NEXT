import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
const browser=await chromium.launch(); const context=await browser.newContext({viewport:{width:1440,height:900}}); const page=await context.newPage();
try {
 await page.goto('http://localhost:3100/login'); await page.locator('input[name=email]').fill('staff@example.test'); await page.locator('input[name=password]').fill('FixturePassword123!'); await page.getByRole('button',{name:'เข้าสู่ระบบ',exact:true}).click(); await page.waitForURL('http://localhost:3100/');
 await page.locator('h1').first().waitFor({state:'visible'});
 await page.evaluate(async()=>{await document.fonts.ready;await Promise.all(document.getAnimations().filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>undefined)));});
 console.log(await page.evaluate(()=>['.record-code','.module-directory-copy'].map(s=>{let e=document.querySelector(s);const parents=[];while(e){let c=getComputedStyle(e);parents.push({tag:e.tagName,cl:e.className,color:c.color,background:c.backgroundColor,opacity:c.opacity,animation:c.animationName});e=e.parentElement;}return parents;})));
 const results=await new AxeBuilder({page}).analyze();console.log(JSON.stringify(results.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),null,2));
} finally {await browser.close();}

