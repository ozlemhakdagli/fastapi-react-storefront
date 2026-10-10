import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.E2E_BASE_URL ?? ''

// The browser tests run against the throw-away stack that scripts/e2e.sh starts.
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  workers: 1,
  fullyParallel: false,
  retries: 0,
  timeout: 60_000,
  reporter: 'list',
  use: {
    baseURL: baseURL,
    storageState: {
      cookies: [],
      origins: [{ origin: baseURL, localStorage: [{ name: 'ecommerce.lang', value: 'tr' }] }],
    },
    locale: 'tr-TR',
    // E2E_CHANNEL=chrome uses the Google Chrome installed on the machine: nothing is downloaded.
    channel: process.env.E2E_CHANNEL || undefined,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
