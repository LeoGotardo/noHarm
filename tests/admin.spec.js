/**
 * TESTING.md → "Admin board"
 *
 * The board is gated by the same `ADMIN_USER_IDS` allowlist as the moderation
 * queue — one probe answers for both — and everything on it is a count or an
 * account's administrative state. What it must never grow is per-account
 * activity: this app is built so that who is struggling cannot be read off a
 * screen, and this is the screen that would undo that by accident.
 */
import { expect, openApp, test } from "./helpers/fixtures.js";
import { api, as, asAdmin, fileReport, startStreak } from "./helpers/api.js";

const openSettings = async (page) => {
  await page.getByRole("button", { name: "Profile" }).first().click();
  await page.locator("#nh-stage button").first().click(); // gear → Settings
};

test.describe("Admin board", () => {
  test("The row is absent for an ordinary account", async ({ appA, page }) => {
    await openSettings(page);

    await expect(page.getByText("Admin board")).toHaveCount(0);
    await expect(page.getByText("Reports")).toHaveCount(0);
  });

  test("A moderator opens it from Settings and sees every panel", async ({ page }) => {
    const admin = await asAdmin();
    await openApp(page, admin, { checkedInToday: true });

    await openSettings(page);
    await page.getByText("Admin board").click();

    for (const heading of [
      "Accounts",
      "Bans and sanctions",
      "Moderation",
      "Health",
      "Suspicious traffic",
    ]) {
      await expect(page.getByText(heading, { exact: false }).first()).toBeVisible();
    }

    // The footer says the numbers are cached rather than implying a fresh read.
    await expect(page.getByText(/cached for a minute/i)).toBeVisible();
  });

  test("The retention jobs report as healthy", async ({ page }) => {
    const admin = await asAdmin();
    await openApp(page, admin, { checkedInToday: true });

    await openSettings(page);
    await page.getByText("Admin board").click();

    // These two are the reason the panel exists: both purge crons fail
    // invisibly, because a deleted account past its window answers "not found"
    // whether it was purged or not. They are also the only health fields a
    // test can assert on — `error_occurrences_24h` is shared, mutable state
    // that other specs in this suite raise on purpose, and asserting zero
    // there would make this test fail for a reason that is the board working.
    // Waited for by the panel's own heading rather than by scanning every div
    // on the page — a `locator("div").filter(...)` resolves against whatever
    // has rendered so far, which under parallel load is not always the panel.
    await expect(page.getByText("Health", { exact: true })).toBeVisible();

    const body = await page.locator("#nh-stage").innerText();
    expect(body).toContain("Accounts past their purge date");
    expect(body).toContain("Report evidence past retention");
    expect(body).not.toContain("The account purge has stopped running.");
    expect(body).not.toContain("The evidence purge has stopped running.");
  });

  test("Self-harm reports are counted on their own", async ({ userA, userB, page }) => {
    const admin = await asAdmin();
    await fileReport(userB, userA, "self_harm", "worried about them");
    await openApp(page, admin, { checkedInToday: true });

    await openSettings(page);
    await page.getByText("Admin board").click();

    // Its own number, not folded into the queue total — a place in the queue is
    // the wrong answer for this one.
    await expect(page.getByText("Self-harm, open")).toBeVisible();
  });

  test("The charts plot every day, including the empty ones", async ({ page }) => {
    const admin = await asAdmin();
    await openApp(page, admin, { checkedInToday: true });

    await openSettings(page);
    await page.getByText("Admin board").click();

    await expect(page.getByText("Sign-ups per day")).toBeVisible();
    await expect(page.getByText("Reports filed per day")).toBeVisible();

    // Two charts rather than one with two y-scales: the measures differ by an
    // order of magnitude, and a second axis would invent a correlation.
    const summaries = await page.getByText(/in 30 days/).count();
    expect(summaries).toBe(2);

    // Days with no rows are still columns. A series with its gaps removed gets
    // drawn as a line through them, which turns a handful of sign-ups in a
    // month into a steady climb.
    const overview = await page.request.get("/api/admin/overview", {
      headers: { Authorization: `Bearer ${admin.accessToken}` },
    });
    const body = await overview.json();
    expect(body.series.signups).toHaveLength(30);
    expect(body.series.reports).toHaveLength(30);
    expect(body.series.signups.some((d) => d.count === 0)).toBe(true);
  });

  test("The period filter scopes the charts, and the cache follows it", async ({
    page,
  }) => {
    const admin = await asAdmin();
    await openApp(page, admin, { checkedInToday: true });

    await openSettings(page);
    await page.getByText("Admin board").click();
    await expect(page.getByText(/in 30 days/).first()).toBeVisible();

    await page.getByRole("button", { name: "7 days" }).click();

    // Everything below the filter re-renders against the same slice, so the
    // numbers always agree with the label above them.
    await expect(page.getByText(/in 7 days/).first()).toBeVisible();
    await expect(page.getByText(/in 30 days/)).toHaveCount(0);

    // The cache is keyed by period. Without that, switching the range hands
    // back the previous window's numbers under the new label.
    for (const [days, expected] of [[7, 7], [90, 90], [45, 30]]) {
      const res = await page.request.get(`/api/admin/overview?days=${days}`, {
        headers: { Authorization: `Bearer ${admin.accessToken}` },
      });
      const body = await res.json();
      expect(body.series.days, `days=${days}`).toBe(expected);
      expect(body.series.signups).toHaveLength(expected);
    }
  });

  test("The comparison chart reads the three inactive states", async ({
    userA,
    page,
  }) => {
    const admin = await asAdmin();
    await api.put(`/users/${userA.id}/suspend`, { ...as(admin), body: { days: null } });

    await openApp(page, admin, { checkedInToday: true });
    await openSettings(page);
    await page.getByText("Admin board").click();

    // Waited for before the text is read: `innerText` taken straight after the
    // click captures the tab bar and nothing else, because the overview is
    // still in flight.
    await expect(page.getByText("Not in use")).toBeVisible();

    // Three nominal categories share one hue: colouring them
    // darker-where-bigger would encode bar length twice and burn the only free
    // channel on what the chart already shows.
    const body = await page.locator("#nh-stage").innerText();
    for (const label of ["Disabled", "Deleted", "Banned"]) {
      expect(body).toContain(label);
    }
  });

  test("Every chart has a table view", async ({ page }) => {
    const admin = await asAdmin();
    await openApp(page, admin, { checkedInToday: true });

    await openSettings(page);
    await page.getByText("Admin board").click();

    // The accessible reading of the same numbers — identity never rests on
    // colour or on being able to see the shape.
    await page.getByRole("button", { name: "Table" }).first().click();
    await expect(page.getByRole("button", { name: "Chart" }).first()).toBeVisible();
  });

  test("The account list shows what the app hides, and nothing about recovery", async ({
    userA,
    page,
  }) => {
    const admin = await asAdmin();
    await startStreak(userA, 12);
    await api.put(`/users/${userA.id}/suspend`, { ...as(admin), body: { days: null } });

    await openApp(page, admin, { checkedInToday: true });

    // The "includes hidden accounts" half is asserted on the API, not the
    // rendered page: the list pages at 25, the suite runs three workers against
    // one database, and which accounts land on page one is not something this
    // test is about.
    // Filtered by status in the query, so this does not depend on how many
    // accounts the rest of the suite created in parallel.
    const listed = await page.request.get("/api/admin/users?status=9&pageSize=100", {
      headers: { Authorization: `Bearer ${admin.accessToken}` },
    });
    const rows = (await listed.json()).items;
    expect(rows.every((row) => row.status === 9)).toBe(true);
    const banned = rows.find((row) => row.id === userA.id);
    expect(banned, "the banned account should be listed").toBeTruthy();
    expect(banned.status).toBe(9);
    // No e-mail, no streak: the row carries administrative state and nothing else.
    expect(Object.keys(banned).sort()).toEqual([
      "banned_until", "created_at", "deleted_at", "id",
      "must_change_username", "picture_blocked", "status", "username",
    ]);

    // And the screen itself never says anything about anyone's recovery.
    await openSettings(page);
    await page.getByText("Admin board").click();
    await page.getByRole("button", { name: "Accounts", exact: true }).click();

    const body = await page.locator("#nh-stage").innerText();
    expect(body.toLowerCase()).not.toContain("streak");
    expect(body.toLowerCase()).not.toContain("clean day");
  });

  test("An ordinary account cannot reach the board by URL state", async ({ appA, page }) => {
    // There is no router, so the only way in is the Settings row — but the
    // screen must also refuse if it is ever reached another way, because the
    // real gate is the backend answering 404.
    const refused = await page.evaluate(async () => {
      const res = await fetch("/api/admin/overview", {
        headers: { Authorization: `Bearer ${localStorage.getItem("nh_access")}` },
      });
      return res.status;
    });

    expect(refused).toBe(404);
  });
});
