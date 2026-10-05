import {expect,test} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
async function login(page:import("@playwright/test").Page,staff=false){await page.goto("/login");await page.locator('input[name="email"]').fill(staff?"parity-staff@example.test":"parity-admin@example.test");await page.locator('input[name="password"]').fill("FixturePassword123!");await page.getByRole("button",{name:"เข้าสู่ระบบ",exact:true}).click();await page.waitForURL(url=>url.pathname!=="/login");}
for(const theme of ["light","dark"])for(const width of [1440,390])test(`parity screens ${theme} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.addInitScript(t=>localStorage.setItem("permission-next-workspace-theme",t),theme);await login(page);
 for(const route of ["/work/assign","/work/people","/work/tracker","/work/reports","/work/kpi","/admin"]){
  await page.goto(route);await expect(page.locator("h1")).toHaveCount(1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const axe=await new AxeBuilder({page}).analyze();expect(axe.violations.filter(v=>["serious","critical"].includes(v.impact??""))).toEqual([]);
  await page.screenshot({path:`docs/quality/work-parity-evidence/${route.slice(1).replaceAll("/","-")}-${theme}-${width}.png`,fullPage:true});
 }
});
test("staff accepts task with modal and completion retains note history",async({page})=>{
 await login(page,true);await page.goto("/work/mine");
 const row=page.getByRole("row").filter({hasText:"PARITY-UI-JOB"});
 if(await row.getByRole("button",{name:"รับงาน",exact:true}).count()){
  const opener=row.getByRole("button",{name:"รับงาน",exact:true});await opener.click();const dialog=page.getByRole("dialog");await expect(dialog).toBeVisible();await page.keyboard.press("Escape");await expect(opener).toBeFocused();await opener.click();await dialog.getByRole("button",{name:"ยืนยัน",exact:true}).click();await expect(dialog).not.toBeVisible();
 }
 if(await row.getByRole("button",{name:"เสร็จสิ้น",exact:true}).count()){
  await row.getByRole("button",{name:"เสร็จสิ้น",exact:true}).click();await page.getByRole("dialog").getByRole("button",{name:"ยืนยัน",exact:true}).click();await expect(page.getByRole("dialog")).not.toBeVisible();
 }
 await row.getByRole("link").first().click();await page.getByLabel("เพิ่มบันทึก",{exact:true}).fill("บันทึกหลังเสร็จจากการทดสอบหน้าจอ");await page.getByRole("button",{name:"เพิ่มบันทึก",exact:true}).click();await expect(page.getByRole("listitem").filter({hasText:"บันทึกหลังเสร็จจากการทดสอบหน้าจอ"}).first()).toBeVisible();
 await page.goto("/work/reports");const response=await page.request.get("/api/work/export");expect(response.status()).toBe(200);expect(await response.text()).toContain("PARITY-UI-JOB");expect(await response.text()).not.toContain("Concurrent fixture");
 expect((await page.request.get("/api/work/export?owner=bad")).status()).toBe(400);
 await page.goto("/work/assign");await expect(page.getByRole("alert").first()).toContainText("สิทธิ์");await expect(page.locator('form input[name="jobs"]')).toHaveCount(0);
});
test("personal creation previews server SLA and admin messages appear on home",async({page})=>{
 await login(page,true);await page.goto("/work/new");const job=`UI-CREATE-${crypto.randomUUID()}`;
 await page.getByRole("combobox",{name:"Main KPI",exact:true}).selectOption({label:"งานทดสอบ"});await page.getByRole("combobox",{name:"Sub KPI",exact:true}).selectOption({label:"ตรวจเอกสาร"});await page.locator('textarea[name="jobs"]').fill(job);
 await page.getByRole("button",{name:"ดู deadline ล่วงหน้า",exact:true}).click();await expect(page.getByRole("status").filter({hasText:/กำหนดส่ง/})).toBeVisible();
 await page.getByRole("button",{name:"เพิ่มงาน",exact:true}).click();await expect(page.getByRole("status").filter({hasText:/เรียบร้อย/})).toBeVisible();await page.goto("/work/mine");await expect(page.getByRole("row").filter({hasText:job})).toBeVisible();
 await page.context().clearCookies();await login(page);await page.goto("/admin?section=announcement");const message=`ประกาศทดสอบ ${crypto.randomUUID()}`;
 const announcement=page.locator("form").filter({has:page.getByRole("heading",{name:"เพิ่มประกาศ",exact:true})});await announcement.locator('textarea[name="message"]').fill(message);await announcement.locator('input[name="isActive"]').check();await announcement.getByRole("button",{name:"บันทึก",exact:true}).click();await expect(announcement.getByRole("status")).toHaveText("บันทึกเรียบร้อยแล้ว");
 await page.goto("/admin?section=systems");const system=page.locator("form").filter({has:page.getByRole("heading",{name:"เพิ่มลิงก์",exact:true})});const name=`ระบบทดสอบ ${crypto.randomUUID()}`;await system.locator('input[name="name"]').fill(name);await system.locator('input[name="url"]').fill("/work");await system.locator('input[name="visibleToAll"]').check();await system.getByRole("button",{name:"บันทึก",exact:true}).click();await expect(system.getByRole("status")).toHaveText("บันทึกเรียบร้อยแล้ว");
 await page.goto("/");await expect(page.getByText(message,{exact:true})).toBeVisible();await expect(page.getByRole("link",{name,exact:true})).toHaveAttribute("href","/work");
});
