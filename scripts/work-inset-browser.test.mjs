import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';
import { chromium } from 'playwright';

const globals = ['src/styles/tokens.css', 'src/app/globals.css', 'src/styles/shell.css', 'src/styles/components.css', 'src/styles/ui.css', 'src/styles/notifications.css', 'src/styles/work.css', 'src/styles/auth.css', 'src/styles/motion.css'];
const pageCss = ['src/app/(platform)/buildings/permission-buildings.css', 'src/app/(platform)/buildings/buildings-presentation.css', 'src/app/(platform)/guarantees/deposit.css'];
const css = [...globals, ...pageCss].map(path => readFileSync(path, 'utf8')).join('\n');
const bundle = await build({ stdin: { contents: `import overview from './src/components/overview.module.css'; import composition from './src/features/work/screens/work-composition.module.css'; import mine from './src/features/work/screens/work-list.module.css'; window.classes={overview,composition,mine};`, resolveDir: process.cwd(), loader: 'js' }, bundle: true, write: false, outdir: 'out' });
const moduleCss = bundle.outputFiles.find(f => f.path.endsWith('.css')).text;
const moduleJs = bundle.outputFiles.find(f => f.path.endsWith('.js')).text;

test('content edges align with Building while Guarantee retains its own flush edge', async () => {
  const browser = await chromium.launch({headless:true});
  const failures = [];
  try {
    for (const [width, collapsed] of [[1920,false],[1920,true],[1440,false],[1440,true],[390,false],[320,false]]) {
      const page = await browser.newPage({viewport:{width,height:900}, reducedMotion:'reduce'});
      await page.setContent(`<style>${css}\n${moduleCss}</style><div class="workspace-shell ${collapsed ? 'sidebar-collapsed' : ''}"><aside class="workspace-sidebar"></aside><main class="main"></main></div>`);
      await page.addScriptTag({content:moduleJs});
      const result = await page.evaluate(() => {
        const {overview, composition, mine} = window.classes;
        const main = document.querySelector('main');
        const header = '<header class="page-heading"><div class="page-heading-row"><div class="page-heading-content"><h1>Heading</h1></div></div></header>';
        const fixtures = {
          building: `<section class="permission-workspace" data-ui-screen="buildings"><div class="permission-overview-toolbar">${header}</div><div class="permission-overview-summary"><div>Summary</div></div></section>`,
          guarantee: `<div class="deposit-workspace legacy-deposit-workspace"><header class="deposit-head legacy-deposit-head">${header}</header><section class="legacy-table-card">List</section></div>`,
          // /: OverviewMessages is a sibling before DashboardOverview, not its child.
          overview: `<div class="${overview.messages}"><aside class="${overview.announcement}" role="note">ประกาศ</aside><details class="${overview.systemLinks}" open><summary>ลิงก์ระบบ <span>· 1</span></summary><ul><li><strong><a href="#">ระบบ</a></strong><p>รายละเอียด</p></li></ul></details></div><div class="work-native overview-screen ${overview.screen}" data-ui-screen="overview">${header}<div class="overview-metric-heading">Summary</div><div class="queue-section">List</div></div>`,
          // /work/{assign,kpi,people,reports,team,tracker,mine}: status is a sibling.
          // /work dashboard has its own 500-item status inside WorkScreenShell.
          work: `<div class="${composition.workspace} work-native work-rollout" data-ui-screen data-work-appearance="workspace">${header}<p role="status" data-nested-limit>แสดง 500 งานล่าสุดของคุณ</p><section class="work-panel">Content<p role="status" data-inner-status>ข้อความภายใน</p></section></div><p role="status" data-limit>แสดง 500 รายการล่าสุด กรุณาใช้ตัวกรองเพื่อดูช่วงที่ต้องการ</p>`,
          mine: `<div class="${mine.workspace} ${composition.workspace} work-native work-rollout" data-ui-screen data-work-appearance="workspace" data-work-mine-prototype>${header}<section class="${mine.filters}">Filters</section><div class="${mine.scroll}"><table class="${mine.table}"><tbody><tr><td>Task</td></tr></tbody></table></div></div><p role="status" data-limit>แสดง 500 รายการล่าสุด กรุณาใช้ตัวกรองเพื่อดูช่วงที่ต้องการ</p>`
        };
        const measurements = {};
        for (const [name, html] of Object.entries(fixtures)) {
          main.innerHTML = html;
          const m = main.getBoundingClientRect();
          const h = main.querySelector(name === 'guarantee' ? '.deposit-workspace' : '.page-heading').getBoundingClientRect();
          const edges = (selector, content = false) => { const r = main.querySelector(selector).getBoundingClientRect(); const s = getComputedStyle(main.querySelector(selector)); return {left:r.left-m.left+(content ? parseFloat(s.paddingLeft) : 0), right:m.right-r.right+(content ? parseFloat(s.paddingRight) : 0)}; };
          measurements[name] = {left:h.left-m.left, right:m.right-h.right, mainWidth:m.width, overflow:document.documentElement.scrollWidth-innerWidth};
          if (name === 'overview') { measurements.announcement = edges(`.${overview.announcement}`); measurements.links = edges(`.${overview.systemLinks}`); }
          if (name === 'work' || name === 'mine') measurements[`${name}Limit`] = edges('[data-limit]', true);
          if (name === 'work') { measurements.nestedLimit = edges('[data-nested-limit]', true); const s = getComputedStyle(main.querySelector('[data-inner-status]')); measurements.innerPadding = {left:parseFloat(s.paddingLeft), right:parseFloat(s.paddingRight)}; }
        }
        return measurements;
      });
      console.log(JSON.stringify({width,collapsed,...result}));
      for (const name of ['overview','work','mine','announcement','links','workLimit','mineLimit','nestedLimit']) {
        for (const edge of ['left','right']) if (Math.abs(result[name][edge]-result.building[edge]) > .1) failures.push(`${width} collapsed=${collapsed} ${name} ${edge}: ${result[name][edge]} != ${result.building[edge]}`);
      }
      // The nested status belongs to a padded panel and must not receive the sibling inset.
      for (const edge of ['left','right']) if (result.innerPadding[edge] !== 0) failures.push(`${width} nested status ${edge} received extra padding`);
      // Guarantee intentionally stays at 20px desktop / 16px mobile, versus 40px / 28px for Building.
      const expectedDifference = width <= 720 ? 12 : 20;
      for (const edge of ['left','right']) if (Math.abs(result.building[edge]-result.guarantee[edge]-expectedDifference) > .1) failures.push(`${width} reference difference ${edge}`);
      for (const [name, m] of Object.entries(result)) if (m.overflow > 0) failures.push(`${width} ${name} overflow ${m.overflow}`);
      await page.close();
    }
    assert.deepEqual(failures, []);
  } finally { await browser.close(); }
});
