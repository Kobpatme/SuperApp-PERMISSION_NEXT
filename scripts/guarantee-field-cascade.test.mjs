import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const cssPaths = ['src/styles/tokens.css', 'src/app/globals.css', 'src/styles/ui.css', 'src/styles/work.css', 'src/features/buildings/building-editor.css', 'src/app/(platform)/guarantees/deposit.css', 'src/components/guarantee-executive-dashboard.css'];
const css = cssPaths.map(path => readFileSync(path, 'utf8')).join('\n');

test('guarantee controls retain reference styling and compact module sizes in Chromium', async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.setContent(`<style>${css}</style>
      <div class="building-editor-form"><label id="reference"><input><select><option>Area</option></select><textarea></textarea></label></div>
      <div class="deposit-workspace"><div class="legacy-head-actions" id="export"><select class="ui-building-field"><option>Month</option></select></div>
      <div class="legacy-filter-bar" id="filter"><label class="deposit-search"><input type="search" class="ui-building-field"></label><select class="ui-building-field"><option>Status</option></select></div>
      <div class="guarantee-report"><div class="gr-filterbar" id="report"><label>Area<select class="ui-building-field"><option>Area</option></select></label></div></div></div>
      <div class="deposit-module-page"><form class="deposit-form ui-form" id="guarantee-form"><fieldset class="ui-form-section deposit-form-section" id="editor"><div class="deposit-form-fields"><input class="ui-building-field"><select class="ui-building-field"><option>Area</option></select><input class="ui-building-field" readonly><input type="hidden" name="id" value="item-1"><input type="file" name="evidence" class="deposit-evidence-input"><div class="compound"><input name="compound" value="initial"></div></div></fieldset><fieldset class="ui-form-section" id="pending" disabled><input class="ui-building-field"><select class="ui-building-field"><option>Area</option></select></fieldset></form><div class="deposit-transition" id="transition"><label>Reason<textarea class="ui-building-field" name="reason"></textarea></label></div></div>
      <div class="field" id="plain"><input><input type="file"><input type="hidden"><div class="compound"><input></div></div>`);
    const keys = ['padding','borderTopWidth','borderTopColor','borderRadius','backgroundColor','color','boxShadow','fontWeight'];
    const style = (selector, props = keys) => page.locator(selector).evaluate((e, p) => Object.fromEntries(p.map(k => [k, getComputedStyle(e)[k]])), props);
    for (const theme of ['light', 'dark']) {
      await page.locator('html').evaluate((e, value) => { e.dataset.theme = value; }, theme);
      for (const [target, ref] of [['#export select','#reference select'], ['#filter input','#reference input'], ['#filter select','#reference select'], ['#report select','#reference select'], ['#editor input.ui-building-field:not([readonly])','#reference input'], ['#editor select','#reference select'], ['#transition textarea','#reference textarea']]) {
        const baseline = await style(ref);
        assert.deepEqual(await style(target), baseline, `${theme} ${target} visual reference`);
        for (const sel of [target, ref]) await page.locator(sel).evaluate(e => e.setAttribute('aria-invalid', 'true'));
        assert.equal((await style(target)).borderTopColor, (await style(ref)).borderTopColor, `${theme} ${target} error`);
        for (const sel of [target, ref]) {
          await page.locator(sel).focus();
          const outline = await style(sel, ['outlineWidth','outlineStyle','outlineColor','outlineOffset']);
          if (sel === target) var targetOutline = outline;
          else { assert.deepEqual(outline, targetOutline, `${theme} ${target} focus`); assert.equal(outline.outlineWidth, '2px'); }
          await page.locator(sel).evaluate(e => e.removeAttribute('aria-invalid'));
        }
        await page.locator(target).evaluate(e => { e.disabled = true; });
        const disabled = await style(target, ['opacity','cursor','backgroundColor']);
        assert.equal(disabled.opacity, '0.55'); assert.equal(disabled.cursor, 'not-allowed'); assert.notEqual(disabled.backgroundColor, baseline.backgroundColor);
        await page.locator(target).evaluate(e => { e.disabled = false; });
      }
      const readonly = await style('#editor input[readonly]', ['opacity','cursor','backgroundColor']);
      assert.equal(readonly.opacity, '1'); assert.equal(readonly.cursor, 'default');
      for (const tag of ['input','select']) assert.deepEqual(await page.locator(`#pending ${tag}`).evaluate(e => [e.matches(':disabled'),getComputedStyle(e).opacity,getComputedStyle(e.closest('fieldset')).opacity]), [true,'0.55','1']);
      const sizes = await page.evaluate(() => {
        const measure = sel => { const e = document.querySelector(sel); const s = getComputedStyle(e); return { width: e.getBoundingClientRect().width, minWidth: s.minWidth, minHeight: s.minHeight }; };
        return { export: measure('#export select'), filter: measure('#filter select'), transition: measure('#transition textarea'), token: getComputedStyle(document.documentElement).getPropertyValue('--size-panel-min').trim(), mobile: getComputedStyle(document.documentElement).getPropertyValue('--size-shell-header-mobile').trim() };
      });
      assert.equal(sizes.filter.minWidth, sizes.token, `${theme} filter minimum`);
      assert.equal(sizes.transition.minHeight, sizes.mobile, `${theme} textarea minimum`);
      assert.ok(sizes.export.width < 300, `${theme} export select compact: ${sizes.export.width}`);
      assert.ok(sizes.filter.width >= parseFloat(sizes.token), `${theme} filter select minimum`);
      for (const selector of ['#editor input[type=file]', '#editor .compound input']) {
        const original = await style(selector);
        await page.locator(selector).evaluate(e => e.classList.add('ui-building-field'));
        assert.notDeepEqual(await style(selector), original, `${theme} ${selector} does not receive opt-in styling`);
        await page.locator(selector).evaluate(e => e.classList.remove('ui-building-field'));
        assert.deepEqual(await style(selector), original);
      }
      assert.equal(await page.locator('#editor input[type=hidden]').evaluate(e => getComputedStyle(e).display), 'none');
      await page.locator('#editor input[type=file]').setInputFiles({ name: 'evidence.pdf', mimeType: 'application/pdf', buffer: Buffer.from('evidence') });
      await page.locator('#editor .compound input').fill('edited');
      assert.deepEqual(await page.locator('#guarantee-form').evaluate(e => { const data = new FormData(e); return [data.get('id'), data.get('evidence').name, data.get('compound')]; }), ['item-1', 'evidence.pdf', 'edited']);
    }
  } finally { await browser.close(); }
});
