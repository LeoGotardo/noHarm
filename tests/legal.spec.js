/**
 * TESTING.md → "Legal & consent"
 *
 * The consent machinery decides whether an account gets into the app at all,
 * and one of its buttons deletes every streak the account has. Both halves are
 * covered here: the API contract, and the two screens that drive it.
 *
 * The documents' *text* is deliberately not asserted — it is a placeholder
 * today and will be rewritten. What is asserted is the plumbing around it:
 * which version is in force, what is owed, and what happens when it is given
 * or taken back.
 */
import { expect, openApp, test } from "./helpers/fixtures.js";
import { api, as, currentStreak, deleteUser, fakeIdToken, startStreak } from "./helpers/api.js";

const MIN_AGE_BIRTHDATE = "1990-06-15";

test.describe("Consent — the contract", () => {
  test("Registration is refused without the two binding consents", async () => {
    const uid = `e2e-noconsent-${Date.now().toString(36)}`;
    const body = {
      idToken: fakeIdToken(uid, `${uid}@e2e-noharm.example.com`),
      username: uid,
      birthDate: MIN_AGE_BIRTHDATE,
      acceptedTerms: false,
      acceptedPrivacy: true,
      healthDataConsent: false,
    };

    await expect(api.post("/auth/register", { body })).rejects.toMatchObject({
      status: 400,
    });
  });

  test("Registration is refused below the minimum age", async () => {
    const uid = `e2e-young-${Date.now().toString(36)}`;
    const thisYear = new Date().getFullYear();
    await expect(
      api.post("/auth/register", {
        body: {
          idToken: fakeIdToken(uid, `${uid}@e2e-noharm.example.com`),
          username: uid,
          // Old enough to type, not old enough to hold an account.
          birthDate: `${thisYear - 12}-01-01`,
          acceptedTerms: true,
          acceptedPrivacy: true,
          healthDataConsent: false,
        },
      }),
    ).rejects.toMatchObject({ status: 403 });
  });

  test("A fresh account owes nothing, and its consents are on record", async ({
    userA,
  }) => {
    const me = await api.get("/users/me", as(userA));
    expect(me.pending_consents).toEqual([]);
    expect(me.health_data_consent).toBe(true);

    const status = await api.get("/users/me/consents", as(userA));
    // The version stored is the one the server had in force, never one the
    // client named — that is what makes the record mean anything.
    expect(Object.keys(status.versions).sort()).toEqual([
      "health_data",
      "privacy",
      "terms",
    ]);
    const documents = status.consents.map((c) => c.document).sort();
    expect(documents).toEqual(["health_data", "privacy", "terms"]);
    for (const consent of status.consents) {
      expect(consent.version).toBe(status.versions[consent.document]);
      expect(consent.withdrawn_at ?? null).toBeNull();
    }
  });

  test("Declining health data leaves the app usable and the tracker closed", async () => {
    const uid = `e2e-nohealth-${Date.now().toString(36)}`;
    const registered = await api.post("/auth/register", {
      body: {
        idToken: fakeIdToken(uid, `${uid}@e2e-noharm.example.com`),
        username: uid,
        birthDate: MIN_AGE_BIRTHDATE,
        acceptedTerms: true,
        acceptedPrivacy: true,
        healthDataConsent: false,
      },
    });
    const user = { id: uid, accessToken: registered.accessToken, refreshToken: registered.refreshToken };

    const me = await api.get("/users/me", as(user));
    // Never given is an answer. The gate must not reappear for it.
    expect(me.pending_consents).toEqual([]);
    expect(me.health_data_consent).toBe(false);

    await expect(
      api.post("/streaks/start", { ...as(user), body: {} }),
    ).rejects.toMatchObject({ status: 403 });

    await deleteUser(user);
  });

  test("Withdrawing health consent deletes every streak, and is idempotent", async ({
    userA,
  }) => {
    await startStreak(userA, 9);
    expect(await currentStreak(userA)).toBeTruthy();

    const withdrawn = await api.delete("/users/me/consents/health", as(userA));
    expect(withdrawn.withdrawn).toBe(true);
    expect(withdrawn.streaks_deleted).toBeGreaterThan(0);

    const me = await api.get("/users/me", as(userA));
    expect(me.health_data_consent).toBe(false);
    // Withdrawal that leaves the data behind is not withdrawal.
    expect(me.pending_consents).toEqual([]);

    // The record of the withdrawal survives — it is the only evidence it was
    // honoured.
    const status = await api.get("/users/me/consents", as(userA));
    const health = status.consents.find((c) => c.document === "health_data");
    expect(health.withdrawn_at).toBeTruthy();

    // Again: nothing left to delete, and no error.
    const again = await api.delete("/users/me/consents/health", as(userA));
    expect(again.withdrawn).toBe(false);
    expect(again.streaks_deleted).toBe(0);
  });

  test("Export carries the account's own data and not other people's reports", async ({
    userA,
    userB,
  }) => {
    await api.post(`/reports/${userA.id}`, {
      ...as(userB),
      body: { reason: "spam", details: "a complaint about userA" },
    });

    const dump = await api.get("/users/me/export", as(userA));
    expect(dump.profile.id).toBe(userA.id);
    expect(Array.isArray(dump.consents)).toBe(true);

    // Handing someone the reports filed against them names the reporter and
    // breaks the promise the whole moderation surface rests on.
    const blob = JSON.stringify(dump);
    expect(blob).not.toContain("a complaint about userA");
    expect(blob).not.toContain(userB.id);
  });
});

