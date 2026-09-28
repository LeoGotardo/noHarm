/**
 * TESTING.md → "Moderation"
 *
 * What a moderator can do once a report exists: take it, decide it, and act on
 * the account. All of it is admin-only and none of it has a screen in the app,
 * so this runs at the API level against the real backend — the same boundary
 * `reports.spec.js` uses for the contract half of reporting.
 *
 * The login screen's copy for a suspended account cannot be reached from here:
 * it is behind the Google popup, which Google blocks under automation. That row
 * stays manual in TESTING.md.
 */
import { test, expect, openApp, tab } from "./helpers/fixtures.js";
import {
  api,
  as,
  asAdmin,
  asSecondAdmin,
  fakeIdToken,
  fileReport,
  makeFriends,
  myNotices,
  sendMessage,
  warnUser,
} from "./helpers/api.js";

const login = (user) => api.post("/auth/login", { body: { idToken: user.idToken } });

test.describe("Moderation", () => {
  test("Suspension — refused with the date, and the app is told when it ends", async ({
    userA,
  }) => {
    const admin = await asAdmin();

    const suspended = await api.put(`/users/${userA.id}/suspend`, {
      ...as(admin),
      body: { days: 3, reason: "harassment" },
    });
    expect(suspended.status).toBe(9);
    expect(suspended.banned_until).toBeTruthy();
    // No profile in the answer: "is this account banned, until when" needs
    // neither a username nor an e-mail.
    expect(Object.keys(suspended).sort()).toEqual(["banned_until", "id", "status"]);

    await expect(login(userA)).rejects.toMatchObject({ status: 403 });
    const refusal = await login(userA).catch((e) => e);
    expect(refusal.body.errorCode).toBe("ACCOUNT_SUSPENDED");
    expect(refusal.body.details.suspendedUntil).toBeTruthy();

    // The token they already held stops working too — it outlives the
    // suspension by up to 15 minutes otherwise.
    await expect(api.get("/users/me", as(userA))).rejects.toMatchObject({ status: 403 });
  });

  // ── name and picture sanctions ──────────────────────────────────────────────
  //
  // The two reports this app actually gets about a *profile*: a handle
  // impersonating someone, and a photo that should not be beside a recovery
  // conversation. A ban is far too much for either and a warning far too
  // little — it leaves the thing exactly where it is.

  test("Username reset — the name goes now, and the account owes a new one", async ({
    userA,
  }) => {
    const admin = await asAdmin();
    const before = await api.get("/users/me", as(userA));

    const sanctioned = await api.put(`/users/${userA.id}/username/reset`, {
      ...as(admin),
      body: { reason: "impersonation" },
    });

    // Renamed immediately, not asked to fix it: the harm is the name being
    // readable, and a flag alone leaves it on every friend list until the
    // user next signs in.
    expect(sanctioned.username).not.toBe(before.username);
    expect(sanctioned.username).toMatch(/^user_[0-9a-f]{8}$/);
    expect(sanctioned.must_change_username).toBe(true);
    // No e-mail in the answer, for the same reason a suspension carries none.
    expect(Object.keys(sanctioned).sort()).toEqual([
      "id",
      "must_change_username",
      "picture_blocked",
      "username",
    ]);

    // The account still works. That is the whole point of not banning it.
    const me = await api.get("/users/me", as(userA));
    expect(me.username).toBe(sanctioned.username);
    expect(me.must_change_username).toBe(true);

    // Choosing a name is what lifts it — nothing else does.
    const chosen = `renamed${Date.now() % 1000000}`;
    await api.put("/users/me", { ...as(userA), body: { username: chosen } });
    const after = await api.get("/users/me", as(userA));
    expect(after.username).toBe(chosen);
    expect(after.must_change_username).toBe(false);
  });

  test("Picture block — removed, refused, and not restored by the next login", async ({
    userA,
  }) => {
    const admin = await asAdmin();

    const blocked = await api.put(`/users/${userA.id}/picture/block`, {
      ...as(admin),
      body: { reason: "inappropriate" },
    });
    expect(blocked.picture_blocked).toBe(true);

    // The user cannot put one back.
    await expect(
      api.put("/users/me", {
        ...as(userA),
        body: { profile_picture: "https://lh3.googleusercontent.com/x" },
      }),
    ).rejects.toMatchObject({ status: 403 });

    // Nor can signing in again: login refreshes the photo from the Google
    // claim, which is exactly the path that would undo the decision silently.
    await login(userA);
    const me = await api.get("/users/me", as(userA));
    expect(me.profile_picture ?? null).toBeNull();
    expect(me.picture_blocked).toBe(true);

    // Lifting it restores nothing, and stops refusing.
    const lifted = await api.put(`/users/${userA.id}/picture/unblock`, {
      ...as(admin),
      body: {},
    });
    expect(lifted.picture_blocked).toBe(false);
  });

  test("Both sanctions say why, and neither names the reporter", async ({
    userA,
    userB,
  }) => {
    const admin = await asAdmin();
    await fileReport(userB, userA, "impersonation", "that is my name");

    await api.put(`/users/${userA.id}/username/reset`, {
      ...as(admin),
      body: { reason: "impersonation", message: "Pick a name that isn't someone else's." },
    });
    await api.put(`/users/${userA.id}/picture/block`, {
      ...as(admin),
      body: { reason: "inappropriate" },
    });

    const notices = await myNotices(userA);
    const kinds = (notices.notices ?? []).map((n) => n.kind).sort();
    expect(kinds).toEqual(["picture", "rename"]);

    // The one rule every notice keeps: the conduct, never the complainant.
    const blob = JSON.stringify(notices);
    expect(blob).not.toContain(userB.id);
    expect(blob).not.toContain(userB.username ?? "\u0000never");
  });

  test("Sanctions are admin-only, and not usable on yourself", async ({
    userA,
    userB,
  }) => {
    // An ordinary caller gets 404, not 403: these routes do not confirm they
    // exist to someone who cannot use them.
    await expect(
      api.put(`/users/${userB.id}/username/reset`, { ...as(userA), body: {} }),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      api.put(`/users/${userB.id}/picture/block`, { ...as(userA), body: {} }),
    ).rejects.toMatchObject({ status: 404 });

    const admin = await asAdmin();
    await expect(
      api.put(`/users/${admin.id}/username/reset`, { ...as(admin), body: {} }),
    ).rejects.toMatchObject({ status: 400 });
  });

  test("The queue names the reporter, and /reports/mine never does", async ({
    userA,
    userB,
  }) => {
    const admin = await asAdmin();
    await fileReport(userB, userA, "impersonation", "using my photo");

    const queue = await api.get("/reports", as(admin));
    const row = queue.reports.find((r) => r.reported_uid === userA.id);
    // A moderator cannot weigh a complaint against an account without knowing
    // whether the same person filed the last four — an id does not tell them.
    expect(row.reporter_username).toBeTruthy();
    expect(row.reporter).toBe(userB.id);

    // The reporter's own list learns nothing new: the promise of anonymity is
    // owed to the reported user, and this is the model that keeps it.
    const mine = await api.get("/reports/mine", as(userB));
    expect(mine.reports[0]).not.toHaveProperty("reporter_username");
  });

  test("Suspension — lifting it by hand lets them back in", async ({ userA }) => {
    const admin = await asAdmin();
    await api.put(`/users/${userA.id}/suspend`, { ...as(admin), body: { days: 30 } });

    await api.put(`/users/${userA.id}/status/1`, as(admin));

    const back = await login(userA);
    expect(back.accessToken).toBeTruthy();
  });

  test("Suspension — a permanent ban says banned, with no date", async ({ userA }) => {
    const admin = await asAdmin();
    const banned = await api.put(`/users/${userA.id}/suspend`, {
      ...as(admin),
      body: { days: null },
    });
    expect(banned.banned_until).toBeNull();

    const refusal = await login(userA).catch((e) => e);
    expect(refusal.body.errorCode).toBe("ACCOUNT_BANNED");
  });

  test("Suspension — not something an ordinary user can do", async ({ userA, userB }) => {
    await expect(
      api.put(`/users/${userB.id}/suspend`, { ...as(userA), body: { days: 7 } }),
    ).rejects.toMatchObject({ status: 404 });

    // And a moderator cannot suspend themselves out of the allowlist.
    const admin = await asAdmin();
    await expect(
      api.put(`/users/${admin.id}/suspend`, { ...as(admin), body: { days: 1 } }),
    ).rejects.toMatchObject({ status: 400 });
  });

  test("Queue — claiming a report keeps a second moderator off it", async ({
    userA,
    userB,
  }) => {
    const admin = await asAdmin();
    const other = await asSecondAdmin();
    const report = await fileReport(userA, userB, "harassment");

    const claimed = await api.post(`/reports/${report.id}/claim`, as(admin));
    expect(claimed.locked_by).toBe(admin.id);

    // The collision this exists for: two moderators reading the same private
    // conversation and punishing the same account twice.
    await expect(
      api.post(`/reports/${report.id}/claim`, as(other)),
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      api.put(`/reports/${report.id}/resolve/accepted`, as(other)),
    ).rejects.toMatchObject({ status: 409 });

    // The holder decides it, and the lock goes with the decision.
    const resolved = await api.put(`/reports/${report.id}/resolve/accepted`, as(admin));
    expect(resolved.status).toBe(5);

    const queue = await api.get("/reports", as(admin));
    const row = queue.reports.find((r) => r.id === report.id);
    expect(row.locked_by).toBeNull();
  });

  test("Queue — releasing puts a report back without deciding it", async ({
    userA,
    userB,
  }) => {
    const admin = await asAdmin();
    const other = await asSecondAdmin();
    const report = await fileReport(userA, userB, "spam");

    await api.post(`/reports/${report.id}/claim`, as(admin));
    const released = await api.delete(`/reports/${report.id}/claim`, as(admin));
    expect(released.locked_by).toBeNull();
    expect(released.status).toBe(4); // still open

    const taken = await api.post(`/reports/${report.id}/claim`, as(other));
    expect(taken.locked_by).toBe(other.id);
  });

  test("Queue — the reporter is never told who is reading their report", async ({
    userA,
    userB,
  }) => {
    const admin = await asAdmin();
    const report = await fileReport(userA, userB, "inappropriate");
    await api.post(`/reports/${report.id}/claim`, as(admin));

    const mine = await api.get("/reports/mine", as(userA));
    expect(mine.reports[0].id).toBe(report.id);
    expect(mine.reports[0]).not.toHaveProperty("locked_by");
  });

  test("Resolving a report never touches the account by itself", async ({
    userA,
    userB,
  }) => {
    const admin = await asAdmin();
    const report = await fileReport(userA, userB, "harassment");

    await api.put(`/reports/${report.id}/resolve/accepted`, as(admin));

    // Closing a complaint and punishing someone are two decisions: the
    // reported account is still exactly as it was.
    const stillFine = await api.post("/auth/login", {
      body: { idToken: fakeIdToken(userB.id, userB.email) },
    });
    expect(stillFine.accessToken).toBeTruthy();
  });
});

