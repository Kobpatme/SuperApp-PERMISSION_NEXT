import { test, expect, type Browser, type Page } from "@playwright/test";
import { build } from "esbuild";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

// CI uses Playwright-managed Chromium; local installations may opt into an executable.
test.use({ launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
  : {} });
let browser: Browser;
test.beforeAll(async ({ browser: fixtureBrowser }) => { browser = fixtureBrowser; });
const artifactDir = resolve(process.env.SHELL_COPY_ARTIFACT_DIR ?? resolve(process.env.TMPDIR ?? tmpdir(), "permission-next-shell-copy"));
mkdirSync(artifactDir, { recursive: true });
// The fixture uses identity CSS-module names; unwrap module-only global selectors too.
const css = () => ["src/styles/tokens.css", "src/app/globals.css", "src/styles/shell.css", "src/styles/components.css", "src/styles/ui.css", "src/styles/app-shell.module.css"].map(path => {
  const source = readFileSync(resolve(path), "utf8");
  return path.endsWith(".module.css") ? source.replace(/:global\(([^)]+)\)/g, "$1") : source;
}).join("\n");
const aliasPath = (specifier: string) => {
  const base = resolve(process.cwd(), "src", specifier.slice(2));
  return [base, `${base}.tsx`, `${base}.ts`, `${base}.jsx`, `${base}.js`].find(candidate => existsSync(candidate)) ?? base;
};
async function fixture(run: (page: Page) => Promise<void>) {
  const page = await browser.newPage();
  await page.route("**/*", route => {
    const url = new URL(route.request().url());
    if (url.href === "https://workspace.test/") return route.fulfill({ contentType: "text/html", body: "<div id='root'></div>" });
    if (url.origin === "https://workspace.test" && ["/logo.png", "/icon.png"].includes(url.pathname)) return route.fulfill({ path: resolve("public", url.pathname.slice(1)), contentType: "image/png" });
    return route.abort();
  });
  await page.goto("https://workspace.test/");
  try { await run(page); } finally { await page.close(); }
}

async function mount(page: Page, component: "ModuleNav" | "WorkspaceThemeToggle", props = {}) {
  const file = component === "ModuleNav" ? "module-nav" : "workspace-theme-toggle";
  const bundle = await build({
    stdin: { contents: `import React from 'react'; import { createRoot } from 'react-dom/client'; import { ${component} } from './src/components/${file}'; createRoot(document.getElementById('root')).render(React.createElement(${component}, ${JSON.stringify(props)}));`, resolveDir: process.cwd(), loader: "tsx" },
    bundle: true, write: false, platform: "browser", jsx: "automatic", define: { "process.env.NODE_ENV": '"development"' },
    plugins: [{ name: "next-router-fixture", setup(build) {
      build.onResolve({ filter: /^@\// }, args => args.path.endsWith(".module.css") ? ({ path: aliasPath(args.path), namespace: "cssmodule" }) : ({ path: aliasPath(args.path) }));
      build.onResolve({ filter: /\.module\.css$/ }, args => ({ path: resolve(args.resolveDir, args.path), namespace: "cssmodule" }));
      build.onLoad({ filter: /.*/, namespace: "cssmodule" }, args => {
        const names = [...readFileSync(args.path, "utf8").matchAll(/\.([A-Za-z_][A-Za-z0-9_-]*)\s*\{/g)].map(match => match[1]).concat("drawer");
        return { contents: `export default { ${[...new Set(names)].map(name => `${JSON.stringify(name)}: ${JSON.stringify(name)}`).join(", ")} };`, loader: "js" };
      });
      build.onResolve({ filter: /^next\/(link|navigation)$/ }, args => ({ path: args.path, namespace: "fixture" }));
      build.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ contents: args.path === "next/link"
        ? `import React from 'react'; export default function Link(props) { return React.createElement('a', props); }`
        : `export function usePathname() { return window.fixturePath || '/'; } export function useSearchParams() { return new URLSearchParams(window.fixtureQuery || ''); }`, resolveDir: process.cwd() }));
    } }],
  });
  await page.addStyleTag({ content: css() });
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  await page.locator("button, nav").first().waitFor();
}