test.describe("Consent — the screens", () => {
  test("A stale consent version shows the gate instead of the app", async ({
    page,
    userA,
  }) => {
    await openApp(page, userA, { checkedInToday: true });
    await expect(page.getByText("Begin your journey")).toBeVisible();

    // Simulate a republished document. The server is what decides this, so
    // the test drives the exact field the server sets rather than reaching
    // into the app's state.
    await page.route("**/users/me", async (route) => {
      const res = await route.fetch();
      const body = await res.json();
      body.pending_consents = ["terms"];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    });
    await page.reload();

    // Instead of the app, not beside it: the gate is the whole screen and the
    // navigation is gone.
    await expect(page.getByText("Before you continue")).toBeVisible();
    await expect(page.getByRole("button", { name: "Home" })).toBeHidden();
  });

  test("Withdrawing tracking turns the dashboard honest, not broken", async ({
    userA,
    page,
  }) => {
    await startStreak(userA, 4);
    await api.delete("/users/me/consents/health", as(userA));
    await openApp(page, userA, { checkedInToday: true });

    // "Start my streak" here would be a button whose only possible answer is
    // 403: the consent it needs is the one that was just withdrawn.
    await expect(page.getByText("Tracking is off")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Start my streak" }),
    ).toHaveCount(0);

    // It says what it cost, and offers the way back through the screen that
    // explains what is being agreed to.
    await expect(page.getByText(/cannot be brought back/i)).toBeVisible();
    await page.getByRole("button", { name: /Turn tracking back on/ }).click();
    await expect(page.getByText("Privacy Policy").first()).toBeVisible();
  });

  test("Crisis resources — reachable from Settings, and dialable", async ({
    appA,
    page,
  }) => {
    await page.getByRole("button", { name: "Profile" }).first().click();
    await page.locator("#nh-stage button").first().click(); // gear → Settings
    await page.getByText("Crisis resources").click();

    // The clause the Terms point at, and the numbers behind it.
    await expect(page.getByText(/not treatment/i)).toBeVisible();
    await expect(page.getByText("CVV")).toBeVisible();
    await expect(page.locator('a[href="tel:188"]')).toBeVisible();
    await expect(page.locator('a[href="tel:192"]')).toBeVisible();
  });

  test("Privacy & data — documents, health consent and the export button", async ({
    appA,
    page,
  }) => {
    await page.getByRole("button", { name: "Profile" }).first().click();
    await page.locator("#nh-stage button").first().click();
    await page.getByText("Privacy & data").click();

    // Both documents are listed. `.first()` because the screen also names
    // them in its explanatory copy.
    await expect(page.getByText("Terms of Use").first()).toBeVisible();
    await expect(page.getByText("Privacy Policy").first()).toBeVisible();

    // The document opens as the same screen the gate shows.
    await page.getByText("Terms of Use").first().click();
    await expect(page.getByText(/not been written yet/i).first()).toBeVisible();
  });
});
