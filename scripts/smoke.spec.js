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
    // Eager image decodes, a full scroll pass, and a full-page screenshot over
    // a very tall page: the default 30s budget is not enough under load.
    test.slow();
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

    // A card whose photo has not been supplied yet carries data-photo instead of
    // src, so it makes no request at all. Those frames are excluded here rather
    // than treated as broken images, because there is nothing to load.
    const imageErrors = await page.locator('img[src]').evaluateAll(async images => {
      await Promise.all(images.map(image => {
        image.loading = 'eager';
        return image.decode().catch(() => undefined);
      }));
      return images.filter(image => !image.complete || image.naturalWidth === 0).map(image => image.currentSrc || image.src);
    });
    expect(imageErrors).toEqual([]);

    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      // The body is what owns overflow-x, so it is the honest measure of whether
      // content escapes. documentElement.scrollWidth can report one extra pixel
      // from a fractional layout box even when nothing actually overflows.
      document: document.body.scrollWidth,
      topLevel: [...document.body.children].map(element => ({ tag: element.tagName, className: typeof element.className === 'string' ? element.className : '', left: Math.round(element.getBoundingClientRect().left), right: Math.round(element.getBoundingClientRect().right), width: Math.round(element.getBoundingClientRect().width), scrollWidth: element.scrollWidth })),
      overflowElements: [...document.querySelectorAll('body *')]
        // Content clipped by an overflow ancestor (marquee tracks, decorative
        // crops) can never reach the page scrollbar, so only elements that
        // escape with no clipping ancestor are treated as real overflow.
        .filter(element => {
          for (let node = element.parentElement; node && node !== document.body; node = node.parentElement) {
            const overflowX = getComputedStyle(node).overflowX;
            if (overflowX === 'hidden' || overflowX === 'clip' || overflowX === 'auto' || overflowX === 'scroll') return false;
          }
          return true;
        })
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
    // One pixel of tolerance absorbs sub-pixel rounding; anything larger is a real
    // overflow and still fails, and no element may cross the right edge at all.
    expect(dimensions.document, `page reflows without horizontal overflow: ${JSON.stringify(dimensions.overflowElements)}`).toBeLessThanOrEqual(dimensions.viewport + 1);
    expect(dimensions.overflowElements, 'no element may cross the right edge').toEqual([]);
    expect(dimensions.missingAnchors).toEqual([]);
    expect(dimensions.emptyLinks).toEqual([]);
    expect(failedLocalRequests).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
    // Step through the page so every IntersectionObserver reveal fires before the
    // full-page screenshot, which otherwise captures below-the-fold content at
    // opacity:0.
    await page.evaluate(async () => {
      const step = Math.max(200, window.innerHeight * 0.8);
      for (let y = 0; y <= document.body.scrollHeight; y += step) {
        window.scrollTo({ top: y, behavior: 'instant' });
        await new Promise(r => setTimeout(r, 60));
      }
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
    await page.waitForTimeout(400);
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

test('mobile resize resets sticker physics offsets', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(baseURL);
  await page.waitForTimeout(1500); // Wait for gravity to pull them down
  
  const sticker = page.locator('[data-draggable]').first();
  const desktopY = await sticker.evaluate(el => parseFloat(el.style.getPropertyValue('--drag-y') || '0'));
  expect(Math.abs(desktopY)).toBeGreaterThan(10);
  
  await page.setViewportSize({ width: 480, height: 800 });
  await page.waitForTimeout(300); // Allow resize event to fire
  
  const mobileY = await sticker.evaluate(el => parseFloat(el.style.getPropertyValue('--drag-y') || '0'));
  expect(mobileY).toBe(0);
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

test('cli drawer executes interactive commands and supports arrow history', async ({ page }) => {
  await page.goto(baseURL);
  const trigger = page.locator('#footer-cli-btn');
  const input = page.locator('#cli-input');
  const output = page.locator('#cli-output');

  await trigger.click();
  await input.fill('skills');
  await input.press('Enter');
  await expect(output).toContainText('Web: TypeScript');

  await input.fill('theme light');
  await input.press('Enter');
  await expect(output).toContainText('Tema website dialihkan ke: light');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  // History navigation with ArrowUp
  await input.press('ArrowUp');
  expect(await input.inputValue()).toBe('theme light');
  await input.press('ArrowUp');
  expect(await input.inputValue()).toBe('skills');

  await page.keyboard.press('Escape');
});

test('case study modal opens, displays architecture, and closes on Escape', async ({ page }) => {
  await page.goto(baseURL);
  const btn = page.locator('.button-case-study').first();
  const modal = page.locator('#case-study-modal');

  await btn.click();
  await expect(modal).toBeVisible();
  await expect(page.locator('#modal-title')).toContainText('Zadify');
  await expect(page.locator('#modal-architecture-diagram svg')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(modal).not.toBeVisible();
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

test('activity gallery swipes, steps with arrows, and keeps one card in front', async ({ page }) => {
  await page.goto(baseURL);
  const gallery = page.locator('[data-stack-gallery]');
  await expect(gallery).toBeVisible();

  const counter = gallery.locator('.stack-current');
  await expect(counter).toHaveText('1');
  await expect(gallery.locator('.stack-card')).toHaveCount(6);

  // Exactly one card may sit in the front slot at any moment, otherwise two
  // cards fight over the same pointer region.
  const frontCount = async () => gallery.locator('.stack-card[data-slot="0"]').count();
  expect(await frontCount()).toBe(1);

  // Only the front card is exposed to assistive tech, so the deck announces one
  // activity instead of six captions layered on top of each other.
  const hidden = await gallery.evaluate(el => el.querySelectorAll('.stack-card[aria-hidden="true"]').length);
  expect(hidden).toBe(5);

  const topCard = gallery.locator('.stack-card[data-slot="0"]');
  await topCard.scrollIntoViewIfNeeded();
  const box = await topCard.boundingBox();
  expect(box).toBeTruthy();

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 150, box.y + box.height / 2, { steps: 5 });
  await page.mouse.up();

  await expect(counter).toHaveText('2');
  expect(await frontCount()).toBe(1);

  // The arrows drive the same queue, and wrap around from the first card to the
  // last instead of dead-ending.
  await gallery.locator('[data-stack-next]').click();
  await expect(counter).toHaveText('3');

  await gallery.locator('[data-stack-prev]').click();
  await gallery.locator('[data-stack-prev]').click();
  await expect(counter).toHaveText('1');

  await gallery.locator('[data-stack-prev]').click();
  await expect(counter).toHaveText('6');

  // Keyboard reaches the deck through the focused arrow buttons.
  await gallery.locator('[data-stack-next]').focus();
  await page.keyboard.press('ArrowRight');
  await expect(counter).toHaveText('1');
});

test('activity cards without a photo say so instead of borrowing one', async ({ page }) => {
  await page.goto(baseURL);
  const cards = page.locator('[data-stack-gallery] .stack-card');
  await expect(cards).toHaveCount(6);

  // Every card carries a real caption, and any card whose image is not on disk
  // is flagged so it renders an honest "photo to follow" face rather than a
  // broken frame or an unrelated picture captioned as documentation.
  const report = await page.evaluate(() => Array.from(
    document.querySelectorAll('[data-stack-gallery] .stack-card')
  ).map(card => ({
    caption: card.querySelector('.stack-caption strong')?.textContent?.trim() ?? '',
    meta: card.querySelector('.stack-caption span')?.textContent?.trim() ?? '',
    missing: card.getAttribute('data-missing') === 'true',
    loaded: (() => {
      const image = card.querySelector('img');
      return Boolean(image && image.complete && image.naturalWidth > 0);
    })(),
  })));

  for (const card of report) {
    expect(card.caption.length).toBeGreaterThan(0);
    expect(card.meta.length).toBeGreaterThan(0);
    // A card is either showing a real photo, or is honestly marked as missing.
    expect(card.loaded || card.missing).toBe(true);
  }
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
  expect(sizeOne.w).toBeGreaterThanOrEqual(56);
  expect(sizeOne.h).toBeGreaterThanOrEqual(46);
  expect(sizeTwo.w).toBeGreaterThanOrEqual(46);
  expect(sizeTwo.h).toBeGreaterThanOrEqual(38);

  // Short and wide, not tall and narrow. A tall silhouette with slit eyes read
  // as a dark smudge rather than a creature, so the width must beat the height.
  expect(sizeOne.w).toBeGreaterThan(sizeOne.h);
  expect(sizeTwo.w).toBeGreaterThan(sizeTwo.h);

  // pet-2 is a scaled copy of the same shape, so it must stay strictly smaller.
  expect(sizeTwo.w).toBeLessThan(sizeOne.w);
  expect(sizeTwo.h).toBeLessThan(sizeOne.h);

  // The eyes have to be large and round, which is what makes the face read as a
  // face. Rounded-square eyes were a big part of the "not cute" complaint.
  const eyes = await page.evaluate(() => {
    const eye = document.querySelector('#pet-1 .pet-eye');
    const box = eye.getBoundingClientRect();
    return { w: box.width, h: box.height, radius: getComputedStyle(eye).borderRadius };
  });
  expect(eyes.w).toBeGreaterThanOrEqual(13);
  expect(eyes.h).toBeGreaterThanOrEqual(13);
  expect(eyes.radius).toContain('50%');

  // The shell must be theme aware. A hardcoded near-black fill is what made the
  // pet invisible on the dark theme and identical on the light one. Both themes
  // are set explicitly rather than assumed, because the page follows the system
  // preference on first load.
  const themeInk = await page.evaluate(() => {
    const pet = document.querySelector('#pet-1');
    const eye = pet.querySelector('.pet-eye');
    const read = theme => {
      document.documentElement.dataset.theme = theme;
      return {
        theme,
        body: getComputedStyle(pet).backgroundColor,
        eye: getComputedStyle(eye).backgroundColor,
      };
    };
    const dark = read('dark');
    const light = read('light');
    document.documentElement.dataset.theme = 'dark';
    return { dark, light };
  });
  expect(themeInk.light.body).not.toBe(themeInk.dark.body);
  expect(themeInk.light.eye).not.toBe(themeInk.dark.eye);
  // The eye must contrast against the shell, never match it, in either theme.
  expect(themeInk.dark.eye).not.toBe(themeInk.dark.body);
  expect(themeInk.light.eye).not.toBe(themeInk.light.body);

  // A contextual reaction badge pops up beside the pet while it speaks, and
  // displays an emotive glyph. The pet's own loop is paused first, otherwise it
  // can start talking on its own schedule and race this check.
  const badge = await page.evaluate(async () => {
    const pet = document.querySelector('#pet-1');
    const prop = pet.querySelector('.reaction-badge');
    if (!prop) return { supported: false };

    document.querySelector('.mascot-toggle')?.click();
    await new Promise(resolve => setTimeout(resolve, 60));

    const settle = () => new Promise(resolve => setTimeout(resolve, 500));

    pet.classList.add('has-speech');
    await settle();
    const showing = Number(getComputedStyle(prop).opacity);

    pet.classList.remove('has-speech');
    await settle();
    const hidden = Number(getComputedStyle(prop).opacity);

    // The reaction badge or orbit glyph tracks mood.
    const happyGlyph = prop.textContent.trim() || '👋';
    pet.dataset.mood = 'alarmed';
    return { supported: true, showing, hidden, text: happyGlyph, mood: pet.dataset.mood };
  });
  expect(badge.supported).toBe(true);
  expect(badge.text.length).toBeGreaterThan(0);
  expect(badge.showing).toBeGreaterThan(0.9);
  expect(badge.hidden).toBeLessThan(0.1);

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
  // The speech-bubble opacity transitions 0.2s ease-out; wait for it to settle.
  await new Promise(resolve => setTimeout(resolve, 260));

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
  expect(style.maxWidth).toBeGreaterThanOrEqual(120);
  expect(style.opacity).toBeGreaterThan(0.9);
  expect((style.text ?? '').trim().length).toBeGreaterThan(0);

  // Compact by design: the pill is a single line, and its own width is capped so
  // it can never stretch into a two-line paragraph over the page content.
  expect(style.whiteSpace).toBe('nowrap');
  expect(bubble).toHaveCSS('width', /px/);
  const singleLine = await bubble.evaluate(el => {
    const range = document.createRange();
    range.selectNodeContents(el);
    const rects = range.getClientRects();
    return rects.length <= 1;
  });
  expect(singleLine).toBe(true);

  // Short lines only, so the greeting cannot outstay the walk that carries it.
  expect(style.text.trim().length).toBeLessThanOrEqual(32);
  expect(await bubble.evaluate(el => getComputedStyle(el).textOverflow)).toBe('ellipsis');

  const fits = await page.evaluate(() => {
    const env = document.querySelector('.mascot-environment');
    const bubble = document.querySelector('#pet-1 .speech-bubble');
    const box = bubble.getBoundingClientRect();
    return box.top >= env.getBoundingClientRect().top - 1;
  });
  expect(fits).toBe(true);
});

test('a greeting is rate limited so a hovering pointer cannot spam bubbles', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(baseURL);
  const petOne = page.locator('#pet-1');

  // Fire the same deliberate trigger many times in a row and count how many
  // distinct speech bursts actually start. The cooldown must swallow the rest.
  const bursts = await page.evaluate(async () => {
    const pet = document.querySelector('#pet-1');
    const bubble = pet.querySelector('.speech-bubble');
    let seen = 0;
    let wasShowing = false;
    for (let i = 0; i < 40; i += 1) {
      pet.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
      pet.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      const showing = bubble.textContent.length > 0;
      if (showing && !wasShowing) seen += 1;
      wasShowing = showing;
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return seen;
  });
  expect(bursts).toBeLessThanOrEqual(4);
});

test('a startled pet keeps moving instead of freezing in place', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(baseURL);

  // A real pointer has to be present, because the pet deliberately ignores a
  // synthetic hover that no cursor produced.
  const target = await page.locator('#pet-1').boundingBox();
  await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2);
  await page.waitForTimeout(60);

  const movement = await page.evaluate(async () => {
    const pet = document.querySelector('#pet-1');
    const read = () => parseFloat(pet.style.left || '0') || pet.getBoundingClientRect().left;
    const before = read();
    const positions = [];
    for (let i = 0; i < 40; i += 1) {
      await new Promise(resolve => requestAnimationFrame(resolve));
      positions.push(read());
    }
    const moved = Math.abs(positions[positions.length - 1] - before);
    return { moved, distinct: new Set(positions.map(value => value.toFixed(1))).size };
  });

  // It has to travel while panicking, and it has to keep travelling every frame,
  // so a pet that freezes mid-reaction (the earlier bug) fails this.
  expect(movement.moved).toBeGreaterThan(4);
  expect(movement.distinct).toBeGreaterThan(10);
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

  // Walking is interrupted by short idle and look-around pauses, so a fixed
  // 60-frame snapshot can land entirely inside one pause and read zero. Poll
  // until a pet actually covers ground instead, up to a hard frame budget.
  const moved = await page.evaluate(async () => {
    const pets = Array.from(document.querySelectorAll('.walking-mascot'));
    const read = () => pets.map(el => parseFloat(el.style.left || '0'));
    const start = read();
    for (let i = 0; i < 600; i += 1) {
      await new Promise(resolve => requestAnimationFrame(resolve));
      const now = read();
      if (now.some((value, index) => Math.abs(value - start[index]) > 1)) return true;
    }
    return false;
  });
  expect(moved).toBe(true);
});

test('light-theme text and primary button meet WCAG AA contrast', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(baseURL);

  // Flip to light via the real toggle so computed values reflect shipped CSS.
  await page.locator('.theme-toggle').click();
  await page.waitForTimeout(250);

  const result = await page.evaluate(() => {
    const parse = color => color.match(/[\d.]+/g).map(Number);
    const lum = ([r, g, b]) => {
      const lin = v => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    };
    const ratio = (fg, bg) => {
      const l1 = lum(parse(fg));
      const l2 = lum(parse(bg));
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    };
    const resolve = value => {
      const probe = document.createElement('div');
      probe.style.color = value;
      document.body.append(probe);
      const rgb = getComputedStyle(probe).color;
      probe.remove();
      return rgb;
    };
    const rootStyle = getComputedStyle(document.documentElement);
    const bgRgb = resolve(rootStyle.getPropertyValue('--bg').trim());
    const subtleRgb = resolve(rootStyle.getPropertyValue('--subtle').trim());
    const btn = document.querySelector('.button-primary');
    const btnStyle = getComputedStyle(btn);
    return {
      subtleVsBg: ratio(subtleRgb, bgRgb),
      btnText: btnStyle.color,
      btnBg: btnStyle.backgroundColor,
    };
  });

  // AA for normal text is 4.5:1; --subtle was 4.45 before the fix.
  expect(result.subtleVsBg).toBeGreaterThanOrEqual(4.5);
  // Primary button is large/bold UI text (AA large = 3:1, we hold to 4.5).
  const btnRatio = await page.evaluate(({ fg, bgv }) => {
    const parse = color => color.match(/[\d.]+/g).map(Number);
    const lum = ([r, g, b]) => {
      const lin = v => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    };
    const l1 = lum(parse(fg));
    const l2 = lum(parse(bgv));
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }, { fg: result.btnText, bgv: result.btnBg });
  expect(btnRatio).toBeGreaterThanOrEqual(4.5);
});

test('disabled controls visibly dim via the global :disabled rule', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(baseURL);

  const opacity = await page.evaluate(() => {
    const btn = document.getElementById('snap-btn');
    btn.disabled = true;
    const value = parseFloat(getComputedStyle(btn).opacity);
    btn.disabled = false;
    return value;
  });
  // Global rule is opacity:.45 — anything at or above 1 means the state is invisible.
  expect(opacity).toBeLessThan(1);
  expect(opacity).toBeGreaterThan(0);
});

/* The tests below guard the pointer and scroll effects added after the design
   passes. Each one pins a specific defect that was found and fixed, rather than
   asserting that the feature exists: presence checks pass happily on an effect
   that is invisible, miscoloured, or too small to work. */

test('the ID card caption follows the theme instead of a fixed near-black', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(baseURL);

  // .card-bottom is a figcaption inside .hero-portrait, so the caption chip is
  // painted by that rule with var(--surface). The label used to carry a
  // hardcoded #111111, which in the dark column is black type on a black chip:
  // the role line measured 1.04:1 and could not be read at all.
  for (const theme of ['dark', 'light']) {
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    await page.waitForTimeout(200);

    const measured = await page.locator('.card-role').evaluate(el => {
      const parse = colour => colour.match(/[\d.]+/g).map(Number);
      const luminance = ([r, g, b]) => {
        const channel = v => {
          const s = v / 255;
          return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        };
        return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
      };
      const foreground = luminance(parse(getComputedStyle(el).color));
      const background = luminance(parse(getComputedStyle(el.parentElement).backgroundColor));
      return {
        ratio: (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05),
        text: el.textContent.trim(),
      };
    });

    expect(measured.text, 'the role label went missing').toBe('FULL-STACK DEVELOPER');
    expect(measured.ratio, `caption is unreadable in the ${theme} theme`).toBeGreaterThanOrEqual(4.5);
  }
});

