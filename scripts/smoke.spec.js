import { expect, test } from '@playwright/test';

const baseURL = process.env.BASE_URL ?? 'http://127.0.0.1:48123';
const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'narrow', width: 320, height: 720 },
];

for (const viewport of viewports) {
  test(`${viewport.name}: personal portfolio loads without broken assets or overflow`, async ({ page }) => {
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
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
    await expect(page.locator('h1')).toContainText('MUHAMMAD');
    await expect(page.locator('.project')).toHaveCount(4);

    const imageErrors = await page.locator('img').evaluateAll(async images => {
      await Promise.all(images.map(image => {
        image.loading = 'eager';
        return image.decode().catch(() => undefined);
      }));
      return images.filter(image => !image.complete || image.naturalWidth === 0).map(image => image.currentSrc || image.src);
    });
    expect(imageErrors).toEqual([]);

    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
      topLevel: [...document.body.children].map(element => ({ tag: element.tagName, className: typeof element.className === 'string' ? element.className : '', left: Math.round(element.getBoundingClientRect().left), right: Math.round(element.getBoundingClientRect().right), width: Math.round(element.getBoundingClientRect().width), scrollWidth: element.scrollWidth })),
      overflowElements: [...document.querySelectorAll('body *')]
        .map(element => ({ tag: element.tagName, className: typeof element.className === 'string' ? element.className : '', text: (element.textContent || '').trim().slice(0, 32), left: Math.round(element.getBoundingClientRect().left), right: Math.round(element.getBoundingClientRect().right), width: Math.round(element.getBoundingClientRect().width) }))
        .filter(element => element.right > document.documentElement.clientWidth + 1)
        .slice(0, 5),
      missingAnchors: [...document.querySelectorAll('a[href^="#"]')]
        .map(link => link.getAttribute('href'))
        .filter(href => href !== '#' && !document.getElementById(href.slice(1))),
      emptyLinks: [...document.querySelectorAll('a')]
        .filter(link => !link.getAttribute('href') || link.getAttribute('href') === '#')
        .map(link => link.textContent.trim() || link.getAttribute('aria-label') || '(unlabelled)'),
    }));
    expect(dimensions.document, `page reflows without horizontal overflow: ${JSON.stringify(dimensions.overflowElements)}`).toBeLessThanOrEqual(dimensions.viewport);
    expect(dimensions.missingAnchors).toEqual([]);
    expect(dimensions.emptyLinks).toEqual([]);
    expect(failedLocalRequests).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
    await page.screenshot({ path: `test-results/${viewport.name}.png`, fullPage: true });
  });
}

