import {expect,test} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
async function login(page:import("@playwright/test").Page,staff=false){await page.goto("/login");await page.locator('input[name="email"]').fill(staff?"parity-staff@example.test":"parity-admin@example.test");await page.locator('input[name="password"]').fill("FixturePassword123!");await page.getByRole("button",{name:"เข้าสู่ระบบ",exact:true}).click();await page.waitForURL(url=>url.pathname!=="/login");}
for(const theme of ["light","dark"])for(const width of [1440,390])test(`admin sections ${theme} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.addInitScript(t=>localStorage.setItem("permission-next-workspace-theme",t),theme);await login(page);const errors:string[]=[];page.on("pageerror",error=>errors.push(error.message));
 for(const section of ["overview","users","positions","teams","roles","kpi","personal-kpi","calendar","recalculate","systems","announcement","audit","restore"]){
  await page.goto(`/admin?section=${section}`);await expect(page.locator("h1")).toHaveText("ผู้ดูแลระบบ");await expect(page.locator('.admin-navigation a[aria-current="page"]')).toHaveAttribute("href",`/admin?section=${section}`);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const axe=await new AxeBuilder({page}).analyze();expect(axe.violations.filter(v=>["serious","critical"].includes(v.impact??""))).toEqual([]);
  if(["overview","users","kpi","calendar","systems"].includes(section))await page.screenshot({path:`docs/quality/admin-layout/${section}-${theme}-${width}.png`,fullPage:true});
 }
 await page.goto("/admin?section=users");await page.getByRole("searchbox",{name:"ค้นหาผู้ใช้"}).fill("no-matching-fixture");await expect(page.getByRole("status").filter({hasText:"แสดง 0 จาก"})).toBeVisible();
 await page.getByRole("searchbox",{name:"ค้นหาผู้ใช้"}).fill("");const opener=page.getByRole("button",{name:"จัดการการเข้าถึง",exact:true}).first();await opener.click();await expect(page.getByRole("dialog")).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.keyboard.press("Escape");await expect(opener).toBeFocused();
 expect(errors).toEqual([]);
});
test("section navigation supports keyboard, history and permission boundaries",async({page})=>{
 await login(page);await page.goto("/admin");const navigation=page.getByRole("navigation",{name:"ส่วนจัดการระบบ"});const users=navigation.getByRole("link",{name:"ผู้ใช้",exact:true});await users.focus();await page.keyboard.press("Enter");await expect(page).toHaveURL(/section=users/);await expect(page.getByRole("searchbox",{name:"ค้นหาผู้ใช้"})).toBeVisible();await page.goBack();await expect(page).toHaveURL(/\/admin$/);await expect(page.locator(".admin-overview")).toBeVisible();
 await page.context().clearCookies();await login(page,true);await page.goto("/admin?section=roles");await expect(page).toHaveURL(/\/$/);await expect(page.locator('.admin-capability-matrix')).toHaveCount(0);
});
