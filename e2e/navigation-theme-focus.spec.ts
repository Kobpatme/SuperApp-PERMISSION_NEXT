import { test, expect, type Browser, type Page } from "@playwright/test";
import { build } from "esbuild";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// CI uses Playwright-managed Chromium; local installations may opt into an executable.
test.use({ launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
  : {} });
let browser: Browser;
test.beforeAll(async ({ browser: fixtureBrowser }) => { browser = fixtureBrowser; });
const css = () => ["src/app/globals.css", "src/styles/shell.css", "src/styles/components.css"].map(path => readFileSync(resolve(path), "utf8")).join("\n");
async function fixture(run: (page: Page) => Promise<void>) {
  const page = await browser.newPage();
  await page.route("**/*", route => route.request().url() === "https://workspace.test/" ? route.fulfill({ contentType: "text/html", body: "<div id='root'></div>" }) : route.abort());
  await page.goto("https://workspace.test/");
  try { await run(page); } finally { await page.close(); }
}

async function mount(page: Page, component: "ModuleNav" | "WorkspaceThemeToggle", props = {}) {
  const file = component === "ModuleNav" ? "module-nav" : "workspace-theme-toggle";
  const bundle = await build({
    stdin: { contents: `import React from 'react'; import { createRoot } from 'react-dom/client'; import { ${component} } from './src/components/${file}'; createRoot(document.getElementById('root')).render(React.createElement(${component}, ${JSON.stringify(props)}));`, resolveDir: process.cwd(), loader: "tsx" },
    bundle: true, write: false, platform: "browser", jsx: "automatic", define: { "process.env.NODE_ENV": '"development"' },
    plugins: [{ name: "next-router-fixture", setup(build) {
      build.onResolve({ filter: /^next\/(link|navigation)$/ }, args => ({ path: args.path, namespace: "fixture" }));
      build.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ contents: args.path === "next/link"
        ? `import React from 'react'; export default function Link(props) { return React.createElement('a', props); }`
        : `export function usePathname() { return window.fixturePath || '/'; } export function useSearchParams() { return new URLSearchParams(window.fixtureQuery || ''); }`, resolveDir: process.cwd() }));
    } }],
  });
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  await page.locator("button, nav").first().waitFor();
}

for (const path of ["/workshop", "/guarantees-extra", "/administrator"]) {
test(`does not mark a similarly prefixed route current: ${path}`, async () => {
  await fixture(async page => {
    await page.evaluate(path => { Object.assign(window, { fixturePath: path }); }, path);
    await mount(page, "ModuleNav", { allowedModuleIds: ["work", "guarantees"], canAdmin: true });
    expect(await page.locator('[aria-current="page"]').count()).toBe(0);
  });
});
}

test("retains one current root destination when its saved disclosure is closed", async () => {
  await fixture(async page => {
    await page.evaluate(() => { Object.assign(window, { fixturePath: "/duct-rental" }); localStorage.setItem("permission-next-sidebar-sections", JSON.stringify({ "duct-rental": false })); });
    await mount(page, "ModuleNav", { allowedModuleIds: ["duct-rental"] });
    await page.evaluate(() => new Promise<void>(done => requestAnimationFrame(() => requestAnimationFrame(() => done()))));
    expect(await page.locator(".sidebar-subnav").count()).toBe(0);
    expect(await page.locator('[aria-current="page"]').count()).toBe(1);
    expect(await page.locator('[aria-current="page"]').getAttribute("href")).toBe("/duct-rental");
  });
});

test("keeps every saved-closed section reachable in the collapsed rail without overwriting preferences", async () => {
  await fixture(async page => {
    const saved = JSON.stringify({ work: false, guarantees: false, "duct-rental": false });
    await page.evaluate(value => { localStorage.setItem("permission-next-sidebar-sections", value); }, saved);
    await mount(page, "ModuleNav", { allowedModuleIds: ["work", "guarantees", "duct-rental"], collapsed: true, workNavigation: [
      { href: "/work?view=activity", label: "กิจกรรมงาน", icon: "refresh" },
    ] });
    await page.evaluate(() => new Promise<void>(done => requestAnimationFrame(() => requestAnimationFrame(() => done()))));
    for (const href of ["/work?view=activity", "/guarantees?view=installation-team", "/duct-rental/renewal", "/duct-rental/communication-cable"]) {
      expect(await page.locator(`a[href="${href}"]`).count()).toBe(1);
      await page.locator(`a[href="${href}"]`).focus();
      expect(await page.locator(`a[href="${href}"]`).evaluate(el => document.activeElement === el)).toBe(true);
      expect(await page.locator(`a[href="${href}"]`).getAttribute("aria-label")).toBeTruthy();
    }
    expect(await page.evaluate(() => localStorage.getItem("permission-next-sidebar-sections"))).toBe(saved);
  });
});

