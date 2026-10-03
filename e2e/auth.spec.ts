import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { settlePresentation } from "./settle";
const forbidden = /Argon2|RBAC|ฐานข้อมูล|DATABASE|\bNAS\b|\bsession\b|\bserver\b|Workspace|Developer|readiness|foundation|Organization Identity|SECURE FIRST SIGN-IN|\bstack\b|\btoken\b/i;
test("login retains email, focuses password, allows visibility and safe reasons", async ({ page }) => {
  await page.goto("/login?reason=untrusted-value&next=//evil.com");
  await expect(page.locator(".auth-notice")).toHaveCount(0);
  await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
  await expect(page.getByText("กรุณากรอกอีเมล", { exact: false })).toBeVisible();
  await page.locator("input[name=email]").fill("wrong@example.test"); await page.locator("input[name=password]").fill("WrongPassword123!");
  await page.getByRole("button", { name: "แสดงรหัสผ่าน: รหัสผ่าน", exact: true }).click();
  await expect(page.locator("input[name=password]")).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
  await expect(page.locator("input[name=email]")).toHaveValue("wrong@example.test"); await expect(page.locator("input[name=password]")).toBeFocused();
  await expect(page.locator("input[name=password]")).toHaveValue("");
  expect(await page.locator("main").innerText()).not.toMatch(forbidden);
  await page.goto("/login?reason=expired"); await expect(page.locator(".auth-notice")).toContainText("อัตโนมัติ");
});
for (const theme of ["light", "dark"] as const) for (const width of [1440, 1024, 390]) {
  test(`auth a11y ${theme} ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(value => localStorage.setItem("permission-next-workspace-theme", value), theme);
    await page.goto("/login");
    for (const route of ["login", "change-password"]) {
      if (route === "change-password") {
        await page.locator("input[name=email]").fill("temporary@example.test"); await page.locator("input[name=password]").fill("FixturePassword123!");
        await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click(); await page.waitForURL("**/change-password");
      }
      expect(await page.content()).not.toMatch(forbidden);
      await expect(page.locator("h1")).toHaveCount(1); await expect(page.locator("h1")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await settlePresentation(page);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations.filter(item => ["serious", "critical"].includes(item.impact || ""))).toEqual([]);
      await page.screenshot({ path: `docs/quality/ux-login-evidence/${process.env.UX_PHASE||'cp1'}-${route}-${theme}-${width}.png`, fullPage: true });
    }
  });
}
