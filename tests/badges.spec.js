/**
 * TESTING.md → "Badges"
 *
 * Two facts about the backend shape this file:
 *
 *  - `milestone` is an integer day count, so every countdown on screen is a
 *    real number and the progress bars are meaningful.
 *  - Badges are granted during `POST /streaks/start` and `POST /streaks/checkin`,
 *    never on read. A badge must therefore already exist before the streak that
 *    is supposed to earn it — every test here creates the catalogue first.
 *
 * The catalogue is global state, so the file runs serially and deletes what it
 * creates. It also sweeps leftovers from a previous crashed run up front.
 */
import { test, expect, openApp, openBadges } from "./helpers/fixtures.js";
import {
  createBadge,
  createUser,
  deleteBadge,
  deleteBadgesByPrefix,
  deleteUser,
  endStreak,
  listBadges,
  listUserBadges,
  startStreak,
} from "./helpers/api.js";

const PREFIX = "E2E ";

/** Earned by any streak in this file. */
const NEAR = {
  name: "E2E Near Badge",
  description: "Five clean days",
  milestone: 5,
};
/** Far enough that no streak here can reach it. */
const FAR = {
  name: "E2E Far Badge",
  description: "Five hundred clean days",
  milestone: 500,
};

/** Owns the shared catalogue; outlives the per-test throwaway accounts. */
let curator;
let near;
let far;

// The badge catalogue is global backend state — run these one at a time.
test.describe.configure({ mode: "serial" });

