import {expect,test} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {settlePresentation} from "./settle";
import {checkVisibleFontFloor} from "./presentation-checks";
for(const theme of ["light","dark"])for(const width of [1440,1024,390])test(`admin presentation ${theme} ${width}`,async({page})=>{
  await page.setViewportSize({width,height:900});await page.addInitScript(t=>localStorage.setItem("permission-next-workspace-theme",t),theme);
  await page.goto("/login");await page.locator("input[name=email]").fill("admin@example.test");await page.locator("input[name=password]").fill("FixturePassword123!");await page.getByRole("button",{name:"เข้าสู่ระบบ",exact:true}).click();await page.waitForURL("http://localhost:3100/");
  await page.goto("/admin");await settlePresentation(page);await checkVisibleFontFloor(page);
  const axe=await new AxeBuilder({page}).analyze();expect(axe.violations.filter(v=>["serious","critical"].includes(v.impact||""))).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(width===390){const audit=page.getByRole("region",{name:"ตารางประวัติการเปลี่ยนแปลง",exact:true});await audit.focus();await expect(audit).toBeFocused();await page.keyboard.press("ArrowRight");await expect.poll(()=>audit.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);}
  await page.screenshot({path:`docs/quality/ux-login-evidence/${process.env.UX_PHASE||"cp5"}-admin-${theme}-${width}.png`,fullPage:true});
});