test.describe("Moderation screen", () => {
  const openSettings = async (page) => {
    await tab(page, "Profile").click();
    await expect(page.getByText("Member since")).toBeVisible();
    // The gear is the profile header's only button.
    await page.locator("#nh-stage button").first().click();
    await expect(page.getByText("Appearance")).toBeVisible();
  };

  const openQueue = async (page) => {
    await openSettings(page);
    await page.getByText("Reports").click();
    await expect(page.getByRole("button", { name: "Open" })).toBeVisible();
  };

  test("The entry point exists only for a moderator", async ({ page, userA }) => {
    await openApp(page, userA, { checkedInToday: true });
    await openSettings(page);

    // Not a hidden feature with a locked door — the row is simply not there,
    // and every endpoint behind it answers 404 to this account.
    await expect(page.getByText("Moderation")).toHaveCount(0);
    await expect(page.getByText("Danger zone")).toBeVisible();
  });

  test("Queue → report → evidence → dismiss", async ({ page, userA, userB }) => {
    const admin = await asAdmin();
    await makeFriends(userA, userB);
    const first = await sendMessage(userB, { to: userA, content: "you should just give up" });
    await sendMessage(userA, { chatId: first.chat, content: "please stop" });

    const report = await api.post(`/reports/${userB.id}`, {
      ...as(userA),
      body: { reason: "harassment", details: "they will not stop", chatId: first.chat },
    });

    await openApp(page, admin, { checkedInToday: true });
    await openQueue(page);

    // The queue names the account as it was when the report was filed.
    const row = page.getByText(userB.username);
    await expect(row).toBeVisible({ timeout: 15_000 });
    await row.click();

    // The report, then the conversation behind it — both sides, in order.
    await expect(page.getByText("Harassment or bullying")).toBeVisible();
    await expect(page.getByText("“they will not stop”")).toBeVisible();
    await expect(page.getByText("you should just give up")).toBeVisible();
    await expect(page.getByText("please stop")).toBeVisible();
    await expect(page.getByText(/logged/)).toBeVisible();

    // Opening it claimed it, so a second moderator is told someone is on it.
    const other = await asSecondAdmin();
    await expect(
      api.post(`/reports/${report.id}/claim`, as(other)),
    ).rejects.toMatchObject({ status: 409 });

    await page.getByRole("button", { name: "Dismiss" }).click();
    await expect(page.getByText("Report dismissed")).toBeVisible();

    const after = await api.get(`/reports/${report.id}`, as(admin));
    expect(after.status).toBe(6);
    // Decided, so nobody holds it any more.
    expect(after.locked_by ?? null).toBeNull();
  });

  test("Leaving without deciding hands the report back", async ({ page, userA, userB }) => {
    const admin = await asAdmin();
    const other = await asSecondAdmin();
    const report = await fileReport(userA, userB, "spam");

    await openApp(page, admin, { checkedInToday: true });
    await openQueue(page);

    await page.getByText(userB.username).click();
    await expect(page.getByText("Spam or scams")).toBeVisible();

    // Back out of the report — a lock nobody holds is a report nobody else can
    // touch for half an hour.
    await page.locator("#nh-stage button").first().click();
    await expect(page.getByRole("button", { name: "Open" })).toBeVisible();

    // The release is a request in flight as the screen pops, so poll rather
    // than assume it landed before the click returned. A 409 here means it is
    // still held — that is the "not yet", not a failure.
    await expect
      .poll(
        async () => {
          try {
            const taken = await api.post(`/reports/${report.id}/claim`, as(other));
            return taken.locked_by;
          } catch {
            return null;
          }
        },
        { timeout: 10_000 },
      )
      .toBe(other.id);
  });

  test("Suspending from the report locks the account out", async ({
    page,
    userA,
    userB,
  }) => {
    const admin = await asAdmin();
    const report = await fileReport(userA, userB, "harassment");

    await openApp(page, admin, { checkedInToday: true });
    await openQueue(page);
    await page.getByText(userB.username).click();

    await page.getByRole("button", { name: /Suspend this account/ }).click();
    await expect(page.getByText(/never told|cannot sign in until it ends/)).toBeVisible();
    await page.getByRole("button", { name: /7 days/ }).click();
    await page.getByRole("button", { name: "Suspend", exact: true }).click();

    await expect(page.getByText(/suspended for 7 days/)).toBeVisible();

    const refusal = await api
      .post("/auth/login", { body: { idToken: userB.idToken } })
      .catch((e) => e);
    expect(refusal.body.errorCode).toBe("ACCOUNT_SUSPENDED");

    // And the report is still open: suspending is not deciding.
    expect((await api.get(`/reports/${report.id}`, as(admin))).status).toBe(4);
  });
});

