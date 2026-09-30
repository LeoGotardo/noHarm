/** TESTING.md → live updates: chat badge, badges/record after check-in,
 *  and the numbers on another user's profile. */
import {
  test,
  expect,
  openApp,
  openSecondApp,
  tab,
  tabBadge,
  backButton,
  openBadges,
} from "./helpers/fixtures.js";
import {
  currentStreak,
  daysAgo,
  listUserBadges,
  makeFriends,
  sendMessage,
  startStreak,
} from "./helpers/api.js";

test.describe("Realtime", () => {
  test("Chat — a GET /chats response older than the message does not clear the badge", async ({
    page,
    userA,
    userB,
  }) => {
    await makeFriends(userA, userB);
    // Create the conversation and zero the unread count, so the scenario
    // isolates the race and not the new-conversation case.
    await sendMessage(userB, { to: userA, content: "first" });
    await openApp(page, userA, { checkedInToday: true });
    await tab(page, "Chat").click();
    await page.getByText("first").click();
    await expect(page.getByPlaceholder("Message…")).toBeVisible();
    await backButton(page).click();
    await expect(tabBadge(page, "Chat")).toHaveCount(0);

    // Now the race, staged: hold the FIRST GET /chats response of the reload —
    // computed while there was no new message yet (unread 0) — let the message
    // arrive over the socket, and only then release the stale response.
    // Applying it raw used to undo the increment the handler had just made.
    let markCaptured;
    const captured = new Promise((r) => (markCaptured = r));
    let release;
    const held = new Promise((r) => (release = r));
    let first = true;

    await page.route("**/api/chats**", async (route) => {
      const response = await route.fetch();
      const body = await response.text();
      if (first) {
        first = false;
        markCaptured();
        await held;
      }
      await route.fulfill({ response, body });
    });

    await page.reload();
    await captured;

    await sendMessage(userB, { to: userA, content: "durante o fetch" });
    await page.waitForTimeout(1200);
    release();

    await expect(tabBadge(page, "Chat")).toHaveText("1", { timeout: 10000 });
  });

  test("Chat — a message that lands before the socket is live still shows up", async ({
    page,
    userA,
    userB,
  }) => {
    await makeFriends(userA, userB);

    // Two things held at once, to leave exactly one way for the badge to
    // appear. The chat list is fetched *before* the message exists, so its
    // answer says zero unread; the handshake is held, so no live event can
    // arrive either. That is a cold start, and also every reconnect — Socket.IO
    // replays nothing it missed.
    let releaseChats;
    const chatsHeld = new Promise((r) => (releaseChats = r));
    let firstChats = true;
    await page.route("**/api/chats**", async (route) => {
      const response = await route.fetch();
      const body = await response.text();
      if (firstChats) {
        firstChats = false;
        await chatsHeld;
      }
      await route.fulfill({ response, body });
    });

    let releaseSocket;
    const socketHeld = new Promise((r) => (releaseSocket = r));
    let firstSocket = true;
    await page.routeWebSocket(/\/ws\/socket\.io/, async (ws) => {
      if (firstSocket) {
        firstSocket = false;
        await socketHeld;
      }
      ws.connectToServer();
    });

    await openApp(page, userA, { checkedInToday: true });
    await expect(tab(page, "Chat")).toBeVisible();

    await sendMessage(userB, { to: userA, content: "chegou antes do socket" });

    // The list lands, and it is honestly empty — it was read before the message
    // was written.
    releaseChats();
    await page.waitForTimeout(1000);
    await expect(tabBadge(page, "Chat")).toHaveCount(0);

    // Connecting is the one moment the client knows it has a gap, so it asks
    // again. Without that the badge waits for the next time the app opens.
    releaseSocket();

    await expect(tabBadge(page, "Chat")).toHaveText("1", { timeout: 15_000 });
    await tab(page, "Chat").click();
    await expect(page.getByText("chegou antes do socket")).toBeVisible();
  });

  test("Chat — a second live message increments the existing badge", async ({
    page,
    userA,
    userB,
  }) => {
    await makeFriends(userA, userB);
    await sendMessage(userB, { to: userA, content: "first" });
    await openApp(page, userA, { checkedInToday: true });
    await expect(tabBadge(page, "Chat")).toHaveText("1");

    await sendMessage(userB, { to: userA, content: "segunda" });
    await expect(tabBadge(page, "Chat")).toHaveText("2", { timeout: 10000 });
  });

  test("Badges — an unlock shows immediately, without restarting the app", async ({
    appA,
    page,
    userA,
  }) => {
    expect((await listUserBadges(userA)).length).toBe(0);

    // A backdated start grants several milestones at once, server-side.
    await page.getByRole("button", { name: /Start my streak/ }).click();
    await page.locator('input[type="date"]').fill(daysAgo(30));
    await page.getByRole("button", { name: "Begin my streak" }).click();
    await expect(page.getByText("Your streak has begun")).toBeVisible();

    const earned = (await listUserBadges(userA)).length;
    expect(earned).toBeGreaterThan(0);

    // Without a reload: useBadges cached /user-badges/ for 1 h and had no
    // refetch, so the grid kept showing the pre-unlock response.
    await openBadges(page);
    await expect(
      page.getByText(new RegExp(`${earned} of \\d+ earned`)),
    ).toBeVisible({ timeout: 10000 });
  });

  test("Another user's profile — a friend shows day streak and badges earned", async ({
    browser,
    page,
    userA,
    userB,
  }) => {
    await makeFriends(userA, userB);
    await startStreak(userB, 5);

    const streak = await currentStreak(userB);
    expect(streak).toBeTruthy();
    const badges = (await listUserBadges(userB)).length;

    await openApp(page, userA, { checkedInToday: true });
    await tab(page, "Friends").click();
    await page.getByText(userB.username).first().click();

    await expect(page.getByText("day streak")).toBeVisible();
    // The numbers come from the server — no hardcoded "—".
    await expect(page.getByText(String(badges), { exact: true }).first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("?", { exact: true })).toHaveCount(0);
  });
});
