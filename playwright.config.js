import { defineConfig, devices } from "@playwright/test";

const WEB_URL = process.env.E2E_WEB_URL ?? "http://localhost:5173";

export default defineConfig({
  testDir: "./tests",
  // The suite cleans up after itself — and before itself, because a run killed
  // mid-way never reaches a teardown and nothing else ever removes those
  // accounts (`DELETE /users/me` is a soft delete, and the purge job refuses
  // anything inside its grace window). See tests/helpers/cleanup.js.
  globalSetup: "./tests/global-setup.js",
  globalTeardown: "./tests/global-teardown.js",
  // Each test provisions its own throwaway accounts, so tests are independent.
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
  retries: process.env.CI ? 1 : 0,
  timeout: 45_000,
  expect: { timeout: 8_000 },
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: WEB_URL,
    // The app is a phone-shaped SPA — test it at phone size.
    ...devices["Pixel 7"],
    isMobile: false, // keep desktop mouse events; only the viewport matters
    hasTouch: false,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [{ name: "chromium" }],
  webServer: {
    command: "npm run dev",
    url: WEB_URL,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
