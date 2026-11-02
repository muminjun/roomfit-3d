import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  use: { baseURL: "http://127.0.0.1:4173" },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    ...(process.env.RUN_CHROME === "1"
      ? [
          {
            name: "chrome",
            use: { ...devices["Desktop Chrome"], channel: "chrome" },
          },
        ]
      : []),
    ...(process.env.PLAYWRIGHT_EDGE === "1"
      ? [
          {
            name: "edge",
            use: { ...devices["Desktop Edge"], channel: "msedge" },
          },
        ]
      : []),
  ],
});
