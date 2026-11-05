import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const paths = ['src/styles/tokens.css', 'src/app/globals.css', 'src/styles/ui.css', 'src/features/buildings/building-editor.css', 'src/modules/duct-rental/ui-shared/ui-shared.module.css'];
// Translate CSS-module local names for this isolated browser fixture; retain global selectors.
const css = paths.map((path, i) => {
  const source = readFileSync(path, 'utf8');
  return i === paths.length - 1 ? source.replace(/:global\(([^)]+)\)/g, '$1') : source;
}).join('\n');

test('duct field cascade, error precedence and native control boundaries', async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(`<style>${css}</style><div class="building-editor-form"><input id="reference"><textarea id="refarea"></textarea></div><div class="workspace"><div class="field"><input id="dynamic" aria-invalid="true"><select id="select"><option>A</option></select><textarea id="area" rows="4"></textarea><input id="readonly" readonly><input id="disabled" disabled><input id="date" type="date"><input id="file" type="file"><input id="check" type="checkbox"><input id="radio" type="radio"></div><fieldset disabled><div class="field"><input id="fieldset"></div></fieldset><dialog class="modal" open><div class="field"><input id="modal" aria-invalid="true"></div></dialog><div class="actions"><select id="zoom" class="input pdfZoom"><option value="1">100%</option><option value="2">200%</option></select></div><input id="unadopted"></div>`);
    const style = (id, names) => page.locator(id).evaluate((el, keys) => Object.fromEntries(keys.map(key => [key, getComputedStyle(el)[key]])), names);
    for (const theme of ['light', 'dark']) {
      await page.locator('html').evaluate((el, value) => { el.dataset.theme = value; }, theme);
      const props = ['padding', 'borderTopWidth', 'borderRadius', 'backgroundColor', 'color', 'boxShadow', 'fontWeight'];
      assert.deepEqual(await style('#select', props), await style('#reference', props));
      assert.equal((await style('#area', ['minHeight'])).minHeight, '44px');
      assert.ok(await page.locator('#area').evaluate(el => el.clientHeight > 44));
      for (const id of ['#dynamic', '#modal']) {
        const danger = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-danger').trim());
        const expected = await page.evaluate(value => { const el = document.createElement('i'); el.style.color = value; document.body.append(el); const color = getComputedStyle(el).color; el.remove(); return color; }, danger);
        assert.equal((await style(id, ['borderTopColor'])).borderTopColor, expected);
        await page.locator(id).focus();
        const focused = await style(id, ['borderTopColor', 'outlineStyle', 'outlineWidth']);
        assert.equal(focused.borderTopColor, expected);
        assert.equal(focused.outlineStyle, 'solid');
        assert.equal(focused.outlineWidth, '2px');
      }
      for (const id of ['#disabled', '#fieldset']) assert.deepEqual(await style(id, ['opacity', 'cursor']), { opacity: '0.55', cursor: 'not-allowed' });
      assert.equal((await style('fieldset', ['opacity'])).opacity, '1');
      assert.deepEqual(await style('#readonly', ['opacity', 'cursor']), { opacity: '1', cursor: 'default' });
      assert.equal((await style('#zoom', ['padding'])).padding, '8px 12px');
      await page.selectOption('#zoom', '2');
      assert.equal(await page.locator('#zoom').inputValue(), '2');
      assert.notEqual((await style('#unadopted', ['padding'])).padding, '8px 12px');
      const dateProps = ['padding', 'minHeight', 'height', 'borderTopWidth', 'borderTopColor', 'borderRadius', 'backgroundColor', 'color', 'boxShadow'];
      assert.deepEqual(await style('#date', dateProps), await style('#reference', dateProps));
      assert.equal((await style('#date', ['appearance'])).appearance, 'auto');
      assert.deepEqual(await page.locator('#date').evaluate(el => {
        el.min = '2026-01-01';
        el.max = '2026-12-31';
        el.value = '2026-06-15';
        const valid = el.validity.valid && el.value === '2026-06-15';
        el.value = '2025-12-31';
        const rangeUnderflow = el.validity.rangeUnderflow && !el.validity.valid;
        el.value = 'not-a-date';
        return { type: el.type, valid, rangeUnderflow, sanitized: el.value === '', min: el.min, max: el.max, showPicker: typeof el.showPicker };
      }), { type: 'date', valid: true, rangeUnderflow: true, sanitized: true, min: '2026-01-01', max: '2026-12-31', showPicker: 'function' });
      for (const id of ['#file', '#check', '#radio']) assert.notEqual((await style(id, ['padding'])).padding, '8px 12px');
    }
  } finally { await browser.close(); }
});
