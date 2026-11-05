import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';

test('building compound search has one border and retains keyboard focus', async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const css = ['src/styles/tokens.css', 'src/styles/ui.css', 'src/app/(platform)/buildings/permission-buildings.css', 'src/app/(platform)/buildings/buildings-presentation.css'].map(p => readFileSync(p, 'utf8')).join('\n');
    await page.setContent(`<style>${css}</style><section class="permission-workspace" data-ui-screen="buildings"><header class="permission-toolbar permission-overview-toolbar"><div class="permission-search-actions ui-form-controls"><div class="permission-search"><span aria-hidden="true">⌕</span><input id="permission-search-input" role="combobox" aria-label="ค้นหาอาคาร" value="test"><button type="button" class="permission-search-clear" aria-label="ล้างการค้นหา">×</button></div></div></header></section>`);
    for (const width of [375, 1200]) for (const theme of ['light', 'dark']) for (const dir of ['ltr', 'rtl']) {
      await page.locator('html').evaluate((e, d) => { e.dir = d; }, dir);
      await page.setViewportSize({ width, height: 800 });
      await page.locator('html').evaluate((e, t) => { e.dataset.theme = t; }, theme);
      const search = page.locator('.permission-search');
      const input = search.locator('input');
      const geometry = await search.evaluate(e => { const input = e.querySelector('input'); const icon = e.querySelector('span').getBoundingClientRect(); const clear = e.querySelector('button').getBoundingClientRect(); const box = input.getBoundingClientRect(); const style = getComputedStyle(input); return { icon: icon.right, textStart: box.left + parseFloat(style.paddingLeft), textEnd: box.right - parseFloat(style.paddingRight), clear: clear.left }; });
      assert.ok(geometry.textStart >= geometry.icon, JSON.stringify({ width, theme, dir, geometry }));
      assert.ok(geometry.textEnd <= geometry.clear, JSON.stringify({ width, theme, dir, geometry }));
      const outer = await search.evaluate(e => getComputedStyle(e).borderTopWidth);
      const inner = await input.evaluate(e => { const s = getComputedStyle(e); return [s.borderTopWidth, s.backgroundColor]; });
      assert.equal(outer, '1px');
      assert.deepEqual(inner, ['0px', 'rgba(0, 0, 0, 0)'], theme);
      await page.locator("body").click({ position: { x: 0, y: 0 } });
      await page.keyboard.press("Tab");
      assert.equal(await input.evaluate(e => document.activeElement === e), true);
      const outline = await search.evaluate(e => { const s = getComputedStyle(e); return [s.outlineStyle, s.outlineWidth]; });
      assert.equal(outline[0], 'solid');
      assert.ok(parseFloat(outline[1]) >= 2);
      assert.equal(await search.locator('span').isVisible(), true);
      assert.equal(await search.locator('button').isVisible(), true);
    }
  } finally { await browser.close(); }
});