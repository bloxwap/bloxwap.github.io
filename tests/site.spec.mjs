// Browser checks for the HIG adoption (bloxwap/hig#61), against the local static server.
import {expect, test} from '@playwright/test';

const PAGES = [['/', 200], ['/developers/', 200], ['/privacy/', 200], ['/no-such-page/', 404]];
const SDK_SITES = ['/chart/', '/hyperliquid/', '/sfx/', '/haptic/', '/font/'];

/** Resolves a HIG role to the computed colour the browser paints. */
const role = (page, name) => page.evaluate(name => {
  const probe = document.body.appendChild(document.createElement('i'));
  probe.style.color = `var(${name})`;
  const value = getComputedStyle(probe).color;
  probe.remove();
  return value;
}, name);

/** Loads a page and fails on any local request that errors (fonts, CSS, images). */
async function open(page, path, status) {
  const failures = [];
  page.on('response', response => { if (response.status() >= 400 && response.url() !== page.url() && new URL(response.url()).pathname !== path) failures.push(`${response.status()} ${response.url()}`); });
  page.on('requestfailed', request => failures.push(`failed ${request.url()}`));
  const response = await page.goto(path);
  expect(response.status()).toBe(status);
  await page.evaluate(() => document.fonts.ready);
  return failures;
}

