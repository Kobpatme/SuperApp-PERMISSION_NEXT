import type { Page } from "@playwright/test";
// Assess the rendered state after local font swapping and finite entry motion.
// Infinite pending/skeleton indicators remain visible and are still assessed.
export async function settlePresentation(page: Page) {
  await page.locator("h1").first().waitFor({state:"visible"});
  await page.evaluate(async()=>{
    await document.fonts.ready;
    await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
    await Promise.all(document.getAnimations().filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>undefined)));
  });
}