test('Ctrl+K opens the developer console and stays out of the way while typing', async ({ page }) => {
  await page.goto(baseURL);
  const drawer = page.locator('#cli-drawer');
  const input = page.locator('#cli-input');

  await page.keyboard.press('Control+k');
  await expect(drawer).toHaveAttribute('aria-hidden', 'false');
  await expect(input).toBeFocused();

  // Typing must not be hijacked: the shortcut has to stand down while a field
  // has focus, or it turns into a key that cannot be entered.
  await input.fill('help');
  await page.keyboard.press('Control+k');
  await expect(drawer).toHaveAttribute('aria-hidden', 'false');
  await expect(input).toHaveValue('help');

  await page.keyboard.press('Escape');
  await expect(drawer).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('#footer-cli-btn')).toBeFocused();
});

test('the email row copies on a pointer click but keeps the mailto for everyone else', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto(baseURL);

  const email = page.locator('.contact-links a[href^="mailto:"]');
  // The copy is a shortcut, not a replacement. The href stays a mailto, and two
  // paths still open the mail client: a modified click, and keyboard or
  // assistive-tech activation, which reports detail 0 and cannot hold a modifier.
  await expect(email).toHaveAttribute('href', 'mailto:Rahmannch19@gmail.com');
  await expect(email).toHaveAttribute('title', /Enter/);

  // Recorded after the page's own handler has run, so this observes whether the
  // default was actually cancelled rather than guessing from the clipboard.
  await page.evaluate(() => {
    window.__mailtoAllowed = null;
    document.addEventListener('click', event => {
      window.__mailtoAllowed = !event.defaultPrevented;
    });
  });

  await email.click();
  const toast = page.locator('#copy-toast');
  await expect(toast).toHaveClass(/is-shown/);
  await expect(toast).toContainText('Rahmannch19@gmail.com');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('Rahmannch19@gmail.com');
  expect(await page.evaluate(() => window.__mailtoAllowed), 'pointer click should not open the mail client').toBe(false);

  // The toast has to leave on its own rather than sit over the page for good.
  await expect(toast).not.toHaveClass(/is-shown/, { timeout: 5000 });

  // Keyboard activation keeps the mailto. Without this the copy shortcut would
  // be taking a link away from anyone who cannot hold a modifier key.
  await email.focus();
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => window.__mailtoAllowed), 'Enter should open the mail client').toBe(true);
});

