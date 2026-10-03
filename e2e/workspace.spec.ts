import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { settlePresentation } from "./settle";
const forbidden = /Argon2|RBAC|ฐานข้อมูล|DATABASE|\bNAS\b|\bsession\b|\bserver\b|Developer|readiness|foundation|Organization Identity|SECURE FIRST SIGN-IN|\bstack\b|\btoken\b/i;
for (const theme of ["light", "dark"] as const) for (const width of [1440,1024,390,320]) {
  test(`staff modules ${theme} ${width}`, async ({ page }) => {
    const runtimeErrors: string[]=[];
    page.on("pageerror",error=>runtimeErrors.push(error.name));
    await page.setViewportSize({width,height:900});
    await page.addInitScript(value=>localStorage.setItem("permission-next-workspace-theme",value),theme);
    await page.goto("/login"); await page.locator("input[name=email]").fill("staff@example.test"); await page.locator("input[name=password]").fill("FixturePassword123!");
    await page.getByRole("button",{name:"เข้าสู่ระบบ",exact:true}).click(); await page.waitForURL("http://localhost:3100/");
    for(const [name,route] of [["dashboard","/?preview=1"],["work","/work"],["buildings","/buildings"],["guarantees","/guarantees"],["403","/work/team"],["404","/missing-ux-fixture"]]) {
      await page.goto(route);
      expect(await page.locator("body").innerText()).not.toMatch(forbidden);
      await expect(page.locator(".preview-notice")).toHaveCount(0);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      await settlePresentation(page);
      const results=await new AxeBuilder({page}).analyze();
      expect(results.violations.filter(v=>["serious","critical"].includes(v.impact||""))).toEqual([]);
      await page.screenshot({path:`docs/quality/ux-login-evidence/${process.env.UX_PHASE||'cp2'}-${name}-staff-${theme}-${width}.png`,fullPage:true});
      if(name === "buildings") {
        await page.getByRole("textbox",{name:"ค้นหาอาคาร",exact:true}).fill("อาคารศูนย์ปฏิบัติการ");
        await page.getByRole("option").first().click();
        await expect(page.getByRole("dialog")).toBeVisible();
        expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
        await settlePresentation(page);
        const drawer=await new AxeBuilder({page}).analyze();
        expect(drawer.violations.filter(v=>["serious","critical"].includes(v.impact||""))).toEqual([]);
        await page.screenshot({path:`docs/quality/ux-login-evidence/${process.env.UX_PHASE||'cp2'}-building-detail-staff-${theme}-${width}.png`,fullPage:true});
        await page.route("**/api/nas/building-documents?**", route=>route.fulfill({status:503,json:{error:"synthetic_internal_failure"}}));
        await page.getByRole("tab",{name:"เอกสาร",exact:true}).click();
        await expect(page.getByText("เปิดเอกสารไม่ได้ในตอนนี้ ลองใหม่อีกครั้ง",{exact:true})).toBeVisible();
        expect(await page.locator("body").innerText()).not.toContain("synthetic_internal_failure");
      }
      expect(runtimeErrors).toEqual([]);
    }
  });
}
