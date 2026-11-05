import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const read = p => readFileSync(p, 'utf8');
test('opt-in building fields win representative cascade without adopting popup controls', async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const css = ['src/styles/tokens.css', 'src/styles/ui.css', 'src/styles/work.css', 'src/features/buildings/building-editor.css', 'src/modules/duct-rental/ui-shared/ui-shared.module.css'].map(read).join('\n');
    const controls = cls => `<input class="${cls}"><select class="${cls}"><option>Example</option></select><textarea rows="5" class="${cls}"></textarea>`;
    await page.setContent(`<style>${css}\n#section,#filter,#duct,#popup,#popup-opt,#ref,#unadopted { font: 400 14px/1.6 sans-serif; }</style><div class="building-editor-form"><label id="ref">${controls('')}</label></div><form class="work-create-page-form work-create-form ui-form"><fieldset class="ui-form-section" id="section">${controls('ui-building-field')}</fieldset><fieldset class="ui-form-section" id="busy" disabled>${controls('ui-building-field')}</fieldset></form><div class="ui-filter" id="filter">${controls('ui-building-field')}</div><div class="field" id="duct">${controls('ui-building-field')}</div><div class="work-create-dialog"><form class="work-create-form ui-form"><div id="popup">${controls('')}</div><div id="popup-opt">${controls('ui-building-field')}</div><fieldset class="ui-form-section" id="popup-busy" disabled><div id="popup-busy-opt">${controls('ui-building-field')}</div><div id="popup-busy-plain">${controls('')}</div></fieldset></form></div><div class="field" id="unadopted">${controls('')}</div>`);
    const props = ['boxSizing','minWidth','minHeight','height','padding','borderTopWidth','borderTopColor','borderRadius','backgroundColor','color','boxShadow','fontWeight','fontSize','fontFamily','lineHeight','resize'];
    const styles = async (id, tag) => page.locator(`#${id} ${tag}`).evaluate((e, keys) => Object.fromEntries(keys.map(k => [k, getComputedStyle(e)[k]])), props);
    for (const theme of ['light', 'dark']) {
    await page.locator('html').evaluate((element, value) => { element.dataset.theme = value; }, theme);
    await page.locator('#ref input').evaluate(e => e.removeAttribute('aria-invalid'));
    // Approved reference border remains below 3:1 against its surface. This is
    // an accessibility assurance blocker, not a passing contrast assertion.
    const contrast = await page.locator('#ref input').evaluate(e => {
      const s = getComputedStyle(e);
      const luminance = color => {
        const channels = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(n => n / 255).map(n => n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4);
        return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
      };
      const values = [luminance(s.borderTopColor), luminance(s.backgroundColor)].sort((a, b) => b - a);
      return (values[0] + 0.05) / (values[1] + 0.05);
    });
    console.log(`${theme} approved reference boundary contrast ${contrast.toFixed(2)}:1${contrast < 3 ? ', accessibility assurance blocked' : ''}`);
    for (const context of ['section', 'filter', 'duct', 'popup-opt']) {
      for (const tag of ['input','select','textarea']) {
        await page.locator(`#ref ${tag}`).evaluate(e => e.removeAttribute('aria-invalid'));
        const actual = await styles(context, tag);
        const reference = await styles('ref', tag);
        for (const key of props) assert.equal(actual[key], reference[key], `${context} ${tag} ${key}`);
        await page.locator(`#${context} ${tag}`).evaluate(e => e.setAttribute('aria-invalid','true'));
        await page.locator(`#ref ${tag}`).evaluate(e => e.setAttribute('aria-invalid','true'));
        assert.equal((await styles(context, tag)).borderTopColor, (await styles('ref', tag)).borderTopColor);
        for (const id of [context, 'ref']) {
          await page.locator(`#${id} ${tag}`).focus();
          const outline = await page.locator(`#${id} ${tag}`).evaluate(e => { const s = getComputedStyle(e); return [s.outlineWidth,s.outlineStyle,s.outlineColor,s.outlineOffset]; });
          if (id === context) var expectedOutline = outline;
          else { assert.equal(outline[0], '2px'); assert.equal(outline[1], 'solid'); assert.equal(outline[3], '2px'); assert.deepEqual(outline, expectedOutline, `${context} ${tag} focus`); }
        }
        const target = page.locator(`#${context} ${tag}`);
        await target.evaluate(e => { e.disabled = true; });
        const disabled = await target.evaluate(e => { const s = getComputedStyle(e); return [s.opacity, s.cursor, s.backgroundColor]; });
        assert.equal(disabled[0], '0.55'); assert.equal(disabled[1], 'not-allowed');
        assert.notEqual(disabled[2], actual.backgroundColor);
        if (tag !== 'select') {
          await target.evaluate(e => { e.disabled = false; e.readOnly = true; });
          const readonly = await target.evaluate(e => { const s = getComputedStyle(e); return [s.opacity, s.cursor, s.backgroundColor]; });
          assert.deepEqual(readonly, ['1', 'default', disabled[2]]);
        }
        await target.evaluate(e => { e.disabled = false; e.removeAttribute('readonly'); e.removeAttribute('aria-invalid'); });
      }
    }
    for (const tag of ['input', 'select', 'textarea']) {
      const busy = await page.locator(`#busy ${tag}`).evaluate(e => [getComputedStyle(e).opacity, getComputedStyle(e.closest('fieldset')).opacity, e.matches(':disabled')]);
      assert.deepEqual(busy, ['1', '0.55', true], `${theme} busy ${tag}`);
      for (const id of ['popup-busy-opt', 'popup-busy-plain']) {
        const state = await page.locator(`#${id} ${tag}`).evaluate(e => {
          let opacity = 1;
          for (let node = e; node; node = node.parentElement) opacity *= Number(getComputedStyle(node).opacity);
          return { opacity, ownOpacity: getComputedStyle(e).opacity, disabled: e.matches(':disabled') };
        });
        assert.equal(state.disabled, true, `${theme} ${id} ${tag} disabled`);
        const ownOpacity = id === 'popup-busy-plain' && tag === 'select' ? 0.7 : 1;
        assert.equal(state.opacity, 0.55 * ownOpacity, `${theme} ${id} ${tag} effective opacity`);
        assert.equal(state.ownOpacity, String(ownOpacity), `${theme} ${id} ${tag} own opacity`);
      }
    }
    }
    // Duct's own skin now uses the approved 44px minimum, not the former 85px.
    // The rows attribute must still determine the actual multiline height.
    for (const id of ['section', 'duct', 'unadopted']) {
      const area = page.locator(`#${id} textarea`);
      const initial = await area.evaluate(e => {
        const s = getComputedStyle(e);
        return { rows: e.rows, height: e.getBoundingClientRect().height, lineHeight: parseFloat(s.lineHeight), padding: parseFloat(s.paddingTop) + parseFloat(s.paddingBottom), minHeight: s.minHeight, resize: s.resize };
      });
      assert.equal(initial.rows, 5, `${id} rows`);
      assert.equal(initial.minHeight, '44px', `${id} minimum`);
      assert.equal(initial.resize, 'vertical', `${id} resize`);
      assert.ok(initial.height >= initial.lineHeight * 5 + initial.padding, `${id} fits five rows`);
      await area.fill('one\ntwo\nthree\nfour\nfive');
      assert.ok(await area.evaluate(e => e.scrollHeight <= e.clientHeight), `${id} displays five lines without scrolling`);
      await area.evaluate(e => { e.style.height = '200px'; });
      assert.equal(await area.evaluate(e => e.getBoundingClientRect().height), 200, `${id} can grow vertically`);
      await area.evaluate(e => { e.style.removeProperty('height'); e.value = ''; });
    }
    // A plain duct field receives duct-local styling, not the Building opt-in class.
    assert.equal((await styles('unadopted', 'input')).padding, '8px 12px');
    assert.equal(await page.locator('#unadopted input').getAttribute('class'), '');
    assert.equal((await styles('popup', 'input')).boxShadow, 'none');
    assert.notEqual((await styles('popup-opt', 'input')).boxShadow, 'none');
    assert.notEqual(await page.locator('#popup input').getAttribute('class'), 'ui-building-field');
  } finally { await browser.close(); }
});
