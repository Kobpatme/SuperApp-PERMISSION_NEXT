import { chromium } from 'playwright';
const browser=await chromium.launch(); const page=await browser.newPage({viewport:{width:320,height:900}});
try {
 await page.goto('http://localhost:3100/login'); await page.locator('input[name=email]').fill('staff@example.test'); await page.locator('input[name=password]').fill('FixturePassword123!'); await page.getByRole('button',{name:'เข้าสู่ระบบ',exact:true}).click(); await page.waitForURL('http://localhost:3100/');
 console.log(await page.evaluate(()=>[...document.querySelectorAll('body *')].map(e=>({tag:e.tagName,cl:e.className,left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right,width:e.scrollWidth,client:e.clientWidth})).filter(e=>e.right>321||e.left< -1).slice(0,30)));
} finally { await browser.close(); }
