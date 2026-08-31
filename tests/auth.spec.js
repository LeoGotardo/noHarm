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

test.describe("Auth / Onboarding", () => {
  test('Splash — "Get started" abre Register, "I already have an account" abre Login', async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByText("One clean day at a time.")).toBeVisible();

    await page.getByRole("button", { name: "Get started" }).click();
    await expect(page.getByText("Create account")).toBeVisible();
    await expect(page.getByPlaceholder("3–50 characters")).toBeVisible();

    // Back → splash
    await page.locator("#nh-screen button").first().click();
    await expect(page.getByRole("button", { name: "Get started" })).toBeVisible();

    await page.getByRole("button", { name: "I already have an account" }).click();
    await expect(page.getByText("Good to see you again")).toBeVisible();

    await page.locator("#nh-screen button").first().click();
    await expect(page.getByRole("button", { name: "Get started" })).toBeVisible();
  });

  test("Register — validação de username (mín. 3 chars) libera o botão Google", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Get started" }).click();

    const field = page.getByPlaceholder("3–50 characters");
    await field.fill("ab");
    await expect(page.getByText("At least 3 characters.")).toBeVisible();

    await field.fill("recovering_sam");
    await expect(page.getByText("This is how friends will find you.")).toBeVisible();
  });

  test("Register/Login via API — cria conta, emite JWT e resolve /users/me", async () => {
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

  test("Persistência de sessão — reload com token salvo entra direto no app", async ({
    page,
    userA,
  }) => {
    await openApp(page, userA, { checkedInToday: true });
    await expect(page.getByText(userA.username)).toBeVisible();
    await expect(tab(page, "Home")).toBeVisible();

    await page.reload();
    await expect(page.getByText(userA.username)).toBeVisible();
    await expect(page.getByRole("button", { name: "Get started" })).toBeHidden();
  });

  test("Sem token — cai no splash", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Get started" })).toBeVisible();
    await expect(tab(page, "Home")).toBeHidden();
  });

  test("Logout — limpa tokens, volta ao splash", async ({ appA, page }) => {
    await tab(page, "Profile").click();
    await page.locator("#nh-screen button").first().click(); // gear → Settings
    await expect(page.getByText("Settings")).toBeVisible();

    await page.getByRole("button", { name: /Log out/ }).click();

    await expect(page.getByRole("button", { name: "Get started" })).toBeVisible({
      timeout: 15_000,
    });
    const stored = await page.evaluate(() => ({
      access: localStorage.getItem("nh_access"),
      cacheKeys: Object.keys(localStorage).filter((k) => k.startsWith("nh_cache_")),
    }));
    expect(stored.access).toBeNull();
    expect(stored.cacheKeys).toHaveLength(0);
  });

  test('Delete account — confirmação "DELETE" → tela "Your account is gone" → Start over', async ({
    appA,
    page,
    userA,
  }) => {
    await tab(page, "Profile").click();
    await page.locator("#nh-screen button").first().click();

    await page.getByRole("button", { name: /Delete account/ }).click();
    await expect(page.getByText("Delete your account?")).toBeVisible();

    const deleteForever = page.getByRole("button", { name: "Delete forever" });
    await expect(deleteForever).toBeDisabled();

    await page.getByPlaceholder("DELETE").fill("DELETE");
    await expect(deleteForever).toBeEnabled();
    await deleteForever.click();

    await expect(page.getByText("Your account is gone")).toBeVisible();
    await page.getByRole("button", { name: "Start over" }).click();
    await expect(page.getByRole("button", { name: "Get started" })).toBeVisible();

    // Backend-side the account is gone and its still-unexpired access token no
    // longer resolves a profile.
    await expect(api.get("/users/me", as(userA))).rejects.toThrow(/403/);
  });
});