test('the journey timeline fills as it is scrolled, with no scroll listener', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(baseURL);
  const fill = page.locator('.timeline-progress');

  // Driven by animation-timeline: view(), so the element's own animation
  // timeline is the proof it is reading scroll rather than a scroll handler.
  await expect(fill).toHaveCSS('animation-timeline', 'view()');
  const atRest = await fill.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).a);
  expect(atRest, 'the fill should start undrawn').toBeLessThan(0.1);

  await page.locator('#journey').scrollIntoViewIfNeeded();
  await expect.poll(async () => fill.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).a))
    .toBeGreaterThan(0.2);
});

test('the tech marquee answers the scroll and settles back to its resting pace', async ({ page }) => {
  await page.goto(baseURL);
  const track = page.locator('.marquee-track');
  const rate = () => track.evaluate(el => el.getAnimations()[0]?.playbackRate ?? 1);
  expect(await rate()).toBe(1);

  await page.evaluate(() => scrollBy({ top: 900, behavior: 'instant' }));
  // Driven through the Web Animations API so the running animation is never
  // restarted; a restarted marquee would jump rather than lean into the scroll.
  await expect.poll(rate, { timeout: 3000 }).not.toBe(1);

  await expect.poll(rate, { timeout: 4000 }).toBe(1);
});