async function mountRealShell(page: Page, props = {}) {
  const bundle = await build({
    stdin: { contents: `import React from 'react'; import { createRoot } from 'react-dom/client'; import { AppShell } from './src/components/app-shell'; createRoot(document.getElementById('root')).render(React.createElement(AppShell, ${JSON.stringify({ allowedModuleIds: ["work", "guarantees", "duct-rental"], canAdmin: true, workNavigation: [{ href: "/work", label: "ภาพรวมงาน", icon: "work" }], ...props })}, React.createElement('section', { 'data-fixture-content': true }, React.createElement('h1', null, 'Actual shell fixture'))));`, resolveDir: process.cwd(), loader: "tsx" },
    bundle: true, write: false, outfile: "shell-fixture.js", platform: "browser", jsx: "automatic", define: { "process.env.NODE_ENV": '"development"' },
    plugins: [{ name: "real-shell-fixture", setup(build) {
      build.onResolve({ filter: /^@\/app\/login\/actions$/ }, args => ({ path: args.path, namespace: "shellstub" }));
      build.onLoad({ filter: /.*/, namespace: "shellstub" }, () => ({ contents: `export async function logoutAction() { throw new Error('Authentication is outside this fixture'); }`, loader: "js" }));
      // Preserve actual CSS-module scoping; identity names collide with legacy .search/.topbar rules.
      build.onResolve({ filter: /^@\// }, args => ({ path: aliasPath(args.path) }));
      build.onResolve({ filter: /^next\/(link|navigation|image)$/ }, args => ({ path: args.path, namespace: "fixture" }));
      build.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ contents: args.path === "next/link"
        ? `import React from 'react'; export default function Link(props) { return React.createElement('a', props); }`
        : args.path === "next/image" ? `import React from 'react'; export default function Image(props) { const { priority, ...rest } = props; return React.createElement('img', rest); }`
        : `export function useRouter() { return { push() { throw new Error('Route loading is outside this fixture'); } }; } export function usePathname() { return window.fixturePath || '/work'; } export function useSearchParams() { return new URLSearchParams(window.fixtureQuery || ''); }`, resolveDir: process.cwd() }));
    } }],
  });
  await page.addStyleTag({ content: css() });
  await page.addStyleTag({ content: bundle.outputFiles.find(file => file.path.endsWith(".css"))!.text });
  await page.addScriptTag({ content: bundle.outputFiles.find(file => file.path.endsWith(".js"))!.text });
  await page.locator('[data-app-shell]').waitFor();
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

test("opens only the current route section by default", async () => {
  await fixture(async page => {
    await page.evaluate(() => { Object.assign(window, { fixturePath: "/duct-rental" }); });
    await mount(page, "ModuleNav", { allowedModuleIds: ["work", "guarantees", "duct-rental"], workNavigation: [
      { href: "/work", label: "ภาพรวมงาน", icon: "work" },
    ] });
    await expect(page.locator('[data-module-id="duct-rental"]')).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator('[data-module-id="work"]')).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator('#sidebar-section-duct-rental')).toHaveAttribute("aria-hidden", "false");
    await expect(page.locator('#sidebar-section-work')).toHaveAttribute("aria-hidden", "true");
    await expect(page.locator(".sidebar-section-toggle")).toHaveCount(3);
  });
});

test("disclosure opens a module without navigation and folds the previous module", async () => {
  await fixture(async page => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.evaluate(() => { Object.assign(window, { fixturePath: "/work" }); });
    await mount(page, "ModuleNav", { allowedModuleIds: ["work", "guarantees"], workNavigation: [
      { href: "/work", label: "ภาพรวมงาน", icon: "work" },
    ] });
    const closedHeight = await page.locator('#sidebar-section-guarantees').evaluate(element => element.getBoundingClientRect().height);
    const transitionDuration = await page.locator('#sidebar-section-guarantees').evaluate(element => getComputedStyle(element).transitionDuration);
    expect(transitionDuration).not.toBe("0s");
    await page.locator('[data-module-id="guarantees"]').click();
    expect(page.url()).toBe("https://workspace.test/");
    await expect(page.locator('.sidebar-module-row > a[href="/guarantees"]')).toBeVisible();
    await expect(page.locator('[data-module-id="guarantees"]')).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator('[data-module-id="work"]')).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator('#sidebar-section-guarantees')).toHaveClass(/is-open/);
    await expect(page.locator('#sidebar-section-work')).not.toHaveClass(/is-open/);
    await expect.poll(() => page.locator('#sidebar-section-guarantees').evaluate(element => element.getBoundingClientRect().height)).toBeGreaterThan(closedHeight);
  });
});

