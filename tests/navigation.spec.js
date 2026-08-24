/** TESTING.md → "Navegação / Tabs" e "Theming (TweaksPanel)" */
import { test, expect, openApp, tab, tabBadge } from "./helpers/fixtures.js";
import { makeFriends, sendMessage, startStreak } from "./helpers/api.js";

/** Open the dev TweaksPanel — it only mounts on the `__activate_edit_mode` message. */
async function openTweaks(page) {
  await page.evaluate(() =>
    window.postMessage({ type: "__activate_edit_mode" }, "*"),
  );
  await expect(page.locator(".twk-panel")).toBeVisible();
}

test.describe("Navegação / Tabs", () => {
  test("TabBar — alterna entre as cinco abas", async ({ appA, page }) => {
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

  test("Stack — push esconde a TabBar, pop devolve", async ({ page, userA }) => {
    await startStreak(userA, 4);
    await openApp(page, userA, { checkedInToday: true });

    await expect(tab(page, "Home")).toBeVisible();

    await page.getByText("Streak history").click();
    await expect(page.getByText("Streak history")).toBeVisible();
    await expect(tab(page, "Home")).toBeHidden();

    await page.locator("#nh-screen button").first().click();
    await expect(tab(page, "Home")).toBeVisible();
  });

  test("resetTo — trocar de aba limpa a stack", async ({ appA, page }) => {
    await tab(page, "Friends").click();
    await page.getByRole("button", { name: /Find friends/ }).click();
    await expect(page.getByText("Add friends")).toBeVisible();
    await expect(tab(page, "Home")).toBeHidden();

    // TabBar is hidden while an overlay is up, so pop first, then switch
    await page.locator("#nh-screen button").first().click();
    await tab(page, "Profile").click();
    await expect(page.getByText("current streak")).toBeVisible();
  });

  test("Animação de transição — nhScreenIn na troca de tela", async ({
    appA,
    page,
  }) => {
    const anim = await page.evaluate(() => {
      const el = document.querySelector("#nh-screen > div");
      return getComputedStyle(el).animationName;
    });
    expect(anim).toBe("nhScreenIn");
  });
});

test.describe("Theming (TweaksPanel)", () => {
  test("Direção — sage ↔ dawn", async ({ appA, page }) => {
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