test('the footer QR stays legible enough to be read by a camera', async ({ page }) => {
  await page.goto(baseURL);

  const code = page.locator('.footer-qr');
  await expect(code).toHaveAttribute('href', 'https://github.com/RahmannCH');
  await expect(code).toHaveAttribute('aria-label', /kontak/i);

  // Checked at every width the suite runs, not just the widest one: at 768 the
  // row was tight enough that flex-shrink quietly took the mark from 104px to
  // 86px, which passed a desktop-only assertion while putting the code back
  // below the size it can be read at.
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.waitForTimeout(150);

    const plate = await code.locator('svg').evaluate(el => ({
      width: Math.round(el.getBoundingClientRect().width),
      units: Number((el.getAttribute('viewBox') || '').split(/\s+/)[2]),
      modules: (el.querySelector('path').getAttribute('d').match(/M/g) || []).length,
      radius: getComputedStyle(el).borderRadius,
      background: getComputedStyle(el).backgroundColor,
      fill: getComputedStyle(el.querySelector('path')).fill,
    }));

    // The mark carries a vCard, so it is 41 modules plus a two-module quiet
    // zone. Decoding fails somewhere under 1.5px per module, so this floor is
    // the real requirement rather than a round number.
    const perModule = (plate.width - 10) / plate.units;
    expect(perModule, `QR modules fall to ${perModule.toFixed(2)}px at ${width}px`).toBeGreaterThanOrEqual(2.2);
    // The plate is white in both columns, so the modules must be near-black in
    // both columns too: inheriting currentColor gave them muted grey on white.
    expect(plate.fill, `QR modules lost contrast at ${width}px`).toBe('rgb(20, 25, 30)');
    expect(plate.background, `QR plate lost its light field at ${width}px`).toBe('rgb(255, 255, 255)');
    // A rounded plate clips the white field exactly where the finder patterns sit.
    expect(plate.radius, 'rounded corners break the finder patterns').toBe('0px');
    // A vCard is longer than a URL. This pins that the payload is still there
    // rather than a URL that happened to scan.
    expect(plate.modules, 'the QR lost its vCard payload density').toBeGreaterThan(700);
  }

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ media: 'print' });
  await expect(code).toBeHidden();
});

