import {expect,test} from "@playwright/test";
import fs from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import {settlePresentation} from "./settle";
import {checkVisibleFontFloor} from "./presentation-checks";
// Isolated render fixture of the actual components; no production fault/backdoor route.
for(const theme of ["light","dark"])for(const width of [1440,1024,390])test(`error component presentation ${theme} ${width}`,async({page})=>{
  const html=await fs.readFile("docs/quality/ux-login-evidence/error-render-fixture.html","utf8");
  await page.setViewportSize({width,height:900});await page.addInitScript(t=>localStorage.setItem("permission-next-workspace-theme",t),theme);await page.goto("/login");await settlePresentation(page);
  await page.locator("main").evaluate((main,markup)=>{main.outerHTML=markup;},html);await settlePresentation(page);await checkVisibleFontFloor(page);
  const axe=await new AxeBuilder({page}).analyze();expect(axe.violations.filter(v=>["serious","critical"].includes(v.impact||""))).toEqual([]);
  await expect(page.getByRole("button",{name:"ลองอีกครั้ง",exact:true})).toBeVisible();await expect(page.getByRole("link",{name:"กลับหน้าแรก",exact:true})).toHaveAttribute("href","/");expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`docs/quality/ux-login-evidence/${process.env.UX_PHASE||"cp5"}-error-render-${theme}-${width}.png`,fullPage:true});
});
