import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');

// Bundle the real WorkspaceSearch component with its imports stubbed so the
// browser test renders the actual component + actual CSS against a fixture
// module registry (no live API, no secrets).
const STUBS = {
  'next/navigation': `
export const useRouter = () => ({ push: (href) => { window.__SEARCH_PUSH__ = href; } });
export const useSearchParams = () => new URLSearchParams();
export const usePathname = () => '/';
`,
  '@/lib/module-registry': `
export const modules = [
  { id: 'buildings', name: 'ข้อมูลอาคาร', description: 'ค้นหาข้อมูลอาคาร ค่าใช้จ่าย ใบเสนอราคา', searchTerms: ['อาคาร','ค่าใช้จ่าย','ใบเสนอราคา'], href: '/buildings', icon: 'buildings' },
  { id: 'work', name: 'งานและ KPI', description: 'จัดการงาน ติดตามผล', searchTerms: ['งาน','kpi','ประเมิน'], href: '/work', icon: 'work' },
  { id: 'car-booking', name: 'ระบบจองรถ', description: 'จองและคืนรถ', searchTerms: ['จองรถ','คืนรถ'], href: '/car-booking', icon: 'car' },
];
export const overviewDestination = { id: 'overview', href: '/', name: 'ภาพรวม', shortLabel: 'HOME', description: '', searchTerms: ['home','หน้าหลัก','ภาพรวม','workspace'] };
export function getModuleIcon() { return 'arrow'; }
`,
  '@/components/workspace-icon': `
import React from 'react';
export function WorkspaceIcon({ name, size = 20 }) {
  return React.createElement('svg', { 'aria-hidden': 'true', width: size, height: size });
}
`,
  '@/components/ui/truncated-text': `
import React from 'react';
export function TruncatedText({ text, lines = 1 }) {
  return React.createElement('span', { className: 'truncated-text-wrap' }, text);
}
`,
};

const bundleSearch = async (allowed) => {
  const entry = `
import React from 'react';
import { createRoot } from 'react-dom/client';
import { WorkspaceSearch } from './src/components/workspace-search';
const allowed = (typeof window !== 'undefined' && window.__SEARCH_ALLOWED__) || [];
createRoot(document.getElementById('root')).render(React.createElement(WorkspaceSearch, { allowedModuleIds: allowed, contained: true }));
`;
  const bundle = await build({
    stdin: { contents: entry, resolveDir: process.cwd(), loader: 'tsx' },
    bundle: true, write: false, outdir: 'out', platform: 'browser', jsx: 'automatic',
    plugins: [{
      name: 'search-stubs',
      setup(build) {
        for (const [spec, contents] of Object.entries(STUBS)) {
          build.onResolve({ filter: new RegExp(`^${spec.replace(/[/\\^$*+?.()|[\]{}]/g, '\\$&')}$`) }, () => ({ path: spec, namespace: 'stub' }));
        }
        build.onResolve({ filter: /^@\// }, (args) => ({ path: `src/${args.path.slice(2)}` }));
        build.onLoad({ filter: /.*/, namespace: 'stub' }, (args) => ({
          resolveDir: process.cwd(), loader: 'jsx', contents: STUBS[args.path],
        }));
      },
    }],
  });
  return bundle.outputFiles.find((f) => f.path.endsWith('.js')).text;
};

const css = ['src/app/globals.css', 'src/styles/tokens.css', 'src/styles/shell.css', 'src/styles/components.css', 'src/styles/ui.css'].map(read).join('\n');

const fetchStub = `
window.fetch = () => Promise.resolve({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: () => Promise.resolve({ ready: true, partial: false, results: [] }) });
`;

const runScenario = async ({ width, height = 800, theme, allowed, viewport }) => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width, height: height || 800 }, reducedMotion: 'reduce' });
    await page.setContent(`<style>${css}</style><script>${fetchStub}</script><div class="workspace-shell"><header class="shell-header"><div class="topbar"><div id="root"></div></div></header><main style="padding-top:160px"><button id="outside">Outside</button></main></div>`);
    await page.evaluate((v) => { window.__SEARCH_ALLOWED__ = v; }, allowed);
    const js = await bundleSearch(allowed);
    await page.addScriptTag({ content: js });
    await page.locator('html').evaluate((el, value) => { el.dataset.theme = value; }, theme);
    return { page, browser, close: () => browser.close() };
  } catch (err) {
    await browser.close().catch(() => {});
    throw err;
  }
};

const focusInput = async (page) => {
  await page.waitForFunction(() => document.activeElement && document.activeElement.id === 'workspace-search-input', { timeout: 5000 });
};
const focusTrigger = async (page) => {
  await page.waitForFunction(() => {
    const t = document.querySelector('.workspace-search-trigger');
    return t && document.activeElement === t;
  }, { timeout: 5000 });
};

test('real browser: mobile 390 tap trigger opens, focuses input, escape returns focus to trigger, no overflow, back-to-back', async () => {
  const { page, close } = await runScenario({ width: 390, height: 800, theme: 'light', allowed: [] });
  try {
    const trigger = page.locator('.workspace-search-trigger');
    const input = page.locator('#workspace-search-input');
    const popover = page.locator('.workspace-search-popover');

    // Closed: trigger visible, search field hidden.
    assert.equal(await trigger.count(), 1);
    assert.equal(await trigger.isVisible(), true);
    assert.equal(await input.isVisible(), false);

    // Tap trigger -> opens, input focused, no immediate close.
    await trigger.click();
    await focusInput(page);
    assert.equal(await popover.isVisible(), true);
    assert.equal(await trigger.getAttribute('aria-expanded'), 'true');

    // No overflow: popover within viewport at 390.
    const box = await popover.boundingBox();
    assert.ok(box && box.x >= 0 && box.x + box.width <= 390 && box.y >= 0 && box.y + box.height <= 800, `mobile popover overflow ${JSON.stringify(box)}`);

    // Escape -> closes, focus returns to visible trigger, no reopen.
    await page.keyboard.press('Escape');
    await popover.waitFor({ state: 'hidden' });
    await focusTrigger(page);
    assert.equal(await trigger.getAttribute('aria-expanded'), 'false');

    // Back-to-back transitions stay stable: open -> close -> open -> close.
    await page.keyboard.press('Escape'); await popover.waitFor({ state: 'hidden' }); await focusTrigger(page);
    assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
    await trigger.click(); await focusInput(page); assert.equal(await popover.isVisible(), true);
    await page.keyboard.press('Escape'); await popover.waitFor({ state: 'hidden' }); await focusTrigger(page);
    assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
  } finally { await close(); }
});