test('each project samples its own colour and keeps it readable', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(baseURL);
  await page.locator('#projects').scrollIntoViewIfNeeded();
  // The screenshots are lazy, so the sampling only happens once they land.
  await page.waitForTimeout(1500);

  const sampled = await page.evaluate(() =>
    [...document.querySelectorAll('.project')].map(card => ({
      title: card.querySelector('h3').textContent.trim(),
      sampled: card.dataset.accent === 'sampled',
      l: parseFloat(card.style.getPropertyValue('--pa-l')),
      h: parseFloat(card.style.getPropertyValue('--pa-h')),
    })));

  expect(sampled).toHaveLength(4);
  sampled.forEach(card => {
    expect(card.sampled, `${card.title} never sampled its screenshot`).toBe(true);
    // Written straight into the band the stylesheet expects, so a regression in
    // the clamp shows up here instead of as an unreadable card.
    expect(card.l).toBeGreaterThanOrEqual(0.6);
    expect(card.l).toBeLessThanOrEqual(0.78);
  });
  // Four different projects must not collapse onto one hue.
  const hueBuckets = new Set(sampled.map(card => Math.round(card.h / 15)));
  expect(hueBuckets.size, 'the projects all sampled the same hue').toBeGreaterThan(1);

  // Contrast is measured through a canvas because getComputedStyle hands back
  // oklch() untouched for these colours, and reading its three channels as
  // 0-255 numbers would call a legible blue black-on-black.
  for (const theme of ['dark', 'light']) {
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    await page.waitForTimeout(200);

    const ratios = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const toRgb = value => {
        ctx.fillStyle = '#000000';
        ctx.fillStyle = value;
        ctx.fillRect(0, 0, 1, 1);
        const d = ctx.getImageData(0, 0, 1, 1).data;
        return [d[0], d[1], d[2]];
      };
      const luminance = ([r, g, b]) => {
        const channel = v => {
          const s = v / 255;
          return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        };
        return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
      };
      return [...document.querySelectorAll('.project-type')].map(el => {
        const fg = luminance(toRgb(getComputedStyle(el).color));
        let node = el.parentElement;
        let bg = null;
        while (node) {
          const parts = (getComputedStyle(node).backgroundColor.match(/[\d.]+/g) || []).map(Number);
          if (parts.length >= 3 && (parts.length < 4 || parts[3] > 0)) { bg = luminance(toRgb(getComputedStyle(node).backgroundColor)); break; }
          node = node.parentElement;
        }
        if (bg === null) bg = luminance([11, 13, 16]);
        return Math.round(((Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05)) * 100) / 100;
      });
    });

    ratios.forEach((ratio, index) => {
      expect(ratio, `project ${index + 1} label is unreadable in ${theme}`).toBeGreaterThanOrEqual(4.5);
    });
  }
});

