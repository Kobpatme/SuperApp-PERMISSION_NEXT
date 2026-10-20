import { chromium } from 'playwright';
const width=Number(process.argv[3]||320);const route=process.argv[2]||'/';
const browser=await chromium.launch(); const page=await browser.newPage({viewport:{width,height:900}});
try {
 await page.goto('http://localhost:3100/login'); await page.locator('input[name=email]').fill(route==='/admin'?'admin@example.test':'staff@example.test'); await page.locator('input[name=password]').fill('FixturePassword123!'); await page.getByRole('button',{name:'เข้าสู่ระบบ',exact:true}).click(); await page.waitForURL('http://localhost:3100/'); await page.goto(`http://localhost:3100${route}`);await page.locator('h1').first().waitFor({state:'visible'});await page.evaluate(()=>document.fonts.ready);
 console.log(await page.evaluate(()=>[...document.querySelectorAll('body *')].map(e=>({tag:e.tagName,cl:e.className,left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right,width:e.scrollWidth,client:e.clientWidth})).filter(e=>e.right>innerWidth+1||e.left< -1).slice(0,40)));
} finally { await browser.close(); }
