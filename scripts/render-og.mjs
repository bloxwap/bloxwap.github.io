// Renders scripts/og/home.html to og/home.png at 1200×630 through the local preview server.
//   bun run server.ts &  then  node scripts/render-og.mjs [baseUrl]
// Needs Playwright with Chromium (npx playwright install chromium); not used in CI.
import {chromium} from 'playwright';
const base=process.argv[2]??'http://localhost:3900';
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1200,height:630}});
await page.goto(`${base}/scripts/og/home.html`,{waitUntil:'networkidle'});
await page.evaluate(()=>document.fonts.ready);
await page.screenshot({path:new URL('../og/home.png',import.meta.url).pathname});
await browser.close();
console.log('og/home.png written');