test("collapsed rail keeps module roots reachable and hides child destinations", async () => {
  await fixture(async page => {
    await mount(page, "ModuleNav", { allowedModuleIds: ["work", "guarantees", "duct-rental"], collapsed: true, workNavigation: [
      { href: "/work?view=activity", label: "กิจกรรมงาน", icon: "refresh" },
    ] });
    for (const href of ["/work", "/guarantees", "/duct-rental"]) {
      await page.locator(`.sidebar-link[href="${href}"]`).focus();
      expect(await page.locator(`.sidebar-link[href="${href}"]`).evaluate(el => document.activeElement === el)).toBe(true);
      expect(await page.locator(`.sidebar-link[href="${href}"]`).getAttribute("aria-label")).toBeTruthy();
    }
    expect(await page.locator(".sidebar-subnav-panel").evaluateAll(nodes => nodes.every(node => node.getAttribute("aria-hidden") === "true"))).toBe(true);
    await page.locator('a[href="/work?view=activity"]').focus();
    expect(await page.locator('a[href="/work?view=activity"]').evaluate(el => document.activeElement === el)).toBe(false);
  });
});

test("removes the requested sidebar labels without removing /work/mine", async () => {
  await fixture(async page => {
    await page.evaluate(() => { Object.assign(window, { fixturePath: "/work" }); });
    await mountRealShell(page, { workNavigation: [
      { href: "/work", label: "ภาพรวมงาน", icon: "work" },
      { href: "/work/mine", label: "งานของฉัน", icon: "check" },
    ] });

    const sidebar = page.locator("[data-shell-sidebar]");
    const mine = sidebar.getByRole("link", { name: "งานของฉัน", exact: true });
    await expect(mine).toHaveAttribute("href", "/work/mine");
    await expect(mine).not.toHaveAttribute("title");
    expect(await sidebar.locator(".sidebar-group-label").allTextContents()).not.toContain("งานของฉัน");
    expect(await sidebar.locator(".sidebar-group-label").allTextContents()).not.toContain("การดำเนินงาน");
    expect(await sidebar.locator(".sidebar-link-label").allTextContents()).not.toContain("งานของฉัน");

    await sidebar.getByRole("button", { name: "ยุบเมนูด้านข้าง", exact: true }).click();
    const collapsedMine = sidebar.locator('a[href="/work/mine"]');
    await expect(collapsedMine).toHaveAttribute("aria-label", "งานของฉัน");
    await expect(collapsedMine).toHaveAttribute("href", "/work/mine");
    await expect(collapsedMine).not.toHaveAttribute("title");

    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "เปิดเมนูนำทาง", exact: true }).click();
    const drawer = page.getByRole("dialog", { name: "Permission Next", exact: true });
    const drawerMine = drawer.getByRole("link", { name: "งานของฉัน", exact: true });
    await expect(drawerMine).toHaveAttribute("href", "/work/mine");
    await expect(drawerMine).not.toHaveAttribute("title");
    expect(await drawer.locator(".sidebar-group-label").allTextContents()).not.toContain("งานของฉัน");
    expect(await drawer.locator(".sidebar-group-label").allTextContents()).not.toContain("การดำเนินงาน");
    expect(await drawer.locator(".sidebar-link-label").allTextContents()).not.toContain("งานของฉัน");
  });
});

