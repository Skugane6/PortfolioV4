import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

/**
 * End-to-end checks run against the production build (prerendered HTML plus
 * hydration), because that is what visitors get and where SSR mismatches
 * would show up. Two projects: a 1440 desktop and a 375 touch phone.
 */
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  workers: 2,
  retries: 0,
  reporter: [['list']],
  timeout: 45_000,
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    {
      name: 'phone',
      use: { ...devices['Desktop Chrome'], viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
    },
  ],
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort --host 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