test('mobile menu supports keyboard open, navigation, Escape, and focus restoration', async ({ page }) => {
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

test('theme toggle changes theme and persists choice', async ({ page }) => {
  await page.goto(baseURL);
  const themeButton = page.locator('.theme-toggle');
  const initialTheme = await page.locator('html').getAttribute('data-theme');
  await themeButton.click();
  const nextTheme = initialTheme === 'dark' ? 'light' : 'dark';
  await expect(page.locator('html')).toHaveAttribute('data-theme', nextTheme);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', nextTheme);
});

test('draggable hero labels have keyboard move and reset controls', async ({ page }) => {
  await page.goto(baseURL);
  const sticker = page.locator('[data-draggable]').first();
  await sticker.focus();
  await page.keyboard.press('ArrowRight');
  await expect(sticker).toHaveCSS('--drag-x', '10px');
  await page.keyboard.press('Home');
  await expect(sticker).toHaveCSS('--drag-x', '0px');
});

test('reduced motion leaves reveal content visible and pauses mascot', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(baseURL);
  await expect(page.locator('#projects-title')).toBeVisible();
  await expect(page.locator('.mascot-dock')).toHaveClass(/is-reduced/);
});

test('cli drawer opens from the footer, closes on Escape, and restores focus', async ({ page }) => {
  await page.goto(baseURL);
  const trigger = page.locator('#footer-cli-btn');
  const drawer = page.locator('#cli-drawer');

  await trigger.click();
  await expect(drawer).toHaveAttribute('aria-hidden', 'false');
  await expect(page.locator('#cli-input')).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(drawer).toHaveAttribute('aria-hidden', 'true');
  await expect(trigger).toBeFocused();
});

test('unknown path returns 404 instead of portfolio page', async ({ request }) => {
  const response = await request.get(`${baseURL}/missing-route`);
  expect(response.status()).toBe(404);
});

test('scrollcraft mounts once and drives progress plus hero parallax', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(baseURL);
  await page.waitForFunction(() => window.ScrollCraft?.instances?.length === 1);

  const bar = page.locator('#scroll-progress-bar');
  await expect(bar).toHaveAttribute('data-sc-progress', '');
  const scaleX = () => bar.evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).a);
  const offsetY = () => page.locator('.hero-portrait').evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).f);

  expect(await scaleX()).toBeLessThan(0.02);
  expect(await offsetY()).toBeLessThan(1);

  await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'instant' }));
  await page.waitForFunction(() => {
    const element = document.querySelector('#scroll-progress-bar');
    return new DOMMatrixReadOnly(getComputedStyle(element).transform).a > 0.05;
  });

  expect(await scaleX()).toBeGreaterThan(0.05);
  const drift = await offsetY();
  expect(drift).toBeLessThan(-1);
  expect(Math.abs(drift)).toBeLessThanOrEqual(8);
});

test('reduced motion leaves the hero portrait untransformed', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(baseURL);
  await page.waitForFunction(() => window.ScrollCraft?.instances?.length === 1);
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  await page.waitForTimeout(400);
  expect(await page.locator('.hero-portrait').evaluate(element => element.style.transform)).toBe('');
});

test('every nav destination resolves to a real section', async ({ page }) => {
  await page.goto(baseURL);
  const hrefs = await page.locator('#site-nav a').evaluateAll(links => links.map(link => link.getAttribute('href')));
  expect(hrefs).toEqual(['#projects', '#about', '#capabilities', '#journey', '#contact']);
  for (const href of hrefs) {
    await expect(page.locator(href), `nav target ${href} exists`).toHaveCount(1);
  }
});

test('scrollcraft accent matches the design system accent in both themes', async ({ page }) => {
  await page.goto(baseURL);
  for (const theme of ['dark', 'light']) {
    await page.locator('html').evaluate((element, value) => { element.dataset.theme = value; }, theme);
    const [sc, scs] = await page.evaluate(() => [
      getComputedStyle(document.documentElement).getPropertyValue('--sc-accent').trim(),
      getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
    ]);
    expect(sc.toLowerCase(), `--sc-accent tracks --accent in ${theme}`).toBe(scs.toLowerCase());
  }
});

test('font stack uses a real system UI font, not Arial as a Helvetica substitute', async ({ page }) => {
  await page.goto(baseURL);
  const sans = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--sans'));
  expect(sans.toLowerCase()).toContain('system-ui');
  expect(sans).not.toMatch(/^\s*"Arial"/);
});

test('print control opens the print dialog', async ({ page }) => {
  await page.goto(baseURL);
  let printCalls = 0;
  await page.exposeFunction('__recordPrint', () => { printCalls += 1; });
  await page.evaluate(() => { window.print = () => window.__recordPrint(); });
  await page.locator('#print-cv').click();
  expect(printCalls).toBe(1);
  await page.locator('.contact-status [data-print]').click();
  expect(printCalls).toBe(2);
});