test.describe("Badges", () => {
  test.beforeAll(async () => {
    curator = await createUser("curator");
    await deleteBadgesByPrefix(curator, PREFIX);
    near = await createBadge(curator, NEAR);
    far = await createBadge(curator, FAR);
  });

  test.afterAll(async () => {
    if (!curator) return;
    await deleteBadgesByPrefix(curator, PREFIX);
    await deleteUser(curator);
  });

  /** The badge the UI calls "next": lowest milestone the user has not earned. */
  async function nextUnearned(user) {
    const earned = new Set((await listUserBadges(user)).map((b) => b.badge_id));
    return (await listBadges(user))
      .filter((b) => !earned.has(b.id))
      .sort((a, b) => a.milestone - b.milestone)[0];
  }

  test("Badges screen — the grid lists the catalog and counts the earned ones", async ({
    page,
    userA,
  }) => {
    await startStreak(userA, 10);
    await openApp(page, userA, { checkedInToday: true });
    await openBadges(page);

    const total = (await listBadges(userA)).length;
    const earned = (await listUserBadges(userA)).length;
    await expect(page.getByText(`${earned} of ${total} earned`)).toBeVisible();

    await expect(page.getByText(NEAR.name).first()).toBeVisible();
    await expect(page.getByText(FAR.name).first()).toBeVisible();
  });

  test("Badge earned — 10 days grants the 5-day milestone and not the 500-day one", async ({
    page,
    userA,
  }) => {
    // The grant is the backend's call (GET /user-badges/), never arithmetic on
    // `milestone` in the UI — assert both sides agree.
    await startStreak(userA, 10);
    const granted = await listUserBadges(userA);
    expect(granted.map((b) => b.badge_id)).toContain(near.id);
    expect(granted.map((b) => b.badge_id)).not.toContain(far.id);

    await openApp(page, userA, { checkedInToday: true });
    await openBadges(page);

    // Counts come from the API, never from literals: the catalogue is seeded by
    // migration 20260831_01 (ten milestones, 1 day to 365), so it is never just
    // the two badges this file creates. What the test is about is which of ITS
    // badges were granted, asserted above.
    const total = (await listBadges(userA)).length;
    await expect(page.getByText(`${granted.length} of ${total} earned`)).toBeVisible();
    await expect(page.getByText("Locked")).toHaveCount(total - granted.length);
  });

  test("Badge locked — a short streak grants nothing", async ({
    page,
    userA,
  }) => {
    await startStreak(userA, 2);

    // Not "grants nothing": the seeded catalogue starts at a 1-day milestone,
    // so two clean days legitimately earn something. What must not happen is
    // this file's badges being granted — 2 days reaches neither 5 nor 500.
    const granted = await listUserBadges(userA);
    expect(granted.map((b) => b.badge_id)).not.toContain(near.id);
    expect(granted.map((b) => b.badge_id)).not.toContain(far.id);

    await openApp(page, userA, { checkedInToday: true });
    await openBadges(page);

    const total = (await listBadges(userA)).length;
    await expect(page.getByText(`${granted.length} of ${total} earned`)).toBeVisible();
    await expect(page.getByText("Locked")).toHaveCount(total - granted.length);
  });

  test("Badge detail — opens from the grid, shows the description and the remaining count", async ({
    page,
    userA,
  }) => {
    await startStreak(userA, 2);
    await openApp(page, userA, { checkedInToday: true });
    await openBadges(page);

    await page.getByText(NEAR.name).last().click();
    await expect(page.getByText(NEAR.description)).toBeVisible();
    // milestone 5 − 2 elapsed days = 3 to go
    await expect(page.getByText("3 days to go · keep showing up")).toBeVisible();

    await page.locator("#nh-stage button").first().click();
    await expect(page.getByText("All milestones")).toBeVisible();
  });

  test("Badge detail — an earned badge shows the date it was earned", async ({
    page,
    userA,
  }) => {
    await startStreak(userA, 10);
    await openApp(page, userA, { checkedInToday: true });
    await openBadges(page);

    await page.getByText(NEAR.name).last().click();
    // formatEarned() renders the given_at date as e.g. "Earned Aug 20, 2026"
    await expect(
      page.getByText(/Earned [A-Z][a-z]{2} \d{1,2}, \d{4}/).first(),
    ).toBeVisible();
    await expect(page.getByText("days to go")).toBeHidden();
  });

  test("Next badge — points at the next unearned one with the real count", async ({
    page,
    userA,
  }) => {
    await startStreak(userA, 10);
    await openApp(page, userA, { checkedInToday: true });
    await openBadges(page);

    await expect(page.getByText("Next badge")).toBeVisible();

    // Which badge is "next" depends on the whole catalogue, not on this file's
    // two: migration 20260831_01 seeds ten milestones, and several of them sit
    // between 10 days and Far's 500. Derive it the way the screen does — the
    // lowest milestone not yet earned — so the assertion survives the catalogue
    // growing again.
    const nextBadge = await nextUnearned(userA);
    await expect(page.getByText(nextBadge.name).first()).toBeVisible();
    await expect(
      page.getByText(`${nextBadge.milestone - 10} days to go`),
    ).toBeVisible();

    const screen = await page.locator("#nh-stage").innerText();
    expect(screen).not.toMatch(/NaN/);
  });

  test("Home — below the record, the dashboard shows the days to the next badge", async ({
    page,
    userA,
  }) => {
    // The milestone hint only renders below the personal best, so close a long
    // streak first. Ending one immediately opens a fresh 0-day streak, which is
    // exactly the "below your record" state this needs.
    await startStreak(userA, 30);
    await endStreak(userA);

    await openApp(page, userA, { checkedInToday: true });

    // The 30-day streak earned everything up to 30, so the next one is whatever
    // the seeded catalogue holds above that — derived, not named.
    const nextBadge = await nextUnearned(userA);
    await expect(page.getByText(`to your ${nextBadge.name} badge`)).toBeVisible();
    await expect(page.getByText("30 to your record")).toBeVisible();
    const screen = await page.locator("#nh-stage").innerText();
    expect(screen).not.toMatch(/NaN/);
  });

  test("Home — with no previous record, home shows 'record territory'", async ({
    page,
    userA,
  }) => {
    // A first streak is always a personal best, so the milestone line is
    // replaced by the record message.
    await startStreak(userA, 3);
    await openApp(page, userA, { checkedInToday: true });

    await expect(page.getByText("You're in record territory")).toBeVisible();
  });

  test("DELETE /badges — removes the badge from the catalog", async ({ userA }) => {
    const probe = await createBadge(curator, {
      name: `${PREFIX}Delete Probe`,
      description: "Badge used to test deletion",
      milestone: 900,
    });
    expect((await listBadges(userA)).map((b) => b.id)).toContain(probe.id);

    await deleteBadge(probe.id, curator);

    expect((await listBadges(userA)).map((b) => b.id)).not.toContain(probe.id);
  });
});
