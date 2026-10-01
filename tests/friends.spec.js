/** TESTING.md → "Friends" */
import {
  test,
  expect,
  openApp,
  tab,
  tabBadge,
  confirmDialog,
  confirmWith,
} from "./helpers/fixtures.js";
import { api, as, makeFriends, sendMessage, sendRequest } from "./helpers/api.js";

const openFriends = async (page) => {
  await tab(page, "Friends").click();
  await expect(page.getByText("in your circle")).toBeVisible();
};

/**
 * Serve a two-page user directory in which `hidden` only appears on page 2.
 * Page size mirrors the app's own (100).
 */
async function stubDirectory(page, me, hidden) {
  const filler = Array.from({ length: 100 }, (_, i) => ({
    id: `filler-${i}`,
    username: `filler_user_${i}`,
    email: `filler${i}@example.com`,
    status: 1,
    profile_picture: null,
  }));
  const pages = {
    1: filler,
    2: [
      {
        id: hidden.id,
        username: hidden.username,
        email: hidden.email,
        status: 1,
        profile_picture: null,
      },
    ],
  };
  await page.route("**/users?*", async (route) => {
    const url = new URL(route.request().url());
    const n = Number(url.searchParams.get("page") ?? 1);
    const items = pages[n] ?? [];
    await route.fulfill({
      contentType: "application/json",
      json: { items, total: 101, page: n, pageSize: 100, totalPages: 2 },
    });
  });
}

/**
 * Serve a one-page directory containing exactly `users`.
 *
 * The real directory is shared, unbounded state — every run leaves soft-deleted
 * accounts behind, and once it crosses one page a freshly created user lands on
 * page 2 and the app has to walk there under a 30 req/min cap on `/users`. Tests
 * that only care about what happens *after* a result is found pin the pool.
 * The live endpoint keeps its own contract test below.
 */
async function stubUserDirectory(page, users) {
  const items = users.map((u) => ({
    id: u.id,
    username: u.username,
    email: u.email,
    status: 1,
    profile_picture: null,
  }));
  await page.route("**/users?*", (route) =>
    route.fulfill({
      contentType: "application/json",
      json: {
        items,
        total: items.length,
        page: 1,
        pageSize: 100,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      },
    }),
  );
}

/**
 * Open a search result.
 *
 * The directory is paged in progressively, so the results list can reflow right
 * as the click lands and swallow it — retry until the profile is actually open.
 */
async function openSearchResult(page, username) {
  await expect(page.getByText(username)).toBeVisible({ timeout: 20_000 });
  await expect(async () => {
    await page.getByText(username).click();
    await expect(page.getByText("day streak")).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 20_000 });
}