for (const [path, query, expected] of [
  ["/work/team/member", "", "/work/team"],
  ["/duct-rental/renewal/example", "", "/duct-rental/renewal"],
  ["/duct-rental/12345678-1234-1234-1234-123456789abc/edit", "", "/duct-rental"],
  ["/guarantees", "view=installation-team", "/guarantees?view=installation-team"],
]) {
test(`selects one detail destination and keeps its section active: ${path}`, async () => {
  await fixture(async page => {
    await page.evaluate(({ path, query }) => { Object.assign(window, { fixturePath: path, fixtureQuery: query }); }, { path, query });
    await mount(page, "ModuleNav", { allowedModuleIds: ["work", "duct-rental", "guarantees"], workNavigation: [
      { href: "/work", label: "ภาพรวมงาน", icon: "work" },
      { href: "/work/team", label: "ภาพรวมทีม", icon: "team" },
    ] });
    await expect.poll(() => page.locator('[aria-current="page"]').count()).toBe(1);
    expect(await page.locator('[aria-current="page"]').getAttribute("href")).toBe(expected);
    const section = "/" + path.split("/")[1];
    expect(await page.locator(`.sidebar-link[href="${section}"]`).getAttribute("class")).toContain("active");
  });
});
}

test("marks only the query-specific destination current while retaining its active section", async () => {
  await fixture(async page => {
    await page.evaluate(() => { Object.assign(window, { fixturePath: "/work", fixtureQuery: "view=activity&preview=1" }); });
    await mount(page, "ModuleNav", { allowedModuleIds: ["work"], workNavigation: [
      { href: "/work", label: "ภาพรวมงาน", icon: "work" },
      { href: "/work?view=activity", label: "กิจกรรมงาน", icon: "refresh" },
    ] });
    await expect.poll(() => page.locator('[aria-current="page"]').count()).toBe(1);
    expect(await page.locator('[aria-current="page"]').getAttribute("href")).toBe("/work?view=activity");
    expect(await page.locator('.sidebar-link[href="/work?preview=1"]').getAttribute("class")).toContain("active");
    expect(await page.locator('.sidebar-link[href="/work?preview=1"]').getAttribute("aria-current")).toBeNull();
  });
});

test("initializes and toggles the theme when storage reads are unavailable", async () => {
  await fixture(async page => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.evaluate(() => { Object.defineProperty(window, "localStorage", { get() { throw new DOMException("Unavailable", "SecurityError"); } }); });
    await mount(page, "WorkspaceThemeToggle");
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.theme)).toBe("dark");
    await page.locator("button").click();
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.theme)).toBe("light");
  });
});

test("uses the strong focus token on base keyboard controls", async () => {
  await fixture(async page => {
    await page.setContent(`<style>${readFileSync(resolve("src/styles/tokens.css"), "utf8")}${css()}</style><button>ปุ่ม</button><a href="#">ลิงก์</a><input><select><option>เลือก</option></select><textarea></textarea><details><summary>เพิ่มเติม</summary></details>`);
    const expectedRing = await page.evaluate(() => {
      const probe = document.createElement("span");
      probe.style.color = "var(--color-focus-ring)";
      document.body.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    });
    for (const selector of ["button", "a", "input", "select", "textarea", "summary"]) {
      await page.locator(selector).focus();
      expect(await page.locator(selector).evaluate(el => getComputedStyle(el).outlineColor)).toBe(expectedRing);
      expect(await page.locator(selector).evaluate(el => getComputedStyle(el).outlineStyle)).toBe("solid");
    }
  });
});

test("keeps mobile dialog labels visible when the desktop rail is collapsed", async () => {
  await fixture(async page => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.setContent(`<style>${css()}</style><div class="workspace-shell sidebar-collapsed"><aside class="workspace-sidebar"><span class="sidebar-link-label">Desktop</span></aside><dialog class="workspace-mobile-dialog" open><a class="sidebar-link"><span class="sidebar-link-label">งานของฉัน</span></a></dialog></div>`);
    await expect.poll(() => page.locator("dialog .sidebar-link-label").evaluate(el => getComputedStyle(el).display)).not.toBe("none");
  });
});
