import { defineConfig, devices } from '@playwright/test';

// Build exactly once with VITE_BASE_PATH=/roomfit-3d/ before this command.
// This server consumes that same dist; it never rebuilds or changes its base.
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'subpath.pw.ts',
  use: { baseURL: 'http://127.0.0.1:4174/roomfit-3d/' },
  webServer: {
    command: 'VITE_BASE_PATH=/roomfit-3d/ npm run preview -- --host 127.0.0.1 --port 4174 --strictPort',
    url: 'http://127.0.0.1:4174/roomfit-3d/',
    reuseExistingServer: false,
  },
  projects: [
    { name: 'chromium-subpath', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox-subpath', use: { ...devices['Desktop Firefox'] } },
  ],
});
