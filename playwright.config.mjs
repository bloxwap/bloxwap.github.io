import {defineConfig, devices} from '@playwright/test';

const port = Number(process.env.PORT ?? 5260);
// SITE_ROOT serves another checkout (for example the pre-HIG main) with the same tests.
const root = process.env.SITE_ROOT ? ` --root ${JSON.stringify(process.env.SITE_ROOT)}` : '';
export default defineConfig({
  testDir: 'tests',
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  use: {baseURL: `http://127.0.0.1:${port}`},
  projects: [{name: 'chromium', use: {...devices['Desktop Chrome']}}],
  webServer: {command: `node scripts/serve.mjs --port ${port}${root}`, url: `http://127.0.0.1:${port}/`, reuseExistingServer: !process.env.CI},
});
