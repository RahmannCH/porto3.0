import { expect, test } from '@playwright/test';

const baseURL = process.env.BASE_URL ?? 'http://127.0.0.1:8123';
const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'narrow', width: 320, height: 720 },
];

for (const viewport of viewports) {
  test(`${viewport.name}: portfolio renders without broken assets or overflow`, async ({ page }) => {
    const pageErrors = [];
    const consoleErrors = [];
    const failedLocalRequests = [];
    const origin = new URL(baseURL).origin;
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('requestfailed', request => {
      if (new URL(request.url()).origin === origin) failedLocalRequests.push(request.url());
    });

    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(baseURL);
    await expect(page).toHaveTitle(/Muhammad Nur Rahman/i);
    await expect(page.locator('h1')).toContainText('MUHAMMAD');
    await expect(page.locator('.project')).toHaveCount(4);

    const result = await page.evaluate(async () => {
      const images = [...document.images];
      await Promise.all(images.map(image => {
        image.loading = 'eager';
        return image.decode().catch(() => undefined);
      }));
      return {
        viewport: document.documentElement.clientWidth,
        document: document.documentElement.scrollWidth,
        missingAnchors: [...document.querySelectorAll('a[href^="#"]')]
          .map(link => link.getAttribute('href'))
          .filter(href => href !== '#' && !document.getElementById(href.slice(1))),
        emptyLinks: [...document.querySelectorAll('a')]
          .filter(link => !link.getAttribute('href') || link.getAttribute('href') === '#')
          .map(link => link.textContent.trim() || link.getAttribute('aria-label') || '(unlabelled)'),
        brokenImages: images.filter(image => !image.complete || image.naturalWidth === 0).map(image => image.currentSrc || image.src),
      };
    });

    expect(result.document, 'page reflows without horizontal overflow').toBeLessThanOrEqual(result.viewport);
    expect(result.missingAnchors).toEqual([]);
    expect(result.emptyLinks).toEqual([]);
    expect(result.brokenImages).toEqual([]);
    expect(failedLocalRequests).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
    await page.screenshot({ path: `test-results/${viewport.name}.png`, fullPage: true });
  });
}

test('mobile menu supports keyboard navigation, Escape, and focus restoration', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(baseURL);
  const trigger = page.locator('.menu-toggle');
  const navigation = page.getByRole('navigation', { name: 'Navigasi utama' });
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(navigation).toBeVisible();
  await navigation.getByRole('link', { name: 'Proyek' }).click();
  await expect(page).toHaveURL(/#projects$/);
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await trigger.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Escape');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(trigger).toBeFocused();
});

test('theme choice persists between page visits', async ({ page }) => {
  await page.goto(baseURL);
  const button = page.locator('.theme-toggle');
  const currentTheme = await page.locator('html').getAttribute('data-theme');
  const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
  await button.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', nextTheme);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', nextTheme);
});

test('drag labels support keyboard movement and reset', async ({ page }) => {
  await page.goto(baseURL);
  const sticker = page.locator('[data-draggable]').first();
  await sticker.focus();
  await page.keyboard.press('ArrowRight');
  await expect(sticker).toHaveCSS('--drag-x', '10px');
  await page.keyboard.press('Home');
  await expect(sticker).toHaveCSS('--drag-x', '0px');
});

test('reduced motion keeps content visible and mascot paused', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(baseURL);
  await expect(page.locator('#projects-title')).toBeVisible();
  await expect(page.locator('.mascot-dock')).toHaveClass(/is-reduced/);
});

test('unknown paths return 404', async ({ request }) => {
  const response = await request.get(`${baseURL}/missing-route`);
  expect(response.status()).toBe(404);
});
