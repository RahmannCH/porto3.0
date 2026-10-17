import { test } from '@playwright/test';
const baseURL = 'http://127.0.0.1:48123';
test('capture upper lanyard ribbon with shark pin', async ({ page }) => {
  // This capture runs last, after the suite has already held the static server
  // open for minutes. Under that load the load event has occasionally missed the
  // default 30s budget and timed out the navigation with nothing actually
  // broken. Tripling the budget absorbs the queueing; a page that genuinely
  // never finishes loading still fails, just later.
  test.slow();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(baseURL);
  await page.waitForTimeout(600);
  
  const anchor = await page.locator('.id-card-anchor').boundingBox();
  await page.screenshot({ path: 'test-results/shark-pin-ribbon.png', clip: { x: anchor.x, y: anchor.y - 180, width: anchor.width, height: 260 } });
});
