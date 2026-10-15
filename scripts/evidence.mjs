// Screenshots and a byte report for one checkout of the site (browser evidence, Chromium).
//   node scripts/evidence.mjs --root <checkout> --label before|after --out <dir> [--port 5261]
// Writes <label>-<page>-<width>.png and <label>-bytes.json. Bytes are what each page requests from
// this origin: raw file sizes plus gzip -9 for text (GitHub Pages compresses text, not woff2/png).
import {chromium} from '@playwright/test';
import {gzipSync} from 'node:zlib';
import {mkdirSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {serve} from './serve.mjs';

const arg = (name, fallback) => { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : fallback; };
const root = resolve(arg('--root', '.')), label = arg('--label', 'after'), out = resolve(arg('--out', 'evidence/hig-61')), port = Number(arg('--port', 5261));
const PAGES = [['home', '/'], ['developers', '/developers/'], ['privacy', '/privacy/'], ['404', '/no-such-page/']];
const SHOTS = new Set(['home', 'developers']);
const WIDTHS = [['desktop', 1440, 900], ['390', 390, 844]];
const TEXT = /^(?:text\/|application\/(?:json|xml)|image\/svg)/;

mkdirSync(out, {recursive: true});
const server = await serve({root, port});
const browser = await chromium.launch();
const report = {label, root, browser: `Chromium ${browser.version()}`, pages: {}};
try {
  for (const [name, path] of PAGES) {
    for (const [widthName, width, height] of WIDTHS) {
      const context = await browser.newContext({viewport: {width, height}, deviceScaleFactor: 1});
      const page = await context.newPage();
      const responses = [];
      page.on('response', response => responses.push(response));
      await page.goto(`http://127.0.0.1:${port}${path}`, {waitUntil: 'networkidle'});
      await page.evaluate(() => document.fonts.ready);
      if (SHOTS.has(name)) await page.screenshot({path: join(out, `${label}-${name}-${widthName}.png`), fullPage: true});
      if (widthName === 'desktop') {
        const files = [];
        for (const response of responses) {
          const url = new URL(response.url());
          if (url.origin !== `http://127.0.0.1:${port}`) continue;
          const body = await response.body().catch(() => Buffer.alloc(0));
          const type = (response.headers()['content-type'] ?? '').split(';')[0];
          files.push({path: url.pathname + url.search, type, status: response.status(), raw: body.length, transfer: TEXT.test(type) ? gzipSync(body, {level: 9}).length : body.length});
        }
        const sum = key => files.reduce((total, file) => total + file[key], 0);
        const by = kind => files.filter(file => kind(file.type)).reduce((total, file) => total + file.raw, 0);
        report.pages[path] = {files, requests: files.length, raw: sum('raw'), transfer: sum('transfer'),
          html: by(t => t === 'text/html'), css: by(t => t === 'text/css'), fonts: by(t => t.startsWith('font/')), images: by(t => t.startsWith('image/')),
          documentHeight: await page.evaluate(() => document.documentElement.scrollHeight),
          overflowAt: await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)};
      }
      await context.close();
    }
  }
} finally {
  await browser.close();
  server.close();
}
writeFileSync(join(out, `${label}-bytes.json`), `${JSON.stringify(report, null, 2)}\n`);
console.log(`evidence: ${label} → ${out}`);
