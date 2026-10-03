import { expect, test } from "@playwright/test";
import fs from "node:fs/promises";
test("login fonts are self-hosted and fit the offline budget", async ({ page }) => {
  const external: string[]=[]; const sizes: Promise<number>[]=[];
  await page.route("**/*", route=>{ const u=new URL(route.request().url()); if(!["localhost","127.0.0.1"].includes(u.hostname)){external.push(u.hostname);return route.abort();}return route.continue(); });
  page.on("response",r=>{if(r.request().resourceType()==="font")sizes.push(r.body().then(b=>b.length));});
  await page.goto("/login"); await page.evaluate(()=>document.fonts.ready);
  const bytes=(await Promise.all(sizes)).reduce((a,b)=>a+b,0);
  expect(external).toEqual([]); expect(bytes).toBeGreaterThan(0); expect(bytes).toBeLessThanOrEqual(300*1024);
  const families=await page.evaluate(()=>({body:getComputedStyle(document.body).fontFamily,heading:getComputedStyle(document.querySelector("h1")!).fontFamily,thai:getComputedStyle(document.documentElement).getPropertyValue("--font-thai")}));
  expect(families.body).toMatch(/nunito/i); expect(families.heading).toMatch(/manrope/i); expect(families.thai).not.toBe("");
  await fs.writeFile("docs/quality/ux-login-evidence/font-budget.json",JSON.stringify({bytes,fontResponses:sizes.length,externalRequests:external.length,families},null,2));
});
