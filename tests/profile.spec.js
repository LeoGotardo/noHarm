/** TESTING.md → "Profile" + "Notifications" (parte web) */
import {
  test,
  expect,
  openApp,
  stubNotificationsGranted,
  tab,
  toggleRow,
} from "./helpers/fixtures.js";
import { api, as, startStreak } from "./helpers/api.js";

const openProfile = async (page) => {
  await tab(page, "Profile").click();
  await expect(page.getByText("Member since")).toBeVisible();
};

const openSettings = async (page) => {
  await openProfile(page);
  await page.locator("#nh-screen button").first().click();
  await expect(page.getByText("Settings")).toBeVisible();
};

test.describe("Profile", () => {
  test("My profile — username, data de entrada, streak, record e contagem de badges", async ({
    page,
    userA,
  }) => {
    await startStreak(userA, 7);
    await openApp(page, userA, { checkedInToday: true });
    await openProfile(page);

    await expect(page.getByText(userA.username)).toBeVisible();
    await expect(page.getByText("current streak")).toBeVisible();
    await expect(page.getByText("personal best")).toBeVisible();
    await expect(page.getByText(/\d+ badges? earned/)).toBeVisible();
    await expect(page.getByRole("button", { name: /Edit profile/ })).toBeVisible();
  });

  test("My profile — card de badges leva para a aba Badges", async ({ appA, page }) => {
    await openProfile(page);
    await page.getByText(/badges? earned/).click();
    await expect(page.getByText("All milestones")).toBeVisible();
  });

  test("Edit profile — salva username (toast 'Profile updated') e refaz o fetch", async ({
    appA,
    page,
    userA,
  }) => {
    await openProfile(page);
    await page.getByRole("button", { name: /Edit profile/ }).click();
    await expect(page.getByText("Edit profile")).toBeVisible();

    const save = page.getByRole("button", { name: "Save" });
    await expect(save).toBeDisabled(); // nothing changed yet

    const newName = `${userA.username}x`.slice(-40);
    await page.locator('input[type="text"]').first().fill(newName);
    await expect(save).toBeEnabled();
    await save.click();

    await expect(page.getByText("Profile updated")).toBeVisible();
    await expect(page.getByText(newName)).toBeVisible();

    const me = await api.get("/users/me", as(userA));
    expect(me.username).toBe(newName);
  });

  test("Edit profile — email é somente leitura e username curto bloqueia o Save", async ({
    appA,
    page,
    userA,
  }) => {
    await openProfile(page);
    await page.getByRole("button", { name: /Edit profile/ }).click();

    await expect(page.getByText("Email can't be changed here.")).toBeVisible();

    await page.locator('input[type="text"]').first().fill("ab");
    await expect(page.getByText("At least 3 characters.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  test("Settings — toggle dark/light troca o data-mode do root", async ({
    appA,
    page,
  }) => {
    await openSettings(page);
    await expect(page.locator(".nh-root")).toHaveAttribute("data-mode", "light");

    await toggleRow(page, "Dark mode").click();
    await expect(page.locator(".nh-root")).toHaveAttribute("data-mode", "dark");

    await toggleRow(page, "Dark mode").click();
    await expect(page.locator(".nh-root")).toHaveAttribute("data-mode", "light");
  });

  test("Settings — prefs de notificação começam desligadas sem permissão", async ({
    appA,
    page,
  }) => {
    await openSettings(page);

    await expect(page.getByText("Enable notifications")).toBeVisible();
    await expect(page.getByText("Turn on to receive alerts")).toBeVisible();
    await expect(page.getByText("Messages", { exact: true })).toBeVisible();
    await expect(page.getByText("Friend requests")).toBeVisible();
    await expect(page.getByText("Daily check-in reminder")).toBeVisible();

    // Without permission the master stays off, and every sub-toggle switch is
    // disabled with it.
    const prefs = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("nh_notif_prefs") ?? "null"),
    );
    expect(prefs?.master ?? false).toBe(false);

    for (const label of [
      "Messages",
      "Friend requests",
      "Daily check-in reminder",
    ]) {
      await expect(toggleRow(page, label)).toBeDisabled();
    }
  });

  test("Settings — permissão concedida liga o master e persiste as prefs", async ({
    page,
    userA,
  }) => {
    await stubNotificationsGranted(page);
    await openApp(page, userA, { checkedInToday: true });
    await openSettings(page);

    await toggleRow(page, "Enable notifications").click();

    await expect(page.getByText("Active")).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () => JSON.parse(localStorage.getItem("nh_notif_prefs") ?? "{}").master,
        ),
      )
      .toBe(true);
  });

  test("Settings — links sem destino aparecem como 'Soon', não como toque morto", async ({
    appA,
    page,
  }) => {
    await openSettings(page);

    await expect(page.getByRole("button", { name: /Privacy & safety/ })).toBeDisabled();
    await expect(page.getByRole("button", { name: /Crisis resources/ })).toBeDisabled();
    await expect(page.getByText("Soon").first()).toBeVisible();
  });
});