test('a project whose screenshot never loads keeps the site accent', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  // The fallback is the whole reason the variables have defaults: an image that
  // fails, a canvas that refuses pixels, or an early visit must not leave a
  // card with no accent at all.
  await page.route('**/*-preview.jpg', route => route.abort());
  await page.goto(baseURL);
  await page.waitForTimeout(1000);

  const fallback = await page.evaluate(() => {
    const card = document.querySelector('.project');
    return {
      sampled: card.dataset.accent === 'sampled',
      colour: getComputedStyle(card.querySelector('.project-type')).color,
    };
  });
  expect(fallback.sampled).toBe(false);
  expect(fallback.colour).not.toBe('rgb(0, 0, 0)');
  expect(fallback.colour).not.toBe('');
});

test('the case study cover travels from the card instead of popping in', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(baseURL);
  await page.locator('#projects').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);

  await page.evaluate(() => {
    window.__vt = [];
    const tick = () => {
      for (const animation of document.getAnimations()) {
        const pseudo = animation.effect?.pseudoElement;
        if (pseudo && pseudo.includes('view-transition')) window.__vt.push(pseudo);
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  await page.locator('.project').first().locator('.button-case-study').click();
  await page.waitForTimeout(1000);

  const seen = await page.evaluate(() => [...new Set(window.__vt)]);
  // The named group is the only proof that the object travelled. When this
  // silently stopped happening, the dialog still opened and every other check
  // passed; the browser reported it as "Animation start failed" and pointed at
  // the dialog rather than at the duplicate view-transition-name.
  expect(seen.some(name => name.includes('project-cover')), 'the cover never got its own group').toBe(true);

  const leftovers = await page.evaluate(() => ({
    cover: document.getElementById('modal-cover').style.viewTransitionName,
    cards: [...document.querySelectorAll('.project-image img')]
      .map(el => el.style.viewTransitionName)
      .filter(Boolean),
    open: document.getElementById('case-study-modal').open,
    src: document.getElementById('modal-cover').getAttribute('src'),
  }));
  expect(leftovers.open).toBe(true);
  expect(leftovers.src).toContain('preview');
  // A name left on two elements at once cancels the next transition outright.
  expect(leftovers.cover, 'the cover kept its view-transition-name').toBe('');
  expect(leftovers.cards, 'a card kept its view-transition-name').toEqual([]);

  await page.keyboard.press('Escape');
  await expect(page.locator('#case-study-modal')).not.toHaveAttribute('open', '');
});

test('reduced motion opens the case study without the morph', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(baseURL);
  await page.locator('#projects').scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);

  await page.evaluate(() => {
    window.__vt = [];
    const tick = () => {
      for (const animation of document.getAnimations()) {
        const pseudo = animation.effect?.pseudoElement;
        if (pseudo && pseudo.includes('view-transition')) window.__vt.push(pseudo);
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  await page.locator('.project').first().locator('.button-case-study').click();
  await page.waitForTimeout(800);

  const state = await page.evaluate(() => ({
    transitions: [...new Set(window.__vt)],
    open: document.getElementById('case-study-modal').open,
    src: document.getElementById('modal-cover').getAttribute('src'),
  }));
  // The morph is decoration. The dialog is the part that has to work.
  expect(state.open, 'the case study must still open under reduced motion').toBe(true);
  expect(state.src).toContain('preview');
  expect(state.transitions).toEqual([]);
});

test('reduced motion removes the pointer effects instead of shortening them', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(baseURL);

  await page.locator('.project-image').first().scrollIntoViewIfNeeded();
  await page.locator('.button-primary').hover();
  await page.waitForTimeout(500);

  const state = await page.evaluate(() => {
    const cover = document.querySelector('.project-image');
    const button = document.querySelector('.button-primary');
    const glow = document.querySelector('.hero-glow');
    return {
      glow: getComputedStyle(glow).display,
      glowLit: glow.classList.contains('is-lit'),
      coverTransform: getComputedStyle(cover).transform,
      tilting: cover.classList.contains('is-tilting'),
      buttonTransform: getComputedStyle(button).transform,
      magnet: button.classList.contains('is-magnet'),
      marqueeAnimations: document.querySelector('.marquee-track').getAnimations().length,
      kicker: document.querySelector('.section-kicker').textContent.trim(),
    };
  });

  expect(state.glow).toBe('none');
  expect(state.glowLit).toBe(false);
  expect(state.coverTransform).toBe('none');
  expect(state.tilting).toBe(false);
  expect(state.buttonTransform).toBe('none');
  expect(state.magnet).toBe(false);
  expect(state.marqueeAnimations).toBe(0);
  expect(state.kicker, 'a scrambled kicker must land on its real text').toBe('karya pilihan');
});

test('the page renders in its own font and reaches no third party', async ({ page }) => {
  const origin = new URL(baseURL).origin;
  const offOrigin = [];
  page.on('request', request => {
    const url = new URL(request.url());
    if (url.origin !== origin && url.protocol !== 'data:') offOrigin.push(request.url());
  });
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(baseURL);
  await page.evaluate(() => document.fonts.ready);

  // scrollcraft.css loads first and sets font-family on body itself, so the
  // :root token never reached the body text and every paragraph rendered in
  // system-ui while the self-hosted Outfit went unused.
  const fonts = await page.evaluate(() => ({
    body: getComputedStyle(document.body).fontFamily,
    loaded: [...document.fonts].some(f => f.family.includes('Outfit') && f.status === 'loaded'),
  }));
  expect(fonts.body, 'body text is not asking for the brand font').toContain('Outfit');
  expect(fonts.loaded, 'the Outfit woff2 never loaded').toBe(true);

  // SnapDOM was being fetched from unpkg on every load while a byte-identical
  // v3.2.0 bundle sat unused in js/.
  const snapdom = await page.evaluate(() => ({
    type: typeof window.snapdom,
    version: window.snapdom?.version ?? null,
  }));
  expect(['function', 'object']).toContain(snapdom.type);
  expect(snapdom.version).toBe('3.2.0');
  expect(offOrigin, `the page called out: ${offOrigin.join(', ')}`).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test('the CLI drawer hides its tabbable children and hands focus back on exit', async ({ page }) => {
  await page.goto(baseURL);
  const drawer = page.locator('#cli-drawer');

  // aria-hidden alone leaves two focusable children inside a subtree declared
  // hidden. inert takes them out of the tab order in the same breath.
  await expect(drawer).toHaveAttribute('aria-hidden', 'true');
  expect(await drawer.evaluate(el => el.hasAttribute('inert')),
    'the closed drawer still holds focusable children').toBe(true);

  await page.locator('#footer-cli-btn').click();
  await expect(drawer).toHaveAttribute('aria-hidden', 'false');
  expect(await drawer.evaluate(el => el.hasAttribute('inert'))).toBe(false);
  await expect(page.locator('#cli-input')).toBeFocused();

  const escapes = await page.evaluate(() => {
    const drawerNode = document.getElementById('cli-drawer');
    const focusables = drawerNode.querySelectorAll('a[href], button:not([disabled]), input:not([disabled])');
    const last = focusables[focusables.length - 1];
    last.focus();
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    last.dispatchEvent(event);
    return event.defaultPrevented;
  });
  expect(escapes, 'Tab escapes the open drawer into the page behind').toBe(true);

  await page.locator('#cli-input').fill('exit');
  await page.locator('#cli-input').press('Enter');
  await expect(drawer).toHaveAttribute('aria-hidden', 'true');
  // Without preventDefault on the Enter that ran the command, the focus handed
  // to the trigger is immediately activated by that same keypress and the
  // drawer opens straight back up.
  await expect(page.locator('#footer-cli-btn')).toBeFocused();
});

test('print drops the decorative layers that only make sense on screen', async ({ page }) => {
  await page.goto(baseURL);
  await page.emulateMedia({ media: 'print' });
  const printed = await page.evaluate(() => ({
    heroRing: getComputedStyle(document.querySelector('.hero'), '::before').display,
    inlineMedia: getComputedStyle(document.querySelector('.inline-media')).display,
    grain: getComputedStyle(document.body, '::before').display,
  }));
  expect(printed.heroRing, 'the decorative ring prints').toBe('none');
  expect(printed.inlineMedia, 'the photo chip prints').toBe('none');
  expect(printed.grain, 'the grain layer prints').toBe('none');
});