for (const [path, query, expected] of [
  ["/work/team/member", "", "/work/team"],
  ["/duct-rental/renewal/example", "", "/duct-rental"],
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
    if (path === "/duct-rental/renewal/example") await expect(page.locator('a[href="/duct-rental/renewal"]')).toHaveCount(0);
    const section = path.split("/")[1];
    await expect(page.locator(`.sidebar-module-row > a[href="/${section}"]`)).toHaveClass(/active/);
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
    await expect(page.locator('.sidebar-module-row > a[href="/work?preview=1"]')).toHaveClass(/active/);
    await expect(page.locator('.sidebar-module-row > a[href="/work?preview=1"]')).not.toHaveAttribute("aria-current");
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
    await page.setContent(`<style>${css()}</style><button>ปุ่ม</button><a href="#">ลิงก์</a><input><select><option>เลือก</option></select><textarea></textarea><details><summary>เพิ่มเติม</summary></details>`);
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

test("actual AppShell fixture proves themed surfaces, drawer geometry, and desktop rail non-overlap", async () => {
  await fixture(async page => {
    await page.setViewportSize({ width: 1280, height: 844 });
    await page.evaluate(() => { Object.assign(window, { fixturePath: "/work" }); });
    await mountRealShell(page);
    const shell = page.locator("[data-app-shell]");
    const surface = await page.locator("[data-shell-sidebar]").evaluate(element => getComputedStyle(element).backgroundColor);
    expect(surface).not.toBe("rgba(0, 0, 0, 0)");
    await page.screenshot({ path: resolve(artifactDir, "actual-shell-light-expanded.png"), animations: "disabled" });

    await page.locator("[data-shell-header] .workspace-theme-toggle").click();
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.theme)).toBe("dark");
    const darkSurface = await page.locator("[data-shell-sidebar]").evaluate(element => getComputedStyle(element).backgroundColor);
    expect(darkSurface).not.toBe(surface);
    await page.screenshot({ path: resolve(artifactDir, "actual-shell-dark-expanded.png"), animations: "disabled" });

    const expandedGeometry = await page.evaluate(() => {
      const sidebar = document.querySelector<HTMLElement>("[data-shell-sidebar]")!.getBoundingClientRect();
      const main = document.querySelector<HTMLElement>("[data-shell-main]")!.getBoundingClientRect();
      return { sidebarRight: sidebar.right, mainLeft: main.left, width: sidebar.width };
    });
    expect(expandedGeometry.mainLeft).toBeGreaterThanOrEqual(expandedGeometry.sidebarRight);
    await page.getByRole("button", { name: "ยุบเมนูด้านข้าง", exact: true }).click();
    await expect(shell).toHaveClass(/collapsed/);
    await page.screenshot({ path: resolve(artifactDir, "actual-shell-dark-rail.png"), animations: "disabled" });
    const railWidth = await page.locator("[data-shell-sidebar]").evaluate(element => element.getBoundingClientRect().width);
    expect(railWidth).toBeLessThan(expandedGeometry.width);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("button[aria-label='เปิดเมนูนำทาง']").click();
    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible();
    const drawerGeometry = await drawer.evaluate(element => { const rect = element.getBoundingClientRect(); return { width: rect.width, height: rect.height, x: rect.x, y: rect.y }; });
    expect(drawerGeometry.x).toBe(0);
    expect(drawerGeometry.y).toBe(0);
    expect(drawerGeometry.width).toBeLessThanOrEqual(390);
    expect(drawerGeometry.height).toBe(844);
    await page.screenshot({ path: resolve(artifactDir, "actual-shell-mobile-390.png"), animations: "disabled" });
  });
});


