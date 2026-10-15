// Renders og/home.png (1200x630) from scripts/og-card.html with the site's HIG roles and fonts.
//   npm run og [-- --port 5263]
import {chromium} from '@playwright/test';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {serve} from './serve.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const i = process.argv.indexOf('--port'), port = Number(i >= 0 ? process.argv[i + 1] : 5263);
const server = await serve({root, port});
const browser = await chromium.launch();
try {
  const page = await browser.newPage({viewport: {width: 1200, height: 630}, deviceScaleFactor: 1});
  await page.goto(`http://127.0.0.1:${port}/scripts/og-card.html`, {waitUntil: 'networkidle'});
  await page.evaluate(() => document.fonts.ready);
  const loaded = await page.evaluate(() => document.fonts.check('600 96px "Bloxwap Sans"') && document.fonts.check('600 24px "Bloxwap Mono"'));
  if (!loaded) throw Error('Bloxwap Sans/Mono did not load');
  await page.screenshot({path: join(root, 'og/home.png'), clip: {x: 0, y: 0, width: 1200, height: 630}});
  console.log('og: wrote og/home.png (1200x630)');
} finally {
  await browser.close();
  server.close();
}
