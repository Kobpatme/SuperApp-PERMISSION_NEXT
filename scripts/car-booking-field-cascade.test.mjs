import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const css = ['src/styles/tokens.css', 'src/app/globals.css', 'src/styles/ui.css', 'src/styles/work.css', 'src/features/buildings/building-editor.css', 'src/features/car-booking/car-booking.css'].map(path => readFileSync(path, 'utf8')).join('\n');

test('car workspace and dialog fields follow the building editor without affecting special controls', async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.setContent(`<style>${css}</style><div class="building-editor-form"><label id="reference"><input><select><option>Area</option></select><textarea></textarea></label></div><div class="cb-workspace"><div class="cb-filter"><label><input type="search" class="ui-building-field"></label></div><fieldset disabled><input class="ui-building-field"></fieldset><label class="cb-check"><input type="checkbox"></label></div><div class="cb-dialog"><form><label><input type="datetime-local" class="ui-building-field"></label><label><select class="ui-building-field"><option>Area</option></select></label><label><textarea class="ui-building-field"></textarea></label></form></div>`);
    const keys = ['padding','borderTopWidth','borderTopColor','borderRadius','backgroundColor','color','boxShadow','fontWeight'];
    const style = (selector, props = keys) => page.locator(selector).evaluate((el, names) => Object.fromEntries(names.map(name => [name, getComputedStyle(el)[name]])), props);
    for (const theme of ['light', 'dark']) {
      await page.locator('html').evaluate((el, value) => { el.dataset.theme = value; }, theme);
      for (const [target, reference] of [['.cb-filter input','#reference input'],['.cb-dialog select','#reference select'],['.cb-dialog textarea','#reference textarea'],['.cb-dialog input','#reference input']]) {
        assert.deepEqual(await style(target), await style(reference), `${theme} ${target}`);
        await page.locator(target).focus();
        const targetOutline = await style(target, ['outlineWidth','outlineStyle','outlineColor','outlineOffset']);
        await page.locator(reference).focus();
        assert.deepEqual(targetOutline, await style(reference, ['outlineWidth','outlineStyle','outlineColor','outlineOffset']), `${theme} focus ${target}`);
      }
      assert.equal((await style('.cb-workspace fieldset input', ['opacity'])).opacity, '0.55');
      assert.equal(await page.locator('.cb-check input').getAttribute('class'), null);
      assert.equal(await page.locator('.cb-check input').evaluate(el => getComputedStyle(el).width), '20px');
    }
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(await page.locator('.cb-dialog input').evaluate(el => el.getBoundingClientRect().width <= document.documentElement.clientWidth));
  } finally { await browser.close(); }
});