for (const theme of ["light", "dark"] as const) {
  test(`minimal shell copy preserves responsive controls and drawer semantics: ${theme}`, async () => {
    await fixture(async page => {
      const errors: string[] = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.evaluate(theme => localStorage.setItem("permission-next-workspace-theme", theme), theme);
      await mountRealShell(page, { displayName: "TEST Account", scopeLabel: "TEST Team" });
      await expect.poll(() => page.evaluate(() => document.documentElement.dataset.theme)).toBe(theme);
      const header = page.locator("[data-shell-header]");
      const sidebar = page.locator("[data-shell-sidebar]");
      const opener = page.getByRole("button", { name: "เปิดเมนูนำทาง", exact: true });
      const brand = header.getByRole("link", { name: "Permission Next — ภาพรวม", exact: true });
      for (const width of [320, 390, 650, 651, 900, 901, 1000, 1001, 1280, 1440]) {
        await page.setViewportSize({ width, height: 844 });
        await expect(header).not.toContainText(/พื้นที่ทำงาน|เมนูหลัก/);
        await expect(sidebar).not.toContainText(/พื้นที่ทำงาน|เมนูหลัก/);
        if (width <= 900) {
          await expect(brand).toBeVisible();
          await expect(brand).toHaveAttribute("href", "/");
        } else {
          await expect(brand).toBeHidden();
        }
        const search = header.getByRole("combobox", { name: "ค้นหาเมนูและรายการติดตาม", exact: true });
        if (width <= 650) {
          const searchTrigger = header.getByRole("button", { name: "เปิดค้นหาส่วนกลาง", exact: true });
          await expect(searchTrigger).toBeVisible();
          await searchTrigger.click();
          await expect(search).toBeVisible();
          await expect(search).toBeFocused();
          await page.keyboard.press("Escape");
          await expect(searchTrigger).toBeFocused();
        } else {
          await expect(search).toBeVisible();
        }
        await expect(header.locator(".workspace-theme-toggle")).toBeVisible();
        await expect(header.getByRole("button", { name: "บัญชีผู้ใช้ TEST Account", exact: true })).toBeVisible();
        await expect(brand.locator("strong")).toBeHidden();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        if (width > 900) {
          await expect(sidebar).toBeVisible();
          await expect(opener).toBeHidden();
          await expect(sidebar).toContainText("คุณเห็นข้อมูลของ:");
          await expect(sidebar).toContainText("TEST Team");
          const geometry = await sidebar.evaluate(element => {
            const heading = element.firstElementChild as HTMLElement;
            const button = heading.querySelector("button")!;
            const row = heading.getBoundingClientRect();
            const control = button.getBoundingClientRect();
            const nav = element.querySelector("nav")!.getBoundingClientRect();
            return { height: row.height, buttonWidth: control.width, buttonHeight: control.height,
              rightInset: row.right - control.right, padding: parseFloat(getComputedStyle(heading).paddingRight),
              navTop: nav.top, rowBottom: row.bottom };
          });
          expect(geometry.height).toBeGreaterThanOrEqual(44);
          expect(geometry.buttonWidth).toBeGreaterThanOrEqual(44);
          expect(geometry.buttonHeight).toBeGreaterThanOrEqual(44);
          expect(geometry.rightInset).toBeCloseTo(geometry.padding, 1);
          expect(geometry.navTop).toBeGreaterThan(geometry.rowBottom);
          for (const moduleId of ["work", "guarantees", "duct-rental"]) await expect(sidebar.locator(`[data-module-id="${moduleId}"]`)).toBeVisible();
        } else {
          await expect(sidebar).toBeHidden();
          await expect(opener).toBeVisible();
          await expect(opener).toHaveAttribute("aria-haspopup", "dialog");
          await opener.click();
          const drawer = page.getByRole("dialog", { name: "Permission Next", exact: true });
          await expect(drawer).toBeVisible();
          await expect(drawer).toHaveAttribute("aria-modal", "true");
          await expect(drawer.getByRole("heading", { name: "Permission Next", exact: true })).toBeVisible();
          await expect(drawer).not.toContainText(/พื้นที่ทำงาน|เมนูหลัก/);
          const close = drawer.getByRole("button", { name: "ปิดหน้าต่าง", exact: true });
          await expect(close).toBeVisible();
          await expect(close).toBeFocused();
          const bounds = await drawer.boundingBox();
          expect(bounds).toMatchObject({ x: 0, y: 0, height: 844 });
          // Approved drawer geometry: min(320px, viewport minus 32px).
          expect(bounds!.width).toBe(Math.min(320, width - 32));
          const moduleTrigger = drawer.locator('[data-module-id="guarantees"]');
          await expect(moduleTrigger).toBeVisible();
          if (await moduleTrigger.getAttribute("aria-expanded") === "true") {
            await moduleTrigger.click();
            await expect(moduleTrigger).toHaveAttribute("aria-expanded", "false");
          }
          await moduleTrigger.click();
          await expect(moduleTrigger).toHaveAttribute("aria-expanded", "true");
          if (width === 390) await page.screenshot({ path: resolve(artifactDir, `minimal-shell-${theme}-mobile-390.png`), animations: "disabled" });
          await page.keyboard.press("Escape");
          await expect(drawer).toBeHidden();
          await expect(opener).toBeFocused();
          await opener.click();
          await close.click();
          await expect(drawer).toBeHidden();
          await expect(opener).toBeFocused();
          await opener.click();
          // Keep this isolated fixture on its synthetic origin while exercising real onNavigate.
          const destination = drawer.locator('a[href="/"]').first();
          await destination.evaluate(element => element.addEventListener("click", event => event.preventDefault(), { once: true }));
          await destination.click();
          await expect(drawer).toBeHidden();
          await expect(opener).toBeFocused();
        }
      }
      await page.screenshot({ path: resolve(artifactDir, `minimal-shell-${theme}-desktop-1440.png`), animations: "disabled" });
      const collapse = sidebar.getByRole("button", { name: "ยุบเมนูด้านข้าง", exact: true });
      await collapse.click();
      const expand = sidebar.getByRole("button", { name: "ขยายเมนูด้านข้าง", exact: true });
      await expect(expand).toHaveAttribute("aria-expanded", "false");
      expect(await page.evaluate(() => localStorage.getItem("permission-next-sidebar-collapsed"))).toBe("1");
      const centered = await sidebar.evaluate(element => {
        const rail = element.getBoundingClientRect();
        const button = element.querySelector("button")!.getBoundingClientRect();
        return Math.abs((rail.left + rail.right) / 2 - (button.left + button.right) / 2);
      });
      expect(centered).toBeLessThan(1);
      for (const href of ["/work", "/guarantees", "/duct-rental"]) {
        const root = sidebar.locator(`.sidebar-link[href="${href}"]`);
        await root.focus();
        await expect(root).toBeFocused();
        expect(await root.getAttribute("aria-label")).toBeTruthy();
      }
      await expand.click();
      await expect(collapse).toHaveAttribute("aria-expanded", "true");
      expect(await page.evaluate(() => localStorage.getItem("permission-next-sidebar-collapsed"))).toBe("0");
      await expect(page.locator('.skip-link')).toHaveAttribute("href", "#workspace-content");
      expect(errors).toEqual([]);
    });
  });
}

