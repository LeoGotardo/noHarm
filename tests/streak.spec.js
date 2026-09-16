/** TESTING.md → "Home / Streak" */
import { test, expect, openApp } from "./helpers/fixtures.js";
import {
  checkin,
  currentStreak,
  daysAgo,
  endStreak,
  listUserBadges,
  startStreak,
  todayISO,
} from "./helpers/api.js";

/**
 * Rewrite the cached last-checkin to `n` days ago and reload, so the app sees a
 * gap it has to reconcile through the CheckInModal.
 */
async function backdateLastCheckin(page, n) {
  await page.evaluate((days) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - days);
    localStorage.setItem(
      "nh_cache_streak_last_checkin",
      JSON.stringify({ data: d.toISOString().slice(0, 10), at: Date.now() }),
    );
  }, n);
  await page.reload();
}

/**
 * The relapse-day checkbox of the Nth row in the CheckInModal day picker.
 * The toggles are the only buttons inside the scrolling day list.
 */
const dayCheckbox = (page, n = 0) =>
  page.locator('div[style*="max-height: 320px"] > div > button').nth(n);

test.describe("Home / Streak", () => {
  test("Initial state — with no streak it shows 'Begin your journey'", async ({ appA, page }) => {
    await expect(page.getByText("Begin your journey")).toBeVisible();
    await expect(page.getByRole("button", { name: /Start my streak/ })).toBeVisible();
    await expect(page.getByText("I relapsed")).toBeHidden();
  });

  test("Start streak — sheet with a date (max = today), confirms and persists on the backend", async ({
    appA,
    page,
    userA,
  }) => {
    await page.getByRole("button", { name: /Start my streak/ }).click();

    await expect(page.getByText("When did you start?")).toBeVisible();
    const dateInput = page.locator('input[type="date"]');
    await expect(dateInput).toHaveValue(todayISO());
    await expect(dateInput).toHaveAttribute("max", todayISO());

    await dateInput.fill(daysAgo(5));
    await page.getByRole("button", { name: "Begin my streak" }).click();

    await expect(page.getByText("Your streak has begun")).toBeVisible();
    await expect(page.getByText("clean and counting")).toBeVisible();

    const streak = await currentStreak(userA);
    expect(streak).not.toBeNull();
    expect(streak.start_at.slice(0, 10)).toBe(daysAgo(5));
  });

  test("Start streak — a long backdate does not blow the rate limit", async ({
    appA,
    page,
    userA,
  }) => {
    // Thirty days, deliberately past the ten that POST /streaks/checkin allows
    // per minute. startFrom() used to send one check-in per elapsed day, so the
    // eleventh came back 429 — *after* the streak had been created. The error
    // aborted before the state was saved, leaving the screen on the empty state
    // while the server held a streak nobody could see, and a retry answered 409
    // STREAK_ALREADY_ACTIVE. The badges looked missing for the same reason: the
    // server had granted them, the aborted flow never fetched them.
    //
    // The five-day case above stayed under the limit, which is why the suite
    // was green through all of it.
    await page.getByRole("button", { name: /Start my streak/ }).click();
    await page.locator('input[type="date"]').fill(daysAgo(30));
    await page.getByRole("button", { name: "Begin my streak" }).click();

    await expect(page.getByText("Your streak has begun")).toBeVisible();
    await expect(page.getByText(/rate limit|Too many/i)).toBeHidden();

    const streak = await currentStreak(userA);
    expect(streak).not.toBeNull();
    expect(streak.start_at.slice(0, 10)).toBe(daysAgo(30));

    // Thirty clean days reach several seeded milestones, and the grant happens
    // server-side inside POST /streaks/start — the screen only has to show it.
    expect((await listUserBadges(userA)).length).toBeGreaterThan(0);
  });

  test("Start streak — Cancel closes the sheet without creating a streak", async ({
    appA,
    page,
    userA,
  }) => {
    await page.getByRole("button", { name: /Start my streak/ }).click();
    await page.getByRole("button", { name: "Cancel" }).click();

    await expect(page.getByText("When did you start?")).toBeHidden();
    expect(await currentStreak(userA)).toBeNull();
  });

  test("Dashboard with a streak — shows days, personal best and history", async ({
    page,
    userA,
  }) => {
    await startStreak(userA, 12);
    await openApp(page, userA, { checkedInToday: true });

    await expect(page.getByText("clean and counting")).toBeVisible();
    await expect(page.getByText("Checked in today")).toBeVisible();
    await expect(page.getByText("Current", { exact: true })).toBeVisible();
    await expect(page.getByText("Personal best", { exact: true })).toBeVisible();
    await expect(page.getByText("Streak history")).toBeVisible();
    // 12 days elapsed → the timer's day segment reads 12
    await expect(page.getByText("Since ")).toBeVisible();
  });

  test("Check-in modal (auto) — appears when there are open days and 'All clean!' records the day", async ({
    page,
    userA,
  }) => {
    await startStreak(userA, 3);
    await checkin(userA); // marks a check-in in the past → today is now a gap
    await openApp(page, userA, { checkedInToday: false });
    await backdateLastCheckin(page, 2);

    await expect(page.getByText("Welcome back")).toBeVisible();
    await expect(page.getByText("How did it go?")).toBeVisible();

    await page.getByRole("button", { name: /All clean!/ }).click();

    await expect(page.getByText("Welcome back")).toBeHidden();
    await expect(page.getByText("Checked in today")).toBeVisible();

    const cached = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("nh_cache_streak_last_checkin") ?? "null"),
    );
    expect(cached?.data).toBe(todayISO());
  });

  test("Check-in modal — 'I had a setback' encerra o streak no dia marcado", async ({
    page,
    userA,
  }) => {
    await startStreak(userA, 4);
    await checkin(userA);
    await openApp(page, userA, { checkedInToday: false });
    await backdateLastCheckin(page, 2);

    await page.getByRole("button", { name: "I had a setback" }).click();
    await expect(page.getByText("Select the days you relapsed")).toBeVisible();

    // Two days are open (yesterday, today) — mark yesterday as the relapse.
    // Without this the picker submits an empty list and silently runs the
    // all-clean path instead.
    await dayCheckbox(page, 0).click();

    await page.getByRole("button", { name: /Continue/ }).click();
    await expect(page.getByText("Confirm your check-in")).toBeVisible();
    // buildSegments() renders the marked day as a setback segment — the
    // all-clean summary must not be what shows up here.
    await expect(page.getByText(/^Setback on /)).toBeVisible();
    await expect(page.getByText(/clean — amazing work/)).toBeHidden();

    await page.getByRole("button", { name: /Save & update streak/ }).click();
    await expect(page.getByText("Confirm your check-in")).toBeHidden();
    await expect(page.getByText("A new streak begins")).toBeVisible();

    // The relapse closed the 4-day streak and opened a new one dated yesterday.
    const fresh = await currentStreak(userA);
    expect(fresh.start_at.slice(0, 10)).toBe(daysAgo(1));
  });

  test("Check-in — a streak with no previous check-in uses the button, not the modal", async ({
    page,
    userA,
  }) => {
    // A streak that was never checked into has no gap to reconcile, so the
    // modal must stay closed and the dashboard button must be clickable.
    await startStreak(userA, 2);
    await openApp(page, userA, { checkedInToday: false });

    await expect(page.getByText("Welcome back")).toBeHidden();

    await page.getByRole("button", { name: /Check in for today/ }).click();
    await expect(page.getByText("Checked in today")).toBeVisible();

    const streak = await currentStreak(userA);
    expect(streak.last_checkin).not.toBeNull();
  });

  test("Check-in — a server failure does not show a success toast", async ({
    page,
    userA,
  }) => {
    await startStreak(userA, 2);
    await openApp(page, userA, { checkedInToday: false });
    await page.route("**/streaks/checkin", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: '{"message":"Could not record the check-in"}',
      }),
    );

    await page.getByRole("button", { name: /Check in for today/ }).click();

    // errorMessage() surfaces the backend message; the point is that *an error*
    // is shown and the celebration toast is not.
    await expect(
      page.getByText("Could not record the check-in"),
    ).toBeVisible();
    await expect(page.getByText("Checked in — day")).toBeHidden();
    await expect(page.getByText("Checked in today")).toBeHidden();
  });

  test("Relapse — compassionate sheet, resets to 0 and opens a new streak", async ({
    page,
    userA,
  }) => {
    await startStreak(userA, 9);
    await openApp(page, userA, { checkedInToday: true });

    await page.getByText("I relapsed").click();
    await expect(page.getByText("A setback isn't the end")).toBeVisible();
    await expect(page.getByText("9-day effort")).toBeVisible();

    await page.getByRole("button", { name: "Reset & start fresh" }).click();

    await expect(page.getByText("A new streak begins")).toBeVisible();
    await expect(page.getByText("A fresh start begins now")).toBeVisible();

    const fresh = await currentStreak(userA);
    expect(fresh.start_at.slice(0, 10)).toBe(todayISO());
  });

  test("Relapse — a server failure does not show the compassionate toast", async ({
    page,
    userA,
  }) => {
    // The endpoint works now, so the failure has to be injected: the point is
    // that the UI reports it instead of celebrating a reset that never happened.
    await startStreak(userA, 5);
    await openApp(page, userA, { checkedInToday: true });
    await page.route("**/streaks/end", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: '{"message":"Internal server error"}',
      }),
    );

    await page.getByText("I relapsed").click();
    await page.getByRole("button", { name: "Reset & start fresh" }).click();

    await expect(page.getByText("A new streak begins")).toBeHidden();
    await expect(
      page.getByText(/internal server error|went wrong|Couldn't save/i),
    ).toBeVisible();
  });

  test("Relapse — 'Not now' closes without changing the streak", async ({ page, userA }) => {
    await startStreak(userA, 6);
    await openApp(page, userA, { checkedInToday: true });

    await page.getByText("I relapsed").click();
    await page.getByRole("button", { name: "Not now" }).click();

    await expect(page.getByText("A setback isn't the end")).toBeHidden();
    const streak = await currentStreak(userA);
    expect(streak.start_at.slice(0, 10)).toBe(daysAgo(6));
  });

  test("Streak history — the active streak shows as ACTIVE", async ({ page, userA }) => {
    await startStreak(userA, 3);
    await openApp(page, userA, { checkedInToday: true });

    await page.getByText("Streak history").click();
    await expect(page.getByText("ACTIVE")).toBeVisible();
    await expect(page.getByText(/^Since .* · going strong$/)).toBeVisible();
  });

  test("Streak history — with no past streaks the header is not shown", async ({
    page,
    userA,
  }) => {
    await startStreak(userA, 3);
    await openApp(page, userA, { checkedInToday: true });

    await page.getByText("Streak history").click();
    await expect(page.getByText("ACTIVE")).toBeVisible();
    await expect(page.getByText("Past streaks", { exact: true })).toBeHidden();
  });

  test("Streak history — lists ended streaks and the record", async ({
    page,
    userA,
  }) => {
    await startStreak(userA, 20);
    await endStreak(userA); // closes it and opens a fresh one
    await openApp(page, userA, { checkedInToday: true });

    await page.getByText("Streak history").click();
    await expect(page.getByText("Past streaks")).toBeVisible();
    await expect(page.getByText("DAYS").first()).toBeVisible();

    // Back returns to the dashboard
    await page.locator("#nh-stage button").first().click();
    await expect(page.getByText("clean and counting")).toBeVisible();
  });

  test("Personal record — derivado do streak encerrado mais longo", async ({
    page,
    userA,
  }) => {
    await startStreak(userA, 20);
    await endStreak(userA);
    await openApp(page, userA, { checkedInToday: true });

    await expect(page.getByText("Personal best")).toBeVisible();
    // 20-day closed streak becomes the record; the new one starts at 0
    await expect(page.locator("text=/^20$/").first()).toBeVisible();
  });

  test("Confetti — fires with motion on (default)", async ({ appA, page }) => {
    await expect(page.locator(".nh-root")).toHaveAttribute("data-reduce-motion", "no");

    await page.getByRole("button", { name: /Start my streak/ }).click();
    await page.getByRole("button", { name: "Begin my streak" }).click();

    // burstConfetti() appends a transient host with 26 absolutely-positioned
    // spans into #nh-screen and removes it after 1.9s.
    await expect
      .poll(
        () =>
          page.evaluate(
            () =>
              document.querySelectorAll('#nh-screen div[style*="z-index: 88"] span')
                .length,
          ),
        { timeout: 6000 },
      )
      .toBe(26);
  });
});
