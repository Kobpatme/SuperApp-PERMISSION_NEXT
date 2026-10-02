import { chromium } from 'playwright';
import fs from 'node:fs/promises';
const phase=process.argv[2]||'after';
const browser=await chromium.launch();
const errors=[];
try {
  for (const theme of ['light','dark']) for (const width of [1440,1024,390]) {
    const context=await browser.newContext({viewport:{width,height:900},colorScheme:theme});
    await context.addInitScript(t=>localStorage.setItem('permission-next-workspace-theme',t),theme);
    const page=await context.newPage();
    page.on('pageerror',error=>errors.push({theme,width,error:error.name}));
    await page.goto('http://localhost:3100/login');
    if (phase !== 'before') await page.screenshot({path:`docs/quality/ux-login-evidence/${phase}-login-${theme}-${width}.png`,fullPage:true});
    await page.locator('input[name=email]').fill('temporary@example.test');
    await page.locator('input[name=password]').fill('FixturePassword123!');
    await page.locator('button[type=submit],button.auth-submit-button').click();
    await page.waitForURL('**/change-password');
    await page.screenshot({path:`docs/quality/ux-login-evidence/${phase}-change-password-${theme}-${width}.png`,fullPage:true});
    await context.clearCookies();
    await page.goto('http://localhost:3100/login');
    await page.locator('input[name=email]').fill('admin@example.test'); await page.locator('input[name=password]').fill('FixturePassword123!');
    await page.locator('button[type=submit],button.auth-submit-button').click(); await page.waitForURL('http://localhost:3100/');
    for (const [name,route] of [['dashboard','/'],['work','/work'],['buildings','/buildings'],['guarantees','/guarantees'],['admin','/admin'],['404','/missing-ux-fixture']]) {
      await page.goto(`http://localhost:3100${route}`); await page.screenshot({path:`docs/quality/ux-login-evidence/${phase}-${name}-${theme}-${width}.png`,fullPage:true});
    }
    await context.close();
  }
  await fs.writeFile(`docs/quality/ux-login-evidence/${phase}-screenshot-errors.json`,JSON.stringify(errors,null,2));
  console.log(`Screenshot matrix ${phase} captured; ${errors.length} page errors`);
} finally { await browser.close(); }