test("desktop sidebar spans viewport and topbar adjoins it in both states", async () => {
  await fixture(async page => {
    await page.setViewportSize({ width: 1280, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await mountRealShell(page);
    const sidebar = page.locator("[data-shell-sidebar]");
    const header = page.locator("[data-shell-header]");
    for (const label of ["ยุบเมนูด้านข้าง", "ขยายเมนูด้านข้าง"]) {
      const side = (await sidebar.boundingBox())!;
      const top = (await header.boundingBox())!;
      expect(side.x).toBe(0);
      expect(side.y).toBe(0);
      expect(side.height).toBe(844);
      expect(top.x).toBe(side.x + side.width);
      await sidebar.getByRole("button", { name: label, exact: true }).click();
    }
    await expect(header.getByRole("link", { name: "Permission Next — ภาพรวม" })).toBeHidden();
  });
});

test("desktop sidebar and topbar remain aligned during rapid toggles", async () => {
  await fixture(async page => {
    await page.setViewportSize({ width: 1280, height: 844 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await mountRealShell(page);
    const samples = await page.evaluate(async () => {
      const sidebar = document.querySelector<HTMLElement>("[data-shell-sidebar]")!;
      const header = document.querySelector<HTMLElement>("[data-shell-header]")!;
      const button = sidebar.querySelector<HTMLButtonElement>("button")!;
      const gaps: number[] = [];
      for (let frame = 0; frame < 40; frame++) {
        if (frame === 0 || frame === 5 || frame === 10) button.click();
        await new Promise(requestAnimationFrame);
        gaps.push(Math.abs(sidebar.getBoundingClientRect().right - header.getBoundingClientRect().left));
      }
      return gaps;
    });
    expect(Math.max(...samples)).toBeLessThan(1);
  });
});

for (const theme of ["light", "dark"] as const) {
  test(`sidebar one-click navigation, disclosure, persistence and reduced motion: ${theme}`, async () => {
    await fixture(async page => {
      await page.setViewportSize({ width: 1280, height: 844 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.evaluate(theme => localStorage.setItem("permission-next-workspace-theme", theme), theme);
      await mountRealShell(page);
      const sidebar = page.locator("[data-shell-sidebar]");
      const toggle = sidebar.getByRole("button", { name: "ยุบเมนูด้านข้าง" });
      await expect(toggle).toHaveAttribute("aria-controls", "workspace-navigation");
      await expect.poll(() => page.evaluate(() => document.documentElement.dataset.theme)).toBe(theme);
      const disclosure = sidebar.locator('[data-module-id="guarantees"]');
      await disclosure.focus();
      await page.keyboard.press("Enter");
      await expect(disclosure).toHaveAttribute("aria-expanded", "true");
      await expect(sidebar.locator('[data-module-id="work"]')).toHaveAttribute("aria-expanded", "false");
      expect(page.url()).toBe("https://workspace.test/");
      expect(await disclosure.evaluate(el => getComputedStyle(el).transitionDuration)).toBe("0s");
      const root = sidebar.locator('.sidebar-module-row > a[href="/guarantees"]');
      await root.evaluate(el => el.addEventListener("click", event => { event.preventDefault(); (window as Window & { clicks?: number }).clicks = ((window as Window & { clicks?: number }).clicks ?? 0) + 1; }));
      await root.click();
      expect(await page.evaluate(() => (window as Window & { clicks?: number }).clicks)).toBe(1);
      await expect(disclosure).toHaveAttribute("aria-expanded", "true");
      await toggle.focus();
      await page.keyboard.press("Space");
      await expect(sidebar.getByRole("button", { name: "ขยายเมนูด้านข้าง" })).toHaveAttribute("aria-expanded", "false");
      expect(await page.evaluate(() => localStorage.getItem("permission-next-sidebar-collapsed"))).toBe("1");
      await root.click();
      expect(await page.evaluate(() => (window as Window & { clicks?: number }).clicks)).toBe(2);
      await page.reload();
      await mountRealShell(page);
      await expect(sidebar.getByRole("button", { name: "ขยายเมนูด้านข้าง" })).toBeVisible();
      await sidebar.getByRole("button", { name: "ขยายเมนูด้านข้าง" }).click();
      expect(await page.evaluate(() => localStorage.getItem("permission-next-sidebar-collapsed"))).toBe("0");
      await expect(sidebar.locator('[data-module-id="guarantees"]')).toHaveAttribute("aria-expanded", "true");
    });
  });
}

test("module links navigate with one click in expanded and collapsed sidebar", async () => {
  for (const collapsed of [false, true]) await fixture(async page => {
    await page.route("https://workspace.test/guarantees", route => route.fulfill({ contentType: "text/html", body: "<h1>Destination fixture</h1>" }));
    await mountRealShell(page);
    const sidebar = page.locator("[data-shell-sidebar]");
    if (collapsed) await sidebar.getByRole("button", { name: "ยุบเมนูด้านข้าง" }).click();
    await sidebar.locator('.sidebar-module-row > a[href="/guarantees"]').click();
    await expect(page).toHaveURL("https://workspace.test/guarantees");
    await expect(page.getByRole("heading", { name: "Destination fixture" })).toBeVisible();
  });
});

test("sidebar disclosure remains usable when storage is unavailable", async () => {
  await fixture(async page => {
    await page.evaluate(() => { Object.defineProperty(window, "localStorage", { get() { throw new DOMException("Unavailable", "SecurityError"); } }); });
    await mountRealShell(page);
    const sidebar = page.locator("[data-shell-sidebar]");
    const disclosure = sidebar.locator('[data-module-id="guarantees"]');
    await disclosure.click();
    await expect(disclosure).toHaveAttribute("aria-expanded", "true");
    await expect(sidebar.locator('[data-module-id="work"]')).toHaveAttribute("aria-expanded", "false");
  });
});

test("sidebar collapse remains usable when storage is unavailable", async () => {
  await fixture(async page => {
    await page.evaluate(() => { Object.defineProperty(window, "localStorage", { get() { throw new DOMException("Unavailable", "SecurityError"); } }); });
    await mountRealShell(page);
    const sidebar = page.locator("[data-shell-sidebar]");
    await sidebar.getByRole("button", { name: "ยุบเมนูด้านข้าง" }).click();
    await expect(sidebar.getByRole("button", { name: "ขยายเมนูด้านข้าง" })).toBeVisible();
    await sidebar.getByRole("button", { name: "ขยายเมนูด้านข้าง" }).click();
    await expect(sidebar.getByRole("button", { name: "ยุบเมนูด้านข้าง" })).toBeVisible();
  });
});

test("native Dialog preserves the interior boundary and drawer geometry", async () => {
  await fixture(async page => {
    const bundle = await build({
      stdin: { contents: `import React, { useState, useRef } from 'react'; import { createRoot } from 'react-dom/client'; import { Dialog } from './src/components/ui/dialog'; function Harness() { const [open, setOpen] = useState(false); const [mounted, setMounted] = useState(true); const [allowClose, setAllowClose] = useState(false); const [busy, setBusy] = useState(false); const opener = useRef(null); return React.createElement('div', null, React.createElement('button', { onClick: () => setOpen(true), ref: opener }, 'เปิด'), React.createElement('button', { onClick: () => setMounted(false) }, 'ถอดเมานท์'), mounted && React.createElement(Dialog, { open, title: 'ทดสอบ', returnFocusRef: opener, busy, beforeClose: async () => { await new Promise(resolve => setTimeout(resolve, 100)); return allowClose; }, onOpenChange: setOpen, className: 'drawer' }, React.createElement('div', { style: { height: '120px' } }, React.createElement('button', { onClick: () => setAllowClose(true) }, 'อนุญาตปิด'), React.createElement('button', { onClick: () => setBusy(value => !value) }, 'สลับไม่ว่าง')))); } createRoot(document.getElementById('root')).render(React.createElement(Harness));`, resolveDir: process.cwd(), loader: "tsx" },
      bundle: true, write: false, platform: "browser", jsx: "automatic", define: { "process.env.NODE_ENV": '"development"' },
    });
    await page.addStyleTag({ content: css() });
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    const opener = page.getByRole("button", { name: "เปิด" });
    await opener.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const geometry = await dialog.evaluate(element => { const rect = element.getBoundingClientRect(); const style = getComputedStyle(element); return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, transform: style.transform, position: style.position }; });
    expect(geometry.position).toBe("fixed");
    expect(geometry.transform).toBe("none");
    expect(geometry.x).toBe(0);
    expect(geometry.y).toBe(0);
    expect(geometry.width).toBeLessThanOrEqual(390);
    expect(geometry.height).toBeGreaterThan(0);
    await page.screenshot({ path: resolve(artifactDir, "mobile-390.png"), animations: "disabled" });

    await page.mouse.click(10, 422);
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "สลับไม่ว่าง" }).click();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "สลับไม่ว่าง" }).click();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "อนุญาตปิด" }).click();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(opener).toBeFocused();

    await opener.click();
    await page.mouse.move(120, 120);
    await page.mouse.down();
    await page.mouse.move(389, 422);
    await page.mouse.up();
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "อนุญาตปิด" }).click();
    await dialog.getByRole("button", { name: "ปิดหน้าต่าง" }).dispatchEvent("click");
    await dialog.getByRole("button", { name: "สลับไม่ว่าง" }).click();
    await page.waitForTimeout(150);
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "สลับไม่ว่าง" }).click();
    await dialog.getByRole("button", { name: "ปิดหน้าต่าง" }).click();
    await page.waitForTimeout(150);
    await expect(dialog).toHaveCount(0);
    await expect(opener).toBeFocused();

    await opener.click();
    await page.getByRole("button", { name: "ถอดเมานท์" }).evaluate((element: HTMLElement) => element.click());
    await expect(dialog).toHaveCount(0);
  });
});

