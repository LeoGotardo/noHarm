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
  await page.locator("#nh-stage button").first().click();
  await expect(page.getByText("Settings")).toBeVisible();
};

test.describe("Profile", () => {
  test("My profile — username, join date, streak, record and badge count", async ({
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

  test("Edit profile — email is read-only and a short username blocks Save", async ({
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

  test("Settings — dark mode paints the document, not just the column", async ({
    appA,
    page,
  }) => {
    await openSettings(page);
    await toggleRow(page, "Dark mode").click();
    await expect(page.locator(".nh-root")).toHaveAttribute("data-mode", "dark");

    // Screens fade in (nhScreenIn); during the fade what shows through is the
    // document background. If it stays light, every screen change flashes white
    // in dark mode.
    await expect(page.locator("html")).toHaveAttribute("data-mode", "dark");

    const painted = await page.evaluate(() => {
      const html = document.documentElement;
      return {
        token: getComputedStyle(html).getPropertyValue("--bg").trim(),
        body: getComputedStyle(document.body).backgroundColor,
        column: getComputedStyle(document.querySelector(".nh-root"))
          .backgroundColor,
      };
    });

    // A transparent background does not count: the browser paints its white
    // canvas underneath. The token has to resolve on <html> — it only existed on
    // .nh-root, a descendant of body, and custom properties do not travel up.
    expect(painted.token).not.toBe("");
    expect(painted.body).not.toBe("rgba(0, 0, 0, 0)");
    expect(painted.body).toBe(painted.token);
    expect(painted.column).toBe(painted.token);
  });

  test("Settings — the theme choice survives a reload, with no light flash", async ({
    appA,
    page,
  }) => {
    await openSettings(page);
    await toggleRow(page, "Dark mode").click();
    await expect(page.locator(".nh-root")).toHaveAttribute("data-mode", "dark");

    // The inline script in index.html applies the theme before first paint, so
    // <html> starts out dark — before React mounts.
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-mode", "dark");
    await expect(page.locator(".nh-root")).toHaveAttribute("data-mode", "dark");
  });

  test("Settings — an invalid stored theme falls back to the default", async ({
    appA,
    page,
  }) => {
    await page.evaluate(() =>
      localStorage.setItem(
        "nh_tweaks",
        JSON.stringify({ direction: "nope", mode: "meia-noite" }),
      ),
    );
    await page.reload();

    await expect(page.locator("html")).toHaveAttribute("data-mode", "light");
    await expect(page.locator("html")).toHaveAttribute("data-dir", "sage");
    await expect(page.locator(".nh-root")).toHaveAttribute("data-mode", "light");
  });

  test("Settings — notification prefs start off without permission", async ({
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

  test("Settings — granted permission turns on the master and persists the prefs", async ({
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

  test("Settings — no row is a dead tap", async ({ appA, page }) => {
    await openSettings(page);

    // This used to assert the opposite: "Privacy & safety" and "Crisis
    // resources" were disabled and marked Soon, because neither had a screen.
    // Both have one now, so what is left to guard is the rule the old test was
    // really about — a row either goes somewhere or says it does not yet.
    await expect(page.getByRole("button", { name: /Privacy & data/ })).toBeEnabled();
    await expect(page.getByRole("button", { name: /Crisis resources/ })).toBeEnabled();

    await page.getByText("Crisis resources").click();
    await expect(page.getByText(/not treatment/i)).toBeVisible();
  });
});
