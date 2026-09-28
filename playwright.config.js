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
  projects: [
    // The phone-shaped app, at phone size (the `use` block above).
    { name: "chromium", testIgnore: /desktop\.spec\.js/ },
    // The desktop shell. The flow specs are re-run at 1440x900 so a layout
    // change cannot break them unnoticed, plus desktop.spec.js for what only
    // exists past the breakpoint. The rest (realtime, reports, moderation)
    // exercise the same components through the same screens and would only
    // double the runtime.
    {
      name: "desktop",
      use: { viewport: { width: 1440, height: 900 } },
      testMatch: /(desktop|navigation|chat|friends|profile|admin)\.spec\.js/,
    },
  ],
  webServer: {
    command: "npm run dev",
    url: WEB_URL,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