test("native Dialog closes through every user path after StrictMode effect replay", async () => {
  await fixture(async page => {
    const bundle = await build({
      stdin: { contents: `import React, { StrictMode, useRef, useState } from 'react'; import { createRoot } from 'react-dom/client'; import { Dialog } from './src/components/ui/dialog'; function Harness() { const [open, setOpen] = useState(false); const opener = useRef(null); return React.createElement('div', null, React.createElement('button', { ref: opener, onClick: () => setOpen(true) }, 'เปิด'), React.createElement(Dialog, { open, title: 'StrictMode', returnFocusRef: opener, beforeClose: () => true, onOpenChange: setOpen }, React.createElement('p', null, 'เนื้อหา'))); } createRoot(document.getElementById('root')).render(React.createElement(StrictMode, null, React.createElement(Harness)));`, resolveDir: process.cwd(), loader: "tsx" },
      bundle: true, write: false, platform: "browser", jsx: "automatic", define: { "process.env.NODE_ENV": '\"development\"' },
    });
    await page.addStyleTag({ content: css() });
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    const opener = page.getByRole("button", { name: "เปิด" });
    const dialog = page.getByRole("dialog");
    for (const closePath of ["escape", "button", "backdrop"]) {
      await opener.click();
      await expect(dialog).toBeVisible();
      if (closePath === "escape") await page.keyboard.press("Escape");
      if (closePath === "button") await dialog.getByRole("button", { name: "ปิดหน้าต่าง" }).click();
      if (closePath === "backdrop") await page.mouse.click(1, 1);
      await expect(dialog).toHaveCount(0);
      await expect(opener).toBeFocused();
    }
  });
});

