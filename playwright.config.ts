import { defineConfig } from '@playwright/test';

const browserUrl =
  process.env['PLAYWRIGHT_BASE_URL'] ?? 'http://127.0.0.1:4173';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] ? 2 : 0,
  use: {
    baseURL: browserUrl,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: {
      executablePath: '/opt/google/chrome/chrome',
    },
  },
});