test.describe("Moderation notices", () => {
  test("A warning is shown on the next open and acknowledged once", async ({
    page,
    userA,
    userB,
  }) => {
    const admin = await asAdmin();
    await warnUser(admin, userA, "harassment", "Please keep it civil.");

    await openApp(page, userA, { checkedInToday: true });

    // Said in the person's own terms, with the moderator's note under it.
    await expect(page.getByText("A message you sent was reported")).toBeVisible();
    await expect(page.getByText("Please keep it civil.")).toBeVisible();
    // The rung's whole point: nothing happened to the account.
    await expect(page.getByText(/Nothing has changed about your account/)).toBeVisible();
    // And there is somewhere to argue.
    await expect(page.getByText(/If you think this was a mistake/)).toBeVisible();

    // It never says who reported them.
    await expect(page.getByText(userB.username)).toHaveCount(0);

    await page.getByRole("button", { name: "I understand" }).click();
    await expect(page.getByText("A message you sent was reported")).toHaveCount(0);
    expect((await myNotices(userA, true)).total).toBe(0);

    // Gone for good: a reload does not show it again.
    await page.reload();
    await expect(tab(page, "Home")).toBeVisible();
    await expect(page.getByText("A message you sent was reported")).toHaveCount(0);
  });

  test("A warning does not touch the account", async ({ userA }) => {
    const admin = await asAdmin();
    await warnUser(admin, userA, "spam");

    // Still signs in, still reads their own profile — which is what makes a
    // warning something a moderator will actually use.
    const login = await api.post("/auth/login", { body: { idToken: userA.idToken } });
    expect(login.accessToken).toBeTruthy();
    expect((await api.get("/users/me", as(userA))).id).toBe(userA.id);
  });

  test("A report about someone's safety is never answered with a warning", async ({
    userA,
  }) => {
    const admin = await asAdmin();
    const refusal = await api
      .post(`/users/${userA.id}/warn`, { ...as(admin), body: { reason: "self_harm" } })
      .catch((e) => e);

    expect(refusal.status).toBe(400);
    expect(refusal.body.message).toMatch(/crisis/i);
    expect((await myNotices(userA)).total).toBe(0);
  });

  test("Warning from the report screen — the ladder's first rung", async ({
    page,
    userA,
    userB,
  }) => {
    const admin = await asAdmin();
    const report = await fileReport(userA, userB, "harassment");

    await openApp(page, admin, { checkedInToday: true });
    await tab(page, "Profile").click();
    await expect(page.getByText("Member since")).toBeVisible();
    await page.locator("#nh-stage button").first().click();
    await page.getByText("Reports").click();
    await page.getByText(userB.username).click();

    await page.getByRole("button", { name: /Send a warning/ }).click();
    await expect(page.getByText(/Never name who reported them/)).toBeVisible();
    await page
      .getByPlaceholder("Anything to add, in your words? (optional)")
      .fill("First and only time.");
    await page.getByRole("button", { name: "Send warning" }).click();
    await expect(page.getByText("Warning sent")).toBeVisible();

    const waiting = await myNotices(userB, true);
    expect(waiting.total).toBe(1);
    expect(waiting.notices[0]).toMatchObject({
      kind: "warning",
      reason: "harassment",
      message: "First and only time.",
    });

    // A warning is not a decision about the report: that stays open until the
    // moderator closes it.
    expect((await api.get(`/reports/${report.id}`, as(admin))).status).toBe(4);
  });

  test("A suspension explains itself when the account comes back", async ({
    page,
    userA,
  }) => {
    const admin = await asAdmin();
    await api.put(`/users/${userA.id}/suspend`, {
      ...as(admin),
      body: { days: 3, reason: "spam", message: "Three days. Come back calmer." },
    });
    // Lifted early, as a moderator would — the notice is what waits for them.
    await api.put(`/users/${userA.id}/status/1`, as(admin));
    const back = await api.post("/auth/login", { body: { idToken: userA.idToken } });

    await openApp(page, { ...userA, accessToken: back.accessToken, refreshToken: back.refreshToken }, {
      checkedInToday: true,
    });

    await expect(page.getByText("Something you posted was reported")).toBeVisible();
    await expect(page.getByText("Three days. Come back calmer.")).toBeVisible();
    await expect(
      page.getByText(/Your streak and your friends are exactly where you left them/),
    ).toBeVisible();
  });
});