test('real browser: mobile 390 dark theme same focus/close contract', async () => {
  const { page, close } = await runScenario({ width: 390, height: 800, theme: 'dark', allowed: [] });
  try {
    const trigger = page.locator('.workspace-search-trigger');
    const input = page.locator('#workspace-search-input');
    const popover = page.locator('.workspace-search-popover');
    await trigger.click();
    await focusInput(page);
    assert.equal(await popover.isVisible(), true);
    await page.keyboard.press('Escape');
    await popover.waitFor({ state: 'hidden' });
    await focusTrigger(page);
    assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
  } finally { await close(); }
});

test('real browser: mobile 390 keyboard trigger Ctrl+K opens and focuses input', async () => {
  const { page, close } = await runScenario({ width: 390, height: 800, theme: 'light', allowed: [] });
  try {
    const input = page.locator('#workspace-search-input');
    const popover = page.locator('.workspace-search-popover');
    await page.keyboard.press('Control+k');
    await focusInput(page);
    assert.equal(await popover.isVisible(), true);
    assert.equal(await input.getAttribute('aria-expanded'), 'true');
  } finally { await close(); }
});

test('real browser: desktop 1440 click input opens, arrows move selection, Enter navigates, Escape closes', async () => {
  const pushCalls = [];
  const { page, close } = await runScenario({ width: 1440, height: 900, theme: 'light', allowed: ['buildings', 'work', 'car-booking'] });
  try {

    const input = page.locator('#workspace-search-input');
    const popover = page.locator('.workspace-search-popover');
    const options = page.locator('[role="option"]');

    // Desktop: search field always visible, trigger hidden.
    assert.equal(await input.isVisible(), true);
    assert.equal(await page.locator('.workspace-search-trigger').isVisible(), false);

    await input.click();
    await focusInput(page);
    assert.equal(await popover.isVisible(), true);

    // ArrowDown moves active selection.
    await page.keyboard.press('ArrowDown');
    await page.waitForFunction(() => document.querySelector('[role="option"][aria-selected="true"]') !== null, { timeout: 3000 });
    assert.equal(await page.locator('[role="option"][aria-selected="true"]').count(), 1);

    // ArrowUp moves back.
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(50);
    const first = await options.first().getAttribute('aria-selected');
    assert.equal(first, 'true');

    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => window.__SEARCH_PUSH__), '/');
    await input.click();

    // Escape closes.
    await page.keyboard.press('Escape');
    await popover.waitFor({ state: 'hidden' });
  } finally { await close(); }
});

test('real browser: desktop 1440 dark theme arrows and escape', async () => {
  const { page, close } = await runScenario({ width: 1440, height: 900, theme: 'dark', allowed: ['buildings', 'work', 'car-booking'] });
  try {
    const input = page.locator('#workspace-search-input');
    const popover = page.locator('.workspace-search-popover');
    await input.click();
    await focusInput(page);
    assert.equal(await popover.isVisible(), true);
    await page.keyboard.press('ArrowDown');
    await page.waitForFunction(() => document.querySelector('[role="option"][aria-selected="true"]') !== null, { timeout: 3000 });
    await page.keyboard.press('Escape');
    await popover.waitFor({ state: 'hidden' });
  } finally { await close(); }
});

test('mobile close, outside pointer and Tab preserve intended focus', async () => {
  const { page, close } = await runScenario({ width: 390, theme: 'light', allowed: [] });
  try {
    const trigger = page.locator('.workspace-search-trigger');
    const popover = page.locator('.workspace-search-popover');
    const outside = page.locator('#outside');
    await trigger.click(); await focusInput(page);
    await page.locator('.workspace-search-close').click();
    await popover.waitFor({ state: 'hidden' }); await focusTrigger(page);
    await trigger.click(); await focusInput(page);
    await outside.click();
    await popover.waitFor({ state: 'hidden' });
    assert.equal(await outside.evaluate((el) => el === document.activeElement), true);
    await trigger.click(); await focusInput(page);
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await popover.waitFor({ state: 'hidden' });
    assert.equal(await outside.evaluate((el) => el === document.activeElement), true);
  } finally { await close(); }
});

test('real browser: mobile 390 no unauthorized results when module not allowed', async () => {
  const { page, close } = await runScenario({ width: 390, height: 800, theme: 'light', allowed: [] });
  try {
    const trigger = page.locator('.workspace-search-trigger');
    const input = page.locator('#workspace-search-input');
    const options = page.locator('[role="option"]');
    await trigger.click();
    await focusInput(page);
    // Query matches only an unauthorized module (car-booking) -> no option rendered.
    await input.fill('จองรถ');
    await page.waitForTimeout(320);
    assert.equal(await options.count(), 0);
    const feedback = await page.locator('.search-feedback').textContent();
    assert.ok(feedback.includes('ไม่พบข้อมูล'), `feedback shows empty state: ${feedback}`);
  } finally { await close(); }
});