test("native Dialog consumes rejected beforeClose without page errors and allows retry", async () => {
  await fixture(async page => {
    const bundle = await build({
      stdin: { contents: `import React, { StrictMode, useRef, useState } from 'react'; import { createRoot } from 'react-dom/client'; import { Dialog } from './src/components/ui/dialog'; function Harness() { const [open, setOpen] = useState(false); const [attempts, setAttempts] = useState(0); const opener = useRef(null); return React.createElement('div', null, React.createElement('button', { ref: opener, onClick: () => setOpen(true) }, 'เปิด'), React.createElement(Dialog, { open, title: 'ปฏิเสธชั่วคราว', returnFocusRef: opener, beforeClose: async () => { if (attempts < 3) { setAttempts(value => value + 1); throw new Error('qa rejection'); } return true; }, onOpenChange: setOpen }, React.createElement('p', null, 'ยังเปิดอยู่'))); } createRoot(document.getElementById('root')).render(React.createElement(StrictMode, null, React.createElement(Harness)));`, resolveDir: process.cwd(), loader: "tsx" },
      bundle: true, write: false, platform: "browser", jsx: "automatic", define: { "process.env.NODE_ENV": '\"development\"' },
    });
    await page.addStyleTag({ content: css() });
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(`pageerror:${error.message}`));
    await page.evaluate(() => {
      window.addEventListener("unhandledrejection", event => { event.preventDefault(); (window as Window & { __unhandledRejections?: string[] }).__unhandledRejections ??= []; (window as Window & { __unhandledRejections?: string[] }).__unhandledRejections.push(String(event.reason)); });
    });
    const opener = page.getByRole("button", { name: "เปิด" });
    const dialog = page.getByRole("dialog");
    await opener.click();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(50);
    await expect(dialog).toBeVisible();
    await page.mouse.click(1, 1);
    await page.waitForTimeout(50);
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "ปิดหน้าต่าง" }).click();
    await page.waitForTimeout(50);
    await expect(dialog).toBeVisible();
    await expect.poll(() => page.evaluate(() => (window as Window & { __unhandledRejections?: string[] }).__unhandledRejections ?? [])).toEqual([]);
    expect(errors).toEqual([]);
    await dialog.getByRole("button", { name: "ปิดหน้าต่าง" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(opener).toBeFocused();
  });
});
