/**
 * TESTING.md → "Auth / Onboarding"
 *
 * The Register/Login submit buttons open a Google popup (services/api/auth.js →
 * fbLogin), which Google blocks inside automation. Those two steps are covered
 * at the API level in tests/helpers/api.js (register → token → /users/me) and
 * here only up to the popup boundary.
 */
import { test, expect, openApp, tab } from "./helpers/fixtures.js";
import { api, as, createUser, fakeIdToken } from "./helpers/api.js";
import { purgeUid, rowsFor } from "./helpers/cleanup.js";

test.describe("Auth / Onboarding", () => {
  test("Landing — a visitor lands on it, and its buttons open Register and Login", async ({
    page,
  }) => {
    // On the web the landing page is the front door; the splash is the
    // installed app's (src/landing.js).
    await page.goto("/");
    await expect(page).toHaveURL(/\/about$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await page.getByRole("link", { name: "Get started" }).click();
    await expect(page.getByText("Create account")).toBeVisible();
    await expect(page.getByPlaceholder("3–50 characters")).toBeVisible();
    // The ?start= query is consumed, so a reload does not reopen this screen.
    await expect(page).toHaveURL(/\/$/);

    // Back → the landing, not the splash
    await page.locator("#nh-stage button").first().click();
    await expect(page).toHaveURL(/\/about$/);

    await page.getByRole("link", { name: "Log in" }).first().click();
    await expect(page.getByText("Good to see you again")).toBeVisible();

    await page.locator("#nh-stage button").first().click();
    await expect(page).toHaveURL(/\/about$/);
  });

  test("Register — username validation (min. 3 chars) enables the Google button", async ({
    page,
  }) => {
    await page.goto("/?start=register");

    const field = page.getByPlaceholder("3–50 characters");
    await field.fill("ab");
    await expect(page.getByText("At least 3 characters.")).toBeVisible();

    await field.fill("recovering_sam");
    await expect(page.getByText("This is how friends will find you.")).toBeVisible();
  });

  test("Register/Login via API — creates the account, issues a JWT and resolves /users/me", async () => {
    const user = await createUser("auth");
    try {
      const me = await api.get("/users/me", as(user));
      expect(me.username).toBe(user.username);
      expect(me.id).toBe(user.id);

      // Same identity can log back in and get a fresh token pair
      const relogin = await api.post("/auth/login", {
        body: { idToken: user.idToken },
      });
      expect(relogin.accessToken).toBeTruthy();
      expect(relogin.refreshToken).toBeTruthy();

      // The UID alone buys nothing — it is a public value the API hands out in
      // friend lists and search, so it must not be accepted as proof.
      await expect(
        api.post("/auth/login", { body: { uid: user.uid, email: user.email } }),
      ).rejects.toMatchObject({ status: 422 });

      // Nor does a token minted for another Firebase project.
      await expect(
        api.post("/auth/login", {
          body: { idToken: fakeIdToken(user.uid, user.email, { aud: "other-project" }) },
        }),
      ).rejects.toMatchObject({ status: 401 });
    } finally {
      await api.delete("/users/me", as(user));
    }
  });

  test("Session persistence — reload with a saved token goes straight into the app", async ({
    page,
    userA,
  }) => {
    await openApp(page, userA, { checkedInToday: true });
    await expect(page.getByText(userA.username)).toBeVisible();
    await expect(tab(page, "Home")).toBeVisible();

    await page.reload();
    await expect(page.getByText(userA.username)).toBeVisible();
    // A session is never sent to the landing page.
    await page.goto("/");
    await expect(page.getByText(userA.username)).toBeVisible();
    await expect(page).not.toHaveURL(/\/about/);
    // …and one that opens the landing directly is sent back to the app.
    await page.goto("/about");
    await expect(page.getByText(userA.username)).toBeVisible();
    await expect(page).not.toHaveURL(/\/about/);
  });

  test("No token — lands on the landing page", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/about$/);
    await expect(tab(page, "Home")).toBeHidden();
  });

  test("Logout — clears tokens, returns to the landing page", async ({ appA, page }) => {
    await tab(page, "Profile").click();
    await page.locator("#nh-stage button").first().click(); // gear → Settings
    await expect(page.getByText("Settings")).toBeVisible();

    await page.getByRole("button", { name: /Log out/ }).click();

    await expect(page).toHaveURL(/\/about$/, { timeout: 15_000 });
    const stored = await page.evaluate(() => ({
      access: localStorage.getItem("nh_access"),
      cacheKeys: Object.keys(localStorage).filter((k) => k.startsWith("nh_cache_")),
    }));
    expect(stored.access).toBeNull();
    expect(stored.cacheKeys).toHaveLength(0);
  });

  test('Delete account — "DELETE" confirmation → farewell screen → Start over', async ({
    appA,
    page,
    userA,
  }) => {
    await tab(page, "Profile").click();
    await page.locator("#nh-stage button").first().click();

    await page.getByRole("button", { name: /Delete account/ }).click();
    await expect(page.getByText("Delete your account?")).toBeVisible();

    // The confirmation states the grace window rather than promising a deletion
    // that does not happen yet. The backend keeps the row for
    // ACCOUNT_DELETION_GRACE_DAYS and a cron purges it after; saying "forever"
    // here, as this screen used to, was a promise the backend did not keep.
    await expect(page.getByText(/erased for good after \d+ days/)).toBeVisible();

    const confirmDelete = page.getByRole("button", { name: "Delete my account" });
    await expect(confirmDelete).toBeDisabled();

    await page.getByPlaceholder("DELETE").fill("DELETE");
    await expect(confirmDelete).toBeEnabled();
    await confirmDelete.click();

    await expect(page.getByText("Your account is deleted")).toBeVisible();
    await expect(page.getByText(/signing in brings your streak/)).toBeVisible();
    await page.getByRole("button", { name: "Start over" }).click();
    await expect(page).toHaveURL(/\/about$/);

    // Backend-side the account reads as gone to everyone, grace window or not:
    // its still-unexpired access token no longer resolves a profile.
    await expect(api.get("/users/me", as(userA))).rejects.toThrow(/403/);
  });
});

test.describe("Housekeeping", () => {
  test("Throwaway accounts are erased, not just marked deleted", async () => {
    // `DELETE /users/me` is a soft delete — status 2 and a clock — so a suite
    // that only calls it leaves every account it ever made in the database.
    // The sweep in tests/helpers/cleanup.js is what actually removes them, and
    // this is the thing that would quietly stop working.
    const user = await createUser("sweep");
    await api.delete("/users/me", as(user));

    const live = await rowsFor(user.id);
    expect(live, "a soft-deleted account is still a row").toBe(1);

    // Scoped to this account: the whole-database sweep belongs to setup and
    // teardown, and running it here would delete what the parallel workers are
    // in the middle of using.
    await purgeUid(user.id);
    expect(await rowsFor(user.id)).toBe(0);
  });
});
