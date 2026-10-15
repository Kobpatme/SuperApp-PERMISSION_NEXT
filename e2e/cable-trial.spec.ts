import {test,expect,type Page} from "@playwright/test";
import {readFile,mkdir,writeFile} from "node:fs/promises";
import postgres from "postgres";
import AxeBuilder from "@axe-core/playwright";
let db:ReturnType<typeof postgres>;
test.beforeAll(async()=>{const fixture=JSON.parse(await readFile('.data/duct-rental-browser/runtime.json','utf8')),u=new URL(fixture.databaseUrl);if(u.pathname!=="/permission_next_duct_rental_test"||!["localhost","127.0.0.1","[::1]"].includes(u.hostname))throw Error("Fixture guard");db=postgres(u.href,{max:1,prepare:false,onnotice:()=>{}});await db`update core_module_settings set enabled=true where module_id='duct-rental'`;await mkdir('.data/cable-trial-evidence',{recursive:true});});
test.afterAll(async()=>{await db`update core_module_settings set enabled=false where module_id='duct-rental'`;await db.end();});
async function login(page:Page,email="admin@duct.example.test"){await page.goto('/login');await page.getByLabel('อีเมล',{exact:true}).fill(email);await page.getByLabel('รหัสผ่าน',{exact:true}).fill('FixtureDuct123!');await page.getByRole('button',{name:'เข้าสู่ระบบ',exact:true}).click();await expect(page).not.toHaveURL(/\/login/);await page.goto('/duct-rental/communication-cable');}
test('PEA and MEA requests persist, validate, revise, complete and archive',async({page})=>{
 test.setTimeout(180000);await login(page);
 for(const authority of ['PEA','MEA']){
 const title=`TEST-CABLE-${authority}-${Date.now()}`;
 await page.getByRole('button',{name:'สร้างคำขอพาดสาย',exact:true}).click();
 await page.getByLabel('หน่วยงาน',{exact:true}).selectOption(authority);
 await page.getByLabel('ชื่อโครงการ',{exact:true}).fill(title);
 await page.getByRole('button',{name:'บันทึกร่าง',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
 await page.reload();const row=page.locator('tbody tr').filter({hasText:title});await expect(row).toContainText(authority);
 async function open(){await row.getByRole('button',{name:'เปิดรายการ',exact:true}).click();}
 async function action(name:string){await page.getByRole('button',{name,exact:true}).click();await page.getByRole('button',{name:'ยืนยัน',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);}
 await open();await page.getByRole('button',{name:'ส่งตรวจเอกสาร',exact:true}).click();await page.getByRole('button',{name:'ยืนยัน',exact:true}).click();await expect(page.getByRole('dialog').getByRole('alert')).toContainText('กรุณากรอกเส้นทาง');
 for(const [label,value]of [['เส้นทาง','route'],['จุดต้นทาง','A'],['จุดปลายทาง','B'],['ประเภทสาย','ADSS']])await page.getByLabel(label,{exact:true}).fill(value);
 await action('ส่งตรวจเอกสาร');await open();await page.getByLabel('เลขรับเรื่อง',{exact:true}).fill('TEST-SUBMIT');await action('ยืนยันยื่นขออนุญาตแล้ว');
 await open();await page.getByLabel('เหตุผลส่งกลับ / หมายเหตุการดำเนินการ',{exact:true}).fill('ปรับแบบทดสอบ');await action('ส่งกลับแก้ไข');await expect(row).toContainText('แก้ไขแบบ');
 await open();await action('ส่งตรวจเอกสารฉบับแก้ไข');await open();await action('ยืนยันยื่นขออนุญาตแล้ว');await open();await page.getByLabel('เลขใบอนุญาต',{exact:true}).fill('TEST-PERMIT');await action('ยืนยันได้รับใบอนุญาตแล้ว');
 await open();await action('ส่งให้ทีมออกแบบยืนยัน');await open();await action('ยืนยันแบบและส่งติดตั้ง');await open();await page.getByLabel('หมายเหตุ / ผลติดตั้งและตรวจรับ',{exact:true}).fill('ผลติดตั้งและตรวจรับจำลอง');await action('ตรวจรับและปิดงาน');await expect(row).toContainText('ปิดงาน');
 await open();await expect(page.getByRole('button',{name:'บันทึกข้อมูล',exact:true})).toHaveCount(0);await expect(page.getByRole('heading',{name:'ประวัติการดำเนินการ',exact:true})).toBeVisible();await page.getByRole('button',{name:'ปิด',exact:true}).click();
 for(const [width,theme]of [[1440,'light'],[390,'dark']] as const){await page.setViewportSize({width,height:1000});await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);const results=await new AxeBuilder({page}).include('#workspace-content').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(results.violations).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);if(width===1440)await page.locator('aside.workspace-sidebar [aria-label="เมนูเช่าท่อและพาดสาย"]').scrollIntoViewIfNeeded();await page.screenshot({path:`.data/cable-trial-evidence/${authority}-${theme}-${width}.png`,fullPage:true});}
 await open();await action('เก็บเข้าประวัติ');await expect(row).toHaveCount(0);
 }
});
test('read-only account cannot create or mutate cable requests',async({page})=>{await login(page,'viewer@duct.example.test');await expect(page.getByRole('button',{name:'สร้างคำขอพาดสาย',exact:true})).toHaveCount(0);const response=await page.request.post('/api/duct-rental/cables',{headers:{Origin:'http://localhost:3118','Idempotency-Key':crypto.randomUUID()},data:{authority:'PEA',projectName:'must deny'}});expect(response.status()).toBe(403);await writeFile('.data/cable-trial-evidence/denial.json',JSON.stringify({createStatus:response.status()}));});