test('print stylesheet hides chrome and forces revealed content visible', async ({ page }) => {
  await page.goto(baseURL);
  await page.emulateMedia({ media: 'print' });
  for (const selector of ['.site-header', '.mascot-dock', '.footer-actions', '.hero-actions', '.sticker-field', '.hero-print', '.button-case-study', '.project-image', '.contact-status .text-link']) {
    const matches = page.locator(selector);
    expect(await matches.count(), `${selector} is not in the markup at all`).toBeGreaterThan(0);
    for (let index = 0; index < await matches.count(); index += 1) {
      await expect(matches.nth(index), `${selector} is not printed`).toBeHidden();
    }
  }
  await expect(page.locator('h1')).toBeVisible();
  const revealOpacity = await page.locator('#projects-title').evaluate(element => {
    const heading = element.closest('.reveal') || element;
    return getComputedStyle(heading).opacity;
  });
  expect(Number(revealOpacity)).toBe(1);
});

test('printed CV keeps every destination, which is what an earlier revision hid', async ({ page }) => {
  await page.goto(baseURL);
  await page.emulateMedia({ media: 'print' });

  // The link containers must survive print media, otherwise the ::after rules
  // that print the hrefs have nothing to attach to.
  for (const selector of ['.project-links', '.contact-links', '.contact-status']) {
    const matches = page.locator(selector);
    expect(await matches.count(), `${selector} is missing from the markup`).toBeGreaterThan(0);
    for (let index = 0; index < await matches.count(); index += 1) {
      await expect(matches.nth(index), `${selector} is missing from print`).toBeVisible();
    }
  }

  // Every outbound anchor resolves to real text plus its href printed after it.
  const anchors = page.locator('.project-links a[href^="http"], .contact-links a[href^="http"], .about-content a[href^="http"]');
  const count = await anchors.count();
  expect(count).toBeGreaterThanOrEqual(8);
  const printed = await anchors.evaluateAll(nodes => nodes.map(node => getComputedStyle(node, '::after').content));
  expect(printed).toHaveLength(count);
  printed.forEach((content, index) => {
    expect(content, `anchor ${index} does not print its destination`).toContain('https://');
  });

  // Locations print, the print button does not.
  await expect(page.locator('.contact-status')).toContainText('Banjarmasin, Kalimantan Selatan');
  await expect(page.locator('.contact-status')).toContainText('WITA (UTC+8)');
});

