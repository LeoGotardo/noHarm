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
import { test, expect, openApp, tab } from "./helpers/fixtures.js";
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
  description: "Cinco dias limpos",
  milestone: 5,
};
/** Far enough that no streak here can reach it. */
const FAR = {
  name: "E2E Far Badge",
  description: "Quinhentos dias limpos",
  milestone: 500,
};

/** Owns the shared catalogue; outlives the per-test throwaway accounts. */
let curator;
let near;
let far;

const openBadges = async (page) => {
  await tab(page, "Badges").click();
  await expect(page.getByText("All milestones")).toBeVisible();
};

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

  test("Badges screen — grid lista o catálogo e conta os ganhos", async ({
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

  test("Badge earned — 10 dias concede o milestone de 5 e não o de 500", async ({
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

    await expect(page.getByText("1 of 2 earned")).toBeVisible();
    // The far badge is the only locked one left
    await expect(page.getByText("Locked")).toHaveCount(1);
  });

  test("Badge locked — streak curto não concede nada", async ({
    page,
    userA,
  }) => {
    await startStreak(userA, 2);
    expect(await listUserBadges(userA)).toHaveLength(0);

    await openApp(page, userA, { checkedInToday: true });
    await openBadges(page);

    await expect(page.getByText("0 of 2 earned")).toBeVisible();
    await expect(page.getByText("Locked")).toHaveCount(2);
  });

  test("Badge detail — abre pelo grid, mostra a descrição e a contagem restante", async ({
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

    await page.locator("#nh-screen button").first().click();
    await expect(page.getByText("All milestones")).toBeVisible();
  });

  test("Badge detail — badge ganho mostra a data da conquista", async ({
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

  test("Next badge — aponta o próximo não ganho com a contagem real", async ({
    page,
    userA,
  }) => {
    await startStreak(userA, 10);
    await openApp(page, userA, { checkedInToday: true });
    await openBadges(page);

    await expect(page.getByText("Next badge")).toBeVisible();
    // Near is already earned, so the card must point at Far: 500 − 10 = 490
    await expect(page.getByText(FAR.name).first()).toBeVisible();
    await expect(page.getByText("490 days to go")).toBeVisible();

    const screen = await page.locator("#nh-screen").innerText();
    expect(screen).not.toMatch(/NaN/);
  });

  test("Home — abaixo do record, a dashboard aponta os dias até o próximo badge", async ({
    page,
    userA,
  }) => {
    // The milestone hint only renders below the personal best, so close a long
    // streak first. Ending one immediately opens a fresh 0-day streak, which is
    // exactly the "below your record" state this needs.
    await startStreak(userA, 30);
    await endStreak(userA);

    await openApp(page, userA, { checkedInToday: true });

    // The 30-day streak earned Near, so Far is next: 500 − 0 days elapsed.
    await expect(page.getByText(`to your ${FAR.name} badge`)).toBeVisible();
    await expect(page.getByText("30 to your record")).toBeVisible();
    const screen = await page.locator("#nh-screen").innerText();
    expect(screen).not.toMatch(/NaN/);
  });

  test("Home — sem record anterior a home mostra 'record territory'", async ({
    page,
    userA,
  }) => {
    // A first streak is always a personal best, so the milestone line is
    // replaced by the record message.
    await startStreak(userA, 3);
    await openApp(page, userA, { checkedInToday: true });

    await expect(page.getByText("You're in record territory")).toBeVisible();
  });

  test("DELETE /badges — remove o badge do catálogo", async ({ userA }) => {
    const probe = await createBadge(curator, {
      name: `${PREFIX}Delete Probe`,
      description: "Badge usado para testar a exclusão",
      milestone: 900,
    });
    expect((await listBadges(userA)).map((b) => b.id)).toContain(probe.id);

    await deleteBadge(probe.id, curator);

    expect((await listBadges(userA)).map((b) => b.id)).not.toContain(probe.id);
  });
});
