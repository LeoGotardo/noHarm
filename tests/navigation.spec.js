/** TESTING.md → "Navigation / Tabs" and "Theming (TweaksPanel)" */
import { test, expect, openApp, tab, tabBadge } from "./helpers/fixtures.js";
import { makeFriends, sendMessage, startStreak } from "./helpers/api.js";

/**
 * Whether the navigation survives a pushed screen.
 *
 * It does not on a phone — there is no room for a bar and a screen at once —
 * and it does on a desktop, where the side rail stays put. Same rule, opposite
 * expectation, so the assertion has to know which shell it is looking at.
 */
const navSurvivesPush = () => test.info().project.name === "desktop";

async function expectNavAfterPush(page) {
  const home = tab(page, "Home");
  await (navSurvivesPush()
    ? expect(home).toBeVisible()
    : expect(home).toBeHidden());
}

/** Open the dev TweaksPanel — it only mounts on the `__activate_edit_mode` message. */
async function openTweaks(page) {
  await page.evaluate(() =>
    window.postMessage({ type: "__activate_edit_mode" }, "*"),
  );
  await expect(page.locator(".twk-panel")).toBeVisible();
}

test.describe("Navigation / Tabs", () => {
  test("TabBar — switches between the five tabs", async ({ appA, page }) => {
    await expect(page.getByText("Begin your journey")).toBeVisible();

    await tab(page, "Friends").click();
    await expect(page.getByText("in your circle")).toBeVisible();

    await tab(page, "Chat").click();
    await expect(page.getByText("Messages")).toBeVisible();

    await tab(page, "Badges").click();
    await expect(page.getByText("All milestones")).toBeVisible();

    await tab(page, "Profile").click();
    await expect(page.getByText("current streak")).toBeVisible();

    await tab(page, "Home").click();
    await expect(page.getByText("Begin your journey")).toBeVisible();
  });

  test("TabBar — badges de contador em Friends e Chat", async ({
    page,
    userA,
    userB,
  }) => {
    await makeFriends(userA, userB);
    await sendMessage(userB, { to: userA, content: "ping" });

    await openApp(page, userA, { checkedInToday: true });

    await expect(tabBadge(page, "Chat")).toHaveText("1");
    // No pending requests → no badge on Friends
    await expect(tabBadge(page, "Friends")).toHaveCount(0);
  });

  test("Stack — push esconde a TabBar no celular, rail permanece no desktop", async ({ page, userA }) => {
    await startStreak(userA, 4);
    await openApp(page, userA, { checkedInToday: true });

    await expect(tab(page, "Home")).toBeVisible();

    await page.getByText("Streak history").click();
    await expect(page.getByText("Streak history")).toBeVisible();
    await expectNavAfterPush(page);

    await page.locator("#nh-stage button").first().click();
    await expect(tab(page, "Home")).toBeVisible();
  });

  test("resetTo — switching tabs clears the stack", async ({ appA, page }) => {
    await tab(page, "Friends").click();
    await page.getByRole("button", { name: /Find friends/ }).click();
    await expect(page.getByText("Add friends")).toBeVisible();
    await expectNavAfterPush(page);

    // The bottom bar is hidden while an overlay is up, so pop first, then
    // switch — which is also a valid path on the desktop rail.
    await page.locator("#nh-stage button").first().click();
    await tab(page, "Profile").click();
    await expect(page.getByText("current streak")).toBeVisible();
  });

  test("Transition animation — nhScreenIn on screen change", async ({
    appA,
    page,
  }) => {
    const anim = await page.evaluate(() => {
      const el = document.querySelector("#nh-stage");
      return getComputedStyle(el).animationName;
    });
    expect(anim).toBe("nhScreenIn");
  });
});

test.describe("Theming (TweaksPanel)", () => {
  test("Direction — sage ↔ dawn", async ({ appA, page }) => {
    await expect(page.locator(".nh-root")).toHaveAttribute("data-dir", "sage");

    await openTweaks(page);
    await page.locator('.twk-seg button[role="radio"]', { hasText: "dawn" }).click();
    await expect(page.locator(".nh-root")).toHaveAttribute("data-dir", "dawn");
  });

  test("Modo — light ↔ dark", async ({ appA, page }) => {
    await openTweaks(page);
    await page.locator('.twk-seg button[role="radio"]', { hasText: "dark" }).click();
    await expect(page.locator(".nh-root")).toHaveAttribute("data-mode", "dark");
  });

  test("Motion off — desliga o confete", async ({ appA, page }) => {
    await openTweaks(page);
    await page.locator(".twk-toggle").click();
    await expect(page.locator(".nh-root")).toHaveAttribute("data-reduce-motion", "yes");

    // Dismiss the panel so it doesn't cover the dashboard button
    await page.locator(".twk-x").click();

    await page.getByRole("button", { name: /Start my streak/ }).click();
    await page.getByRole("button", { name: "Begin my streak" }).click();
    await expect(page.getByText("Your streak has begun")).toBeVisible();

    const confetti = await page.evaluate(
      () => document.querySelectorAll('#nh-screen div[style*="z-index: 88"] span').length,
    );
    expect(confetti).toBe(0);
  });
});