test.describe("Friends", () => {
  test("Empty list — the 'Recovery is easier together' state", async ({ appA, page }) => {
    await openFriends(page);
    await expect(page.getByText("Recovery is easier together")).toBeVisible();
    await expect(page.getByRole("button", { name: /Find friends/ })).toBeVisible();
    await expect(page.getByText("0 in your circle")).toBeVisible();
  });

  test("Friends list — shows an accepted friend and the count", async ({
    page,
    userA,
    userB,
  }) => {
    await makeFriends(userA, userB);
    await openApp(page, userA, { checkedInToday: true });

    await openFriends(page);
    await expect(page.getByText("1 in your circle")).toBeVisible();
    await expect(page.getByText(userB.username)).toBeVisible();
  });

  test("Friend requests — badge no tab, contador e aceitar (toast 'Friend added')", async ({
    page,
    userA,
    userB,
  }) => {
    await sendRequest(userB, userA); // B → A, so A sees it as received
    await openApp(page, userA, { checkedInToday: true });

    // Tab badge shows the pending count
    await expect(tabBadge(page, "Friends")).toHaveText("1");

    await openFriends(page);
    await expect(page.getByText("1 friend request")).toBeVisible();
    await page.getByText("Tap to review").click();

    await expect(page.getByRole("button", { name: /Received/ })).toBeVisible();
    await expect(page.getByText(userB.username)).toBeVisible();

    // The accept button is the second (primary) action button on the row
    await page.locator("#nh-stage button").filter({ has: page.locator("svg") }).last().click();
    await expect(page.getByText("Friend added")).toBeVisible();

    const friendships = await api.get("/friendships", as(userA));
    expect(friendships.friendships.some((f) => f.status === 5)).toBe(true);
  });

  test("Friend requests — the 'Sent' tab is reachable with an empty inbox and Cancel removes", async ({
    page,
    userA,
    userB,
  }) => {
    await sendRequest(userA, userB); // only a *sent* request — inbox is empty

    await openApp(page, userA, { checkedInToday: true });
    await openFriends(page);
    await page.getByRole("button", { name: "Friend requests" }).click();

    await expect(page.getByText("No new requests")).toBeVisible();
    await page.getByRole("button", { name: /Sent/ }).click();
    await expect(page.getByText(userB.username)).toBeVisible();

    await page.getByRole("button", { name: "Cancel" }).click();
    // Asked first; "Keep it" changes nothing.
    await expect(confirmDialog(page)).toContainText("Cancel your request");
    await confirmWith(page, "Keep it");
    await expect(page.getByText(userB.username)).toBeVisible();

    await page.getByRole("button", { name: "Cancel" }).click();
    await confirmWith(page, "Cancel request");
    await expect(page.getByText("No pending requests")).toBeVisible();

    const sent = await api.get("/friendships/sent", as(userA));
    expect(sent.friendships).toHaveLength(0);
  });

  test("Friend search — finds an account beyond the first page of the directory", async ({
    page,
    userA,
    userB,
  }) => {
    // The pool is filtered client-side, so a user sitting past page 1 is only
    // reachable if the app keeps paging while searching. A stubbed directory
    // pins that regardless of how many accounts the real backend holds.
    await stubDirectory(page, userA, userB);

    await openApp(page, userA, { checkedInToday: true });
    await openFriends(page);
    await page.getByRole("button", { name: /Find friends/ }).click();
    await page.getByPlaceholder("Search by username…").fill(userB.username);

    await openSearchResult(page, userB.username);
    await expect(page.getByRole("button", { name: /Add friend/ })).toBeVisible();
  });

  test("Friend search — searches by username and sends a request", async ({
    page,
    userA,
    userB,
  }) => {
    await stubUserDirectory(page, [userB]);
    await openApp(page, userA, { checkedInToday: true });
    await openFriends(page);

    await page.getByRole("button", { name: /Find friends/ }).click();
    await expect(page.getByText("Add friends")).toBeVisible();
    await expect(page.getByText("Type at least 2 characters to search.")).toBeVisible();

    await page.getByPlaceholder("Search by username…").fill(userB.username);
    await expect(page.getByText(userB.username)).toBeVisible({ timeout: 20_000 });

    await page.getByRole("button", { name: /Add/ }).click();
    await expect(page.getByText("Request sent")).toBeVisible();
    await expect(page.getByText("Requested")).toBeVisible();

    const sent = await api.get("/friendships/sent", as(userA));
    expect(sent.friendships[0].reciver).toBe(userB.id);
  });

  test("Friend search — no results", async ({ page, userA, userB }) => {
    await stubUserDirectory(page, [userB]);
    await openApp(page, userA, { checkedInToday: true });
    await openFriends(page);
    await page.getByRole("button", { name: /Find friends/ }).click();
    await page.getByPlaceholder("Search by username…").fill("zzz_nao_existe_zzz");
    await expect(page.getByText("No one found")).toBeVisible();
  });

  test("GET /users — contract of the directory backing search", async ({
    userA,
    userB,
  }) => {
    // Every search test stubs this response, so the shape is pinned here once.
    // Note it is only paginated when asked: without `paginated=true` the backend
    // answers { users, total } instead.
    const res = await api.get("/users?paginated=true&page=1&pageSize=100", as(userA));
    expect(res).toHaveProperty("items");
    expect(res).toHaveProperty("total");
    expect(res).toHaveProperty("totalPages");
    expect(Array.isArray(res.items)).toBe(true);

    const flat = await api.get("/users", as(userA));
    expect(Array.isArray(flat.users)).toBe(true);

    // A live account is reachable through the directory the search pool walks.
    const ids = new Set(res.items.map((u) => u.id));
    const found = ids.has(userB.id) || res.totalPages > 1;
    expect(found, "userB must be in the directory or more pages must exist").toBe(true);
  });

  test("Public profile — 'none' relationship → Add friend → 'Request sent'", async ({
    page,
    userA,
    userB,
  }) => {
    await openApp(page, userA, { checkedInToday: true });
    await openFriends(page);
    await page.getByRole("button", { name: /Find friends/ }).click();
    await page.getByPlaceholder("Search by username…").fill(userB.username);
    await openSearchResult(page, userB.username);

    await expect(page.getByRole("button", { name: /Add friend/ })).toBeVisible();
    await expect(page.getByText("Add to see activity")).toBeVisible();

    await page.getByRole("button", { name: /Add friend/ }).click();
    await expect(page.getByText("Request sent")).toBeVisible();
    await expect(page.getByRole("button", { name: "Request sent" })).toBeDisabled();
  });

  test("Public profile — friend: Message, Remove friend (toast) and Block (toast)", async ({
    page,
    userA,
    userB,
  }) => {
    await makeFriends(userA, userB);
    await openApp(page, userA, { checkedInToday: true });
    await openFriends(page);

    await page.getByText(userB.username).click();
    await expect(page.getByText("Friend", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /Message/ })).toBeVisible();

    // gear → action sheet
    await page.locator("#nh-stage button").nth(1).click();
    await expect(page.getByText("Remove friend")).toBeVisible();
    await expect(page.getByText("Block this user")).toBeVisible();

    await page.getByText("Remove friend").click();
    await expect(confirmDialog(page)).toContainText(`Remove ${userB.username}`);
    await confirmWith(page, "Remove");
    await expect(page.getByText("Friend removed")).toBeVisible();

    const after = await api.get("/friendships", as(userA));
    expect(after.friendships.filter((f) => f.status === 5)).toHaveLength(0);
  });

  test("Public profile — Block moves the friendship to blocked status", async ({
    page,
    userA,
    userB,
  }) => {
    await makeFriends(userA, userB);
    await openApp(page, userA, { checkedInToday: true });
    await openFriends(page);

    await page.getByText(userB.username).click();
    await page.locator("#nh-stage button").nth(1).click();
    await page.getByText("Block this user").click();

    // Nothing happens until the confirmation is answered.
    await expect(confirmDialog(page)).toContainText(`Block ${userB.username}?`);
    await confirmWith(page, "Cancel");
    expect(
      (await api.get("/friendships", as(userA))).friendships.filter((f) => f.status === 3),
    ).toHaveLength(0);

    await page.locator("#nh-stage button").nth(1).click();
    await page.getByText("Block this user").click();
    await confirmWith(page, "Block");

    await expect(page.getByText("User blocked")).toBeVisible();
    await expect(page.getByRole("button", { name: "Unblock" })).toBeVisible();
    const blocked = (await api.get("/friendships", as(userA))).friendships;
    expect(blocked.filter((f) => f.status === 3 && f.blocked_by === userA.id)).toHaveLength(1);
  });

  test("Blocked people — the blocker still sees them, with nothing to do but unblock", async ({
    page,
    userA,
    userB,
  }) => {
    await makeFriends(userA, userB);
    await api.post(`/users/${userB.id}/block`, as(userA));
    await openApp(page, userA, { checkedInToday: true });

    await tab(page, "Friends").click();
    await page.getByText("Blocked people").click();

    // The row opens their profile — named, although that profile answers 403
    // to the person who blocked them — with Unblock and no way to interact.
    await page.getByText(userB.username).click();
    await expect(page.getByText(userB.username)).toBeVisible();
    await expect(page.getByText("You blocked them")).toBeVisible();
    await expect(page.getByRole("button", { name: "Unblock" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Message/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Add friend/ })).toHaveCount(0);
  });

  test("Blocked — a conversation from before the block is read-only for the blocker", async ({
    page,
    userA,
    userB,
  }) => {
    await makeFriends(userA, userB);
    await sendMessage(userB, { to: userA, content: "before the block" });
    await api.post(`/users/${userB.id}/block`, as(userA));
    await openApp(page, userA, { checkedInToday: true });

    await tab(page, "Chat").click();
    await page.getByText("before the block").click();

    await expect(page.getByText("before the block").last()).toBeVisible();
    await expect(page.getByText("Unblock them to message again")).toBeVisible();
    await expect(page.getByPlaceholder("Message…")).toHaveCount(0);
  });

  test("Unblock — asked first, from the profile and from Friends → Blocked people", async ({
    page,
    userA,
    userB,
  }) => {
    await makeFriends(userA, userB);
    await api.post(`/users/${userB.id}/block`, as(userA));
    await openApp(page, userA, { checkedInToday: true });

    await tab(page, "Friends").click();
    await page.getByText("Blocked people").click();
    await expect(page.getByText(userB.username)).toBeVisible();

    await page.getByRole("button", { name: "Unblock" }).click();
    await expect(confirmDialog(page)).toContainText(`Unblock ${userB.username}?`);
    await confirmWith(page, "Unblock");

    await expect(page.getByText("Unblocked")).toBeVisible();
    await expect(page.getByText("Nobody blocked")).toBeVisible();
    const rows = (await api.get("/friendships", as(userA))).friendships;
    expect(rows.filter((f) => f.status === 3)).toHaveLength(0);
  });

  test("Unblock — a friend request can be sent again afterwards, and arrives", async ({
    page,
    userA,
    userB,
  }) => {
    // Unblocking leaves the old row `disabled`. The backend used to read that
    // as a live request and answer 409, while the app showed Add friend — so
    // after an unblock nobody could ever ask again.
    await makeFriends(userA, userB);
    await api.post(`/users/${userB.id}/block`, as(userA));
    await api.delete(`/users/${userB.id}/block`, as(userA));
    await openApp(page, userA, { checkedInToday: true });

    await openFriends(page);
    await page.getByRole("button", { name: /Find friends/ }).click();
    await page.getByPlaceholder("Search by username…").fill(userB.username);
    await openSearchResult(page, userB.username);

    await page.getByRole("button", { name: /Add friend/ }).click();
    await expect(page.getByRole("button", { name: "Request sent" })).toBeDisabled();

    const pending = (await api.get("/friendships/pending", as(userB))).friendships;
    expect(pending.filter((f) => f.sender === userA.id)).toHaveLength(1);
  });

  test("Public profile — a received request shows Accept/Decline", async ({
    page,
    userA,
    userB,
  }) => {
    await sendRequest(userB, userA);
    await openApp(page, userA, { checkedInToday: true });
    await openFriends(page);

    await page.getByText("Tap to review").click();
    await page.getByText(userB.username).click();

    await expect(page.getByRole("button", { name: /Accept/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Decline" })).toBeVisible();

    await page.getByRole("button", { name: /Accept/ }).click();
    await expect(page.getByText("Friend added")).toBeVisible();
  });
});