for (const [path, status] of PAGES) {
  test.describe(path, () => {
    test('loads HIG roles, Bloxwap fonts and every asset', async ({page}) => {
      const failures = await open(page, path, status);
      expect(failures).toEqual([]);
      const state = await page.evaluate(() => {
        const faces = [...document.fonts].filter(face => face.status === 'loaded').map(face => face.family.replace(/"/g, ''));
        return {
          background: getComputedStyle(document.documentElement).getPropertyValue('--hig-background').trim(),
          bodyFont: getComputedStyle(document.body).fontFamily,
          codeFont: getComputedStyle(document.querySelector('.eyebrow')).fontFamily,
          faces,
          sans: document.fonts.check('16px "Bloxwap Sans"'),
          bodyBackground: getComputedStyle(document.body).backgroundColor,
          bodyColor: getComputedStyle(document.body).color,
          icon: document.querySelector('link[rel=icon]').getAttribute('href'),
        };
      });
      expect(state.background).not.toBe('');
      expect(state.bodyFont).toMatch(/^"Bloxwap Sans"/);
      expect(state.codeFont).toMatch(/^"Bloxwap Mono"/);
      expect(state.faces).toEqual(expect.arrayContaining(['Bloxwap Sans', 'Bloxwap Mono']));
      expect(state.sans).toBe(true);
      expect(state.bodyBackground).toBe(await page.evaluate(() => { const i = document.body.appendChild(document.createElement('i')); i.style.backgroundColor = 'var(--hig-background)'; const v = getComputedStyle(i).backgroundColor; i.remove(); return v; }));
      expect(state.bodyColor).toBe(await role(page, '--hig-text'));
      expect(state.icon).toBe('/icon.svg');
    });

    test('every link shows the HIG focus ring from the keyboard', async ({page}) => {
      await open(page, path, status);
      const focus = await role(page, '--hig-focus');
      const count = await page.locator('a[href]').count();
      expect(count).toBeGreaterThan(5);
      for (let i = 0; i < count; i++) {
        await page.keyboard.press('Tab');
        const ring = await page.evaluate(() => {
          const el = document.activeElement, style = getComputedStyle(el), box = el.getBoundingClientRect();
          return {index: [...document.querySelectorAll('a[href]')].indexOf(el), tag: el.tagName, href: el.getAttribute('href'), text: el.textContent.trim(), style: style.outlineStyle, width: parseFloat(style.outlineWidth), color: style.outlineColor, w: box.width, h: box.height};
        });
        expect(ring.tag, `Tab ${i + 1}`).toBe('A');
        expect(ring.style, `${ring.href} outline`).toBe('solid');
        expect(ring.width).toBeGreaterThanOrEqual(2);
        expect(ring.color).toBe(focus);
        expect(ring.w * ring.h).toBeGreaterThan(0);
        expect(ring.index, `Tab ${i + 1} reaches links in document order`).toBe(i);
      }
    });

    test('brand lockups scale with 200% root text', async ({page}) => {
      await page.setViewportSize({width: 1280, height: 900});
      await open(page, path, status);
      const measure = () => page.evaluate(() => [...document.querySelectorAll('.nav .brand img, .footer-brand .brand img')].map(img => {
        const box = img.getBoundingClientRect();
        return {where: img.closest('.nav') ? 'nav' : 'footer', loaded: img.complete && img.naturalWidth > 0, w: box.width, h: box.height};
      }));
      const base = await measure();
      expect(base.map(lockup => lockup.where)).toEqual(['nav', 'footer']);
      for (const lockup of base) expect(lockup.loaded, `${lockup.where} lockup loaded`).toBe(true);
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
      const large = await measure();
      for (const [i, lockup] of large.entries()) {
        expect(lockup.h, `${lockup.where} lockup height at 200% text`).toBeCloseTo(base[i].h * 2, 0);
        expect(lockup.w / lockup.h, `${lockup.where} lockup keeps its aspect ratio`).toBeCloseTo(base[i].w / base[i].h, 1);
      }
    });

    for (const [width, text] of [[320, '100%'], [390, '100%'], [1280, '200%']]) {
      test(`reflows without horizontal scrolling at ${width}px with ${text} text`, async ({page}) => {
        await page.setViewportSize({width, height: 900});
        await open(page, path, status);
        if (text !== '100%') await page.evaluate(size => { document.documentElement.style.fontSize = size; }, text);
        const overflow = await page.evaluate(() => {
          const limit = document.documentElement.clientWidth;
          const wide = [...document.querySelectorAll('body *')].filter(el => el.getBoundingClientRect().right > limit + 0.5).map(el => `${el.tagName.toLowerCase()}.${el.className}`);
          return {scroll: document.documentElement.scrollWidth, limit, wide};
        });
        expect(overflow.wide).toEqual([]);
        expect(overflow.scroll).toBeLessThanOrEqual(overflow.limit);
      });
    }
  });
}

test('home links to the five SDK docs sites and Screensaver', async ({page}) => {
  await page.goto('/');
  for (const site of SDK_SITES) await expect(page.locator(`main a.card[href="${site}"]`)).toHaveCount(1);
  await expect(page.locator('main a.card[href="/screensaver/"]')).toHaveCount(1);
});

test('developer portal covers the five SDKs', async ({page}) => {
  await page.goto('/developers/');
  for (const name of ['Chart SDK', 'Hyperliquid SDK', 'SFX', 'Haptic', 'Font']) await expect(page.locator('main h2', {hasText: new RegExp(`^${name}$`)})).toHaveCount(1);
  for (const site of SDK_SITES) expect(await page.locator(`main a[href^="${site}"]`).count()).toBeGreaterThanOrEqual(2);
});

test('primary action uses the action and onAction roles at the comfortable control height', async ({page}) => {
  await page.goto('/no-such-page/');
  const cta = page.locator('a.cta');
  const style = await cta.evaluate(el => { const s = getComputedStyle(el); return {background: s.backgroundColor, color: s.color, height: el.getBoundingClientRect().height}; });
  const action = await page.evaluate(() => { const i = document.body.appendChild(document.createElement('i')); i.style.backgroundColor = 'var(--hig-action)'; const v = getComputedStyle(i).backgroundColor; i.remove(); return v; });
  expect(style.background).toBe(action);
  expect(style.color).toBe(await role(page, '--hig-onAction'));
  expect(style.height).toBeGreaterThanOrEqual(48);
});

test('OG card metadata points at a 1200x630 image on every indexed page', async ({page, request}) => {
  for (const path of ['/', '/developers/', '/privacy/']) {
    await page.goto(path);
    const meta = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]')].map(m => [m.getAttribute('property') ?? m.getAttribute('name'), m.content])));
    expect(meta['og:image']).toBe('https://bloxwap.github.io/og/home.png');
    expect([meta['og:image:width'], meta['og:image:height']]).toEqual(['1200', '630']);
    expect(meta['twitter:card']).toBe('summary_large_image');
    for (const key of ['og:title', 'og:description', 'og:url', 'og:image:alt']) expect(meta[key], `${path} ${key}`).toBeTruthy();
  }
  const png = await (await request.get('/og/home.png')).body();
  expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
});
