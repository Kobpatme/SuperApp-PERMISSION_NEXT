const { chromium } = require('playwright');
const { default: AxeBuilder } = require('@axe-core/playwright');

async function runA11yAudit() {

  const testEmail = process.env.TEST_EMAIL?.trim();
  const testPassword = process.env.TEST_PASSWORD?.trim();

  if (!testEmail || !testPassword) {
    throw new Error('TEST_EMAIL and TEST_PASSWORD must be provided through protected environment variables.');
  }

  const browser = await chromium.launch({

    headless: true,
    channel: 'chromium'
  });
  const context = await browser.newContext();
  const page = await context.newPage();




  try {
    console.log('Logging in...');
    await page.goto('http://127.0.0.1:3000/login');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/', { timeout: 15000 });
    console.log('Logged in, navigating to duct-rental...');
    await page.goto('http://127.0.0.1:3000/duct-rental');
    await page.waitForLoadState('networkidle');
    console.log('Navigated to duct-rental successfully');


    const pages = [
      { url: '/duct-rental', name: 'Request List' },
      { url: '/duct-rental/new', name: 'Request New' },
      { url: '/duct-rental/renewal', name: 'Renewal List' },
      { url: '/duct-rental/tracking', name: 'Tracking' },
      { url: '/duct-rental/tasks', name: 'Tasks/Signing' },
      { url: '/duct-rental/cancellation', name: 'Cancellation List' },
      { url: '/duct-rental/cancellation/new', name: 'Cancellation New' },
      { url: '/duct-rental/settings', name: 'Settings' },
    ];


    let totalViolations = 0;
    const results = [];


    for (const pageInfo of pages) {
      console.log(`\nTesting: ${pageInfo.name} (${pageInfo.url})`);
      await page.goto(`http://127.0.0.1:3000${pageInfo.url}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);


      try {
        const axeResults = await new AxeBuilder({ page }).analyze();
        const violations = axeResults.violations;


        console.log(`  Violations: ${violations.length}`);
        if (violations.length > 0) {
          violations.forEach(v => {
            console.log(`  - [${v.impact}] ${v.id}: ${v.description}`);
            v.nodes.forEach(n => {
              console.log(`    Element: ${n.target.join(' > ')}`);
            });
            totalViolations += violations.length;
          });
        } else {
          console.log('  ✅ No violations');
        }


        results.push({ page: pageInfo.name, url: pageInfo.url, violations });
      } catch (e) {
        console.log(`  Error testing ${pageInfo.name}: ${e.message}`);
        results.push({ page: pageInfo.name, url: pageInfo.url, error: e.message });
      }
    }


    console.log(`\n=== SUMMARY ===`);
    console.log(`Total pages tested: ${results.length}`);
    console.log(`Total violations: ${totalViolations}`);


    const pagesWithViolations = results.filter(r => r.violations && r.violations.length > 0);
    if (pagesWithViolations.length > 0) {
      console.log(`\nPages with violations:`);
      pagesWithViolations.forEach(r => {
        console.log(`  - ${r.page}: ${r.violations.length} violations`);
      });
    } else {
      console.log('\n✅ All pages pass accessibility audit!');
    }


    return { totalViolations, results };


  } catch (e) {
    console.error('Audit failed:', e);
    throw e;
  } finally {
    await browser.close();
  }
}

runA11yAudit()
  .then(() => process.exit(0))
  .catch(e => {
    console.error('Audit failed:', e);
    process.exit(1);
  });
