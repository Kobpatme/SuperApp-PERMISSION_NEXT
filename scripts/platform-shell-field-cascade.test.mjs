import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { build } from 'esbuild';

const read = path => readFileSync(path, 'utf8');
test('shell compound fields keep one reference border and visible focus', async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    const css = ['src/styles/tokens.css', 'src/app/globals.css', 'src/styles/shell.css', 'src/styles/components.css', 'src/styles/ui.css', 'src/styles/notifications.css', 'src/styles/work.css', 'src/styles/auth.css', 'src/features/buildings/building-editor.css'].map(read).join('\n');
    await page.setContent(`<style>${css}</style><div class="building-editor-form"><label><input id="reference"></label></div><div class="workspace-shell"><div class="workspace-search"><label class="search shell-compound-field" id="global"><svg></svg><input aria-label="global"><kbd>Ctrl K</kbd></label></div><div class="queue-toolbar"><label class="queue-search shell-compound-field" id="queue"><svg></svg><input type="search" aria-label="queue"></label></div></div>`);
    for (const theme of ['light', 'dark']) {
      await page.locator('html').evaluate((element, value) => { element.dataset.theme = value; }, theme);
      const reference = await page.locator('#reference').evaluate(e => { const s = getComputedStyle(e); return [s.borderTopColor, s.borderTopWidth, s.borderRadius, s.backgroundColor, s.boxShadow]; });
      for (const id of ['global', 'queue']) {
        const wrapper = page.locator(`#${id}`);
        const input = wrapper.locator('input');
        const actual = await wrapper.evaluate(e => { const s = getComputedStyle(e); return [s.borderTopColor, s.borderTopWidth, s.borderRadius, s.backgroundColor, s.boxShadow]; });
        assert.deepEqual(actual, reference, `${theme} ${id} reference surface`);
        const inner = await input.evaluate(e => { const s = getComputedStyle(e); return [s.borderTopWidth, s.backgroundColor, s.boxShadow]; });
        assert.deepEqual(inner, ['0px', 'rgba(0, 0, 0, 0)', 'none']);
        await input.focus();
        const focus = await wrapper.evaluate(e => { const s = getComputedStyle(e); return [s.outlineWidth, s.outlineStyle]; });
        assert.deepEqual(focus, ['2px', 'solid']);
        await input.fill('query');
        assert.equal(await input.inputValue(), 'query');
      }
    }
  } finally { await browser.close(); }
});

test('real shell account and notification overlays remain usable at desktop and mobile widths', async () => {
  const bundle = await build({
    stdin: { contents: `import React from 'react';
      import { createRoot } from 'react-dom/client';
      import { AppShell } from './src/components/app-shell';
      import { NotificationCenter } from './src/components/notification-center';
      createRoot(document.getElementById('root')).render(<AppShell allowedModuleIds={[]} displayName="Test User" notificationCenter={<NotificationCenter inbox={{state:'ready', unread:0, items:[], canUpdate:false}}/>}><main>Content</main></AppShell>);`, resolveDir: process.cwd(), loader: 'tsx' },
    bundle: true, write: false, outdir: 'out', platform: 'browser', jsx: 'automatic',
    plugins: [{ name: 'fixture-boundaries', setup(build) {
      build.onResolve({ filter: /^@\// }, args => args.path === '@/app/login/actions' || args.path === '@/app/(platform)/notification-actions' ? ({ path: args.path, namespace: 'stub' }) : undefined);
      build.onResolve({ filter: /^next\/(link|image|navigation)$/ }, args => ({ path: args.path, namespace: 'stub' }));
      build.onLoad({ filter: /.*/, namespace: 'stub' }, args => ({ resolveDir: process.cwd(), loader: 'jsx', contents: args.path === 'next/link' ? `import React from 'react'; export default function Link({children,href,...props}) { return <a href={href} {...props}>{children}</a> }` : args.path === 'next/image' ? `import React from 'react'; export default function Image(props) { return <img {...props}/> }` : args.path === 'next/navigation' ? `export const useRouter = () => ({push(){}}); export const usePathname = () => '/'; export const useSearchParams = () => new URLSearchParams();` : `export async function logoutAction() {} export async function markNotificationsRead() { return {message:''} }` }));
    }}],
  });
  const js = bundle.outputFiles.find(file => file.path.endsWith('.js')).text;
  const moduleCss = bundle.outputFiles.find(file => file.path.endsWith('.css')).text;
  const cssPaths = [...read('src/app/layout.tsx').matchAll(/import "@\/([^" ]+\.css)"/g)].map(match => `src/${match[1]}`);
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [1200, 375]) {
      const page = await browser.newPage({ viewport: { width, height: 800 }, reducedMotion: 'reduce' });
      await page.setContent(`<style>${cssPaths.map(read).join(' ')} ${moduleCss}</style><div id="root"></div>`);
      await page.addScriptTag({ content: js });
      const isMobile = width <= 650;
      // Mobile shows the 44px trigger button (search field is intentionally hidden when closed);
      // desktop shows the inline search field. Both expose exactly one visible search icon.
      const icon = page.locator(isMobile ? '.workspace-search-trigger svg' : '.workspace-search .search > svg');
      assert.equal(await icon.count(), 1);
      assert.equal(await icon.isVisible(), true, `${width} visible search icon`);
      const account = page.locator('.account-trigger');
      await account.click();
      const popover = page.locator('.account-popover');
      const box = await popover.boundingBox();
      assert.ok(box && box.x >= 0 && box.x + box.width <= width && box.y >= 0 && box.y + box.height <= 800, `${width} account bounds ${JSON.stringify(box)}`);
      assert.ok(box.width >= 200 && box.width <= 320 && box.height >= 90 && box.height <= 300, `${width} account dimensions ${JSON.stringify(box)}`);
      assert.equal(await popover.locator('.btn-logout').isVisible(), true);
      await page.keyboard.press('Escape');
      assert.equal(await popover.isVisible(), false);
      assert.equal(await account.evaluate(el => el === document.activeElement), true);
      const notify = page.getByRole('button', { name: /การแจ้งเตือน ยังไม่อ่าน/ });
      await notify.click();
      const dialog = page.locator('dialog.notification-dialog');
      await dialog.waitFor({ state: 'visible' });
      const rect = await dialog.boundingBox();
      assert.ok(rect && Math.abs(rect.x + rect.width / 2 - width / 2) <= 2 && Math.abs(rect.y + rect.height / 2 - 400) <= 2, `${width} notification centered ${JSON.stringify(rect)}`);
      const backdrop = await dialog.evaluate(el => getComputedStyle(el, '::backdrop').backgroundColor);
      assert.notEqual(backdrop, 'rgba(0, 0, 0, 0)');
      assert.equal(await dialog.evaluate(el => el.contains(document.activeElement)), true);
      await page.keyboard.press('Escape');
      await dialog.waitFor({ state: 'hidden' });
      assert.equal(await notify.evaluate(el => el === document.activeElement), true);
      await page.close();
    }
  } finally { await browser.close(); }
});
