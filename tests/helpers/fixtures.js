import { test as base, expect } from "@playwright/test";
import { createUser, deleteUser, todayISO } from "./api.js";
import { clearRateLimit } from "./ratelimit.js";

/**
 * Put an authenticated session into the page before any app code runs.
 *
 * `nh_access` / `nh_refresh` are what App reads on first render to decide
 * phase === 'app', so seeding them is equivalent to a completed Google login.
 *
 * The check-in modal opens whenever a streak exists and `nh_cache_streak_last_checkin`
 * isn't today (see store/useStreak.js). Tests that want a clean dashboard pass
 * `checkedInToday: true`; tests that want the modal leave it false.
 */
export async function seedSession(page, user, { checkedInToday = false } = {}) {
  // Written once via evaluate rather than addInitScript: an init script would
  // re-seed the tokens on every navigation, including the reload that logout
  // and delete-account perform, making those flows impossible to test.
  await page.evaluate(
    ({ access, refresh, today }) => {
      localStorage.setItem("nh_access", access);
      localStorage.setItem("nh_refresh", refresh);
      if (today) {
        localStorage.setItem(
          "nh_cache_streak_last_checkin",
          JSON.stringify({ data: today, at: Date.now() }),
        );
      }
    },
    {
      access: user.accessToken,
      refresh: user.refreshToken,
      today: checkedInToday ? todayISO() : null,
    },
  );
}

/** Seed a session and land on the app. */
export async function openApp(page, user, opts) {
  // First load lands on the splash (no token, no API traffic); seed the session
  // there, then reload so the app boots authenticated.
  await page.goto("/");
  await seedSession(page, user, opts);
  await page.reload();
  return page;
}

/**
 * Make the browser Notification API report "granted".
 *
 * context.grantPermissions(["notifications"]) has no effect in the bundled
 * Chromium headless shell — Notification.permission stays "denied" — so the
 * only way to exercise the Settings master toggle is to stub the API. The
 * permission prompt itself is the browser's, not the app's.
 */
export async function stubNotificationsGranted(page) {
  await page.addInitScript(() => {
    const N = function () {};
    N.permission = "granted";
    N.requestPermission = async () => "granted";
    Object.defineProperty(window, "Notification", { value: N, configurable: true });
  });
}

/** Open a second browser context signed in as another user (for realtime tests). */
export async function openSecondApp(browser, user, opts) {
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
  });
  const page = await context.newPage();
  await openApp(page, user, opts);
  return { context, page };
}

export const test = base.extend({
  /**
   * Reset the shared rate-limit counter before every test.
   *
   * `auto` makes it run even for tests that take no other fixture; the user
   * fixtures depend on it explicitly so the reset always lands before the first
   * API call of the test.
   */
  freshRateLimit: [
    async ({}, use) => {
      await clearRateLimit();
      await use();
    },
    { auto: true },
  ],

  /** A throwaway account, deleted after the test. */
  userA: async ({ freshRateLimit }, use) => {
    const user = await createUser("a");
    await use(user);
    await deleteUser(user);
  },

  /** A second throwaway account, for friendship/chat flows. */
  userB: async ({ freshRateLimit }, use) => {
    const user = await createUser("b");
    await use(user);
    await deleteUser(user);
  },

  /** `page`, already signed in as userA and sitting on the dashboard. */
  appA: async ({ page, userA }, use) => {
    await openApp(page, userA, { checkedInToday: true });
    await use(page);
  },
});

export { expect };

// ── Shared locators ──────────────────────────────────────────────────────────

/**
 * A TabBar button ('Home' | 'Friends' | 'Chat' | 'Badges' | 'Profile').
 * Matched on the label span, not the accessible name — an unread badge renders
 * inside the button and would otherwise change the name to e.g. "1Chat".
 */
export const tab = (page, name) =>
  page.locator(`button:has(> span:text-is("${name}"))`);

/** The counter badge on a TabBar button (empty locator when there is none). */
export const tabBadge = (page, name) => tab(page, name).locator("> div > span");

/** Toast text (auto-dismisses after 2.2s, so assert promptly). */
export const toast = (page, text) => page.getByText(text, { exact: false });

/** The back chevron — always the first button rendered inside a stacked screen. */
export const backButton = (page) => page.locator("#nh-screen button").first();

/** The switch of a Settings ToggleRow, addressed by its label. */
export const toggleRow = (page, label) =>
  page.locator(`div:has(> div > div:text-is("${label}")) > button`);