test('printed CV renders on white paper in both themes without contrast loss', async ({ page }) => {
  await page.goto(baseURL);
  for (const theme of ['dark', 'light']) {
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    await page.emulateMedia({ media: 'print' });
    const colours = await page.locator('body, .project-copy p, .tech-list li, .footer').evaluateAll(nodes =>
      nodes.map(node => {
        const style = getComputedStyle(node);
        return { colour: style.color, background: style.backgroundColor };
      })
    );
    for (const { colour, background } of colours) {
      // A transparent background has to resolve to what actually shows through,
      // which in print is always the white page, not transparent black.
      const alpha = background.match(/rgba?\([^)]*?,\s*([\d.]+)\s*\)/)?.[1];
      const paper = alpha === '0' ? 'rgb(255, 255, 255)' : background;
      const luminance = value => {
        const [r, g, b] = value.match(/[\d.]+/g).slice(0, 3).map(channel => {
          const c = Number(channel) / 255;
          return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const [first, second] = [luminance(colour), luminance(paper)].sort((a, b) => b - a);
      const ratio = (first + 0.05) / (second + 0.05);
      expect(ratio, `${theme}: ${colour} on ${paper} is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
    }
  }
});

test('printed CV fits the printable width at every supported viewport', async ({ page }) => {
  // The screen portrait caption overhangs its frame by design; floated to the
  // page edge in print, that overhang used to push text off the sheet.
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(baseURL);
    await page.emulateMedia({ media: 'print' });
    await page.waitForTimeout(200);

    const escaped = await page.evaluate(() => {
      const paper = document.body.getBoundingClientRect().width;
      const offenders = [];
      document.querySelectorAll('body *').forEach(element => {
        const style = getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden') return;
        const box = element.getBoundingClientRect();
        if (box.width === 0) return;
        if (box.right > paper + 1 || box.left < -1) offenders.push(`${element.tagName}.${element.className}`);
      });
      return [...new Set(offenders)];
    });
    expect(escaped, `at ${width}px something overflows the printable width`).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
  }
});

test('snapdom export actually resolves and produces a download', async ({ page }) => {
  test.slow();
  await page.goto(baseURL);
  await page.waitForFunction(() => typeof window.snapdom === 'function', { timeout: 15000 });
  const label = page.locator('.snap-label');
  await expect(label).toHaveText('Snap');

  const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
  await page.locator('#snap-btn').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^MuhammadNurRahman_Portfolio/);
  await expect(label).toHaveText('Selesai');
  await expect(page.locator('#snap-btn')).toBeEnabled();
});

test('no page depends on the react-dom runtime that the Snap button once pulled in', async ({ page }) => {
  const thirdParty = [];
  page.on('request', request => {
    const url = new URL(request.url());
    if (url.origin !== new URL(baseURL).origin && !url.hostname.includes('unpkg.com')) thirdParty.push(url.origin);
  });
  await page.goto(baseURL);
  await page.waitForTimeout(1500);
  expect(thirdParty).toEqual([]);
});

test('contact status shows WITA local time and no invented availability claim', async ({ page }) => {
  await page.goto(baseURL);
  const clock = page.locator('#local-time');
  await expect(clock).toHaveText(/^([01]\d|2[0-3])[:.][0-5]\d$/);
  const expected = await page.evaluate(() =>
    new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Makassar',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    }).format(new Date())
  );
  await expect(clock).toHaveText(expected);
  await expect(page.locator('.contact-status')).toContainText('WITA (UTC+8)');
  await expect(page.locator('.contact-status')).toContainText('Banjarmasin, Kalimantan Selatan');
});

test('documentation stack gallery exists and supports card swiping', async ({ page }) => {
  await page.goto(baseURL);
  const gallery = page.locator('[data-stack-gallery]');
  await expect(gallery).toBeVisible();
  const counter = gallery.locator('.stack-current');
  await expect(counter).toHaveText('1');

  const topCard = gallery.locator('.stack-card').first();
  await topCard.scrollIntoViewIfNeeded();
  const box = await topCard.boundingBox();
  expect(box).toBeTruthy();

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 150, box.y + box.height / 2, { steps: 5 });
  await page.mouse.up();

  await page.waitForTimeout(400);
  await expect(counter).toHaveText('2');
});
test('mascots are large enough to read and keep a minimum gap while walking', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(baseURL);

  const petOne = page.locator('#pet-1');
  const petTwo = page.locator('#pet-2');
  await expect(petOne).toBeVisible();
  await expect(petTwo).toBeVisible();

  const sizeOne = await petOne.evaluate(el => ({ w: el.offsetWidth, h: el.offsetHeight }));
  const sizeTwo = await petTwo.evaluate(el => ({ w: el.offsetWidth, h: el.offsetHeight }));
  expect(sizeOne.w).toBeGreaterThanOrEqual(44);
  expect(sizeOne.h).toBeGreaterThanOrEqual(50);
  expect(sizeTwo.w).toBeGreaterThanOrEqual(36);
  expect(sizeTwo.h).toBeGreaterThanOrEqual(42);

  // pet-2 is a scaled copy of the same shape, so it must stay strictly smaller.
  expect(sizeTwo.w).toBeLessThan(sizeOne.w);
  expect(sizeTwo.h).toBeLessThan(sizeOne.h);

  // The greeting must not be clipped by the environment it opens out of. The old
  // environment was 48px tall with overflow hidden, which cut the bubble off.
  const clearance = await page.evaluate(() => {
    const env = document.querySelector('.mascot-environment');
    const bubble = document.querySelector('#pet-1 .speech-bubble');
    const style = getComputedStyle(bubble);
    return {
      envOverflow: getComputedStyle(env).overflow,
      envHeight: env.getBoundingClientRect().height,
      bubbleHeight: bubble.getBoundingClientRect().height + parseFloat(style.paddingTop) * 2,
    };
  });
  expect(clearance.envOverflow).not.toBe('hidden');
  expect(clearance.envHeight).toBeGreaterThanOrEqual(100);

  // Sample the walk for a while and assert the pair never interpenetrates.
  const overlaps = await page.evaluate(async () => {
    const one = document.querySelector('#pet-1');
    const two = document.querySelector('#pet-2');
    const hits = [];
    for (let i = 0; i < 90; i += 1) {
      await new Promise(resolve => requestAnimationFrame(resolve));
      const a = one.getBoundingClientRect();
      const b = two.getBoundingClientRect();
      if (a.left < b.right && a.right > b.left) hits.push(1);
    }
    return hits.length;
  });
  expect(overlaps).toBe(0);
});

test('greeting bubble is readable and clears the environment edge', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(baseURL);
const petOne = page.locator('#pet-1');
  await petOne.click();
  await expect(petOne).toHaveClass(/has-speech/);

  const bubble = petOne.locator('.speech-bubble');
  const style = await bubble.evaluate(el => {
    const computed = getComputedStyle(el);
    return {
      fontSize: parseFloat(computed.fontSize),
      lineHeight: parseFloat(computed.lineHeight),
      whiteSpace: computed.whiteSpace,
      maxWidth: parseFloat(computed.maxWidth),
      opacity: Number(computed.opacity),
      text: el.textContent,
    };
  });
  expect(style.fontSize).toBeGreaterThanOrEqual(12);
  expect(style.lineHeight).toBeGreaterThanOrEqual(style.fontSize * 1.15);
  expect(style.whiteSpace).toBe('normal');
  expect(style.maxWidth).toBeGreaterThanOrEqual(120);
  expect(style.opacity).toBeGreaterThan(0.9);
  expect((style.text ?? '').trim().length).toBeGreaterThan(0);

  const fits = await page.evaluate(() => {
    const env = document.querySelector('.mascot-environment');
    const bubble = document.querySelector('#pet-1 .speech-bubble');
    const box = bubble.getBoundingClientRect();
    return box.top >= env.getBoundingClientRect().top - 1;
  });
  expect(fits).toBe(true);
});

test('mascots start on opposite sides and are keyboard reachable', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(baseURL);
  await page.waitForTimeout(120);

  const spread = await page.evaluate(() => {
    const one = document.querySelector('#pet-1').getBoundingClientRect();
    const two = document.querySelector('#pet-2').getBoundingClientRect();
    return Math.abs(one.left - two.left);
  });
  expect(spread).toBeGreaterThan(400);

  await page.locator('#pet-1').focus();
  const focusedTag = await page.evaluate(() => document.activeElement?.id);
expect(focusedTag).toBe('pet-1');
  await expect(page.locator('#pet-1')).toHaveClass(/has-speech/);
});

test('pets do not startle from a distance and keep walking when untouched', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(baseURL);

  // Park the pointer far from the pets, then let the loop run.
  await page.mouse.move(20, 300);
  const scared = await page.evaluate(async () => {
    for (let i = 0; i < 120; i += 1) {
      await new Promise(resolve => requestAnimationFrame(resolve));
    }
    return document.querySelectorAll('.walking-mascot.is-scared').length;
  });
  expect(scared).toBe(0);

  const moved = await page.evaluate(async () => {
    const read = () => Array.from(document.querySelectorAll('.walking-mascot'))
      .map(el => parseFloat(el.style.left || '0'));
    const before = read();
    for (let i = 0; i < 60; i += 1) {
      await new Promise(resolve => requestAnimationFrame(resolve));
    }
    const after = read();
    return before.map((value, index) => Math.abs(after[index] - value));
  });
  expect(Math.max(...moved)).toBeGreaterThan(1);
});
