/** TESTING.md → "Friends" → "Report a user" */
import {
  test,
  expect,
  openApp,
  openSecondApp,
  tab,
  tabBadge,
  confirmWith,
} from "./helpers/fixtures.js";
import {
  api,
  as,
  asAdmin,
  fileReport,
  makeFriends,
  myReports,
  reportEvidence,
  sendMessage,
  sendRequest,
} from "./helpers/api.js";

const REASONS = [
  "Harassment or bullying",
  "Inappropriate or explicit content",
  "Spam or scams",
  "Pretending to be someone else",
  "I'm worried about their safety",
  "Something else",
];

const DETAILS = "Anything else we should know? (optional)";

const openFriends = async (page) => {
  await tab(page, "Friends").click();
  await expect(page.getByText("in your circle")).toBeVisible();
};

/** Open a friend's public profile from the friends list. */
const openFriendProfile = async (page, user) => {
  await openFriends(page);
  await page.getByText(user.username).click();
  await expect(page.getByText("day streak")).toBeVisible();
};

/**
 * Gear → "Report this user" → the sheet.
 *
 * The gear is the header's right-hand button, which is the second button the
 * screen renders (the back chevron is the first) — the same addressing the
 * remove/block tests use.
 */
const openReportSheet = async (page, user) => {
  await page.locator("#nh-stage button").nth(1).click();
  await page.getByText("Report this user").click();
  await expect(page.getByText(`Report ${user.username}`)).toBeVisible();
};

/**
 * Serve a one-page directory holding exactly `users`.
 *
 * Same reason as in friends.spec.js: the real directory is shared state that
 * grows with every run, and a freshly created account lands past page 1 as soon
 * as it does. Tests about what happens *after* a result is found pin the pool.
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

test.describe("Reports", () => {
  test("Report sheet — the six reasons, the privacy promise, Send disabled until one is picked", async ({
    page,
    userA,
    userB,
  }) => {
    await makeFriends(userA, userB);
    await openApp(page, userA, { checkedInToday: true });
    await openFriendProfile(page, userB);
    await openReportSheet(page, userB);

    // The promise that makes a report fileable at all.
    await expect(
      page.getByText(`Only our team sees this — ${userB.username} is never told you reported them.`),
    ).toBeVisible();

    for (const label of REASONS) {
      await expect(page.getByRole("button", { name: label })).toBeVisible();
    }
    await expect(page.getByPlaceholder(DETAILS)).toBeVisible();

    // A reason is mandatory; details are not.
    await expect(page.getByRole("button", { name: "Send report" })).toBeDisabled();
    await page.getByRole("button", { name: "Spam or scams" }).click();
    await expect(page.getByRole("button", { name: "Send report" })).toBeEnabled();

    // Cancel files nothing.
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("button", { name: "Send report" })).toHaveCount(0);
    expect((await myReports(userA)).total).toBe(0);
  });

  test("Report a user — reason + details → 'Report sent', and only the reporter can read it", async ({
    page,
    userA,
    userB,
  }) => {
    await makeFriends(userA, userB);
    await openApp(page, userA, { checkedInToday: true });
    await openFriendProfile(page, userB);
    await openReportSheet(page, userB);

    await page.getByRole("button", { name: "Harassment or bullying" }).click();
    await page.getByPlaceholder(DETAILS).fill("They keep messaging me.");
    await page.getByRole("button", { name: "Send report" }).click();

    await expect(page.getByText("Report sent — thank you")).toBeVisible();
    // The sheet closes on success — nothing left to send twice.
    await expect(page.getByRole("button", { name: "Send report" })).toHaveCount(0);

    const mine = await myReports(userA);
    expect(mine.total).toBe(1);
    expect(mine.reports[0]).toMatchObject({
      reported: userB.id,
      reason: "harassment",
      details: "They keep messaging me.",
      status: 4, // open
    });

    // A report about someone is unreadable by them.
    expect((await myReports(userB)).total).toBe(0);

    // Reporting is inert: the friendship is untouched.
    const after = await api.get("/friendships", as(userA));
    expect(after.friendships.filter((f) => f.status === 5)).toHaveLength(1);
  });

  test("Report a user — details are optional and every reason reaches the backend", async ({
    page,
    userA,
    userB,
  }) => {
    await makeFriends(userA, userB);
    await openApp(page, userA, { checkedInToday: true });
    await openFriendProfile(page, userB);
    await openReportSheet(page, userB);

    // The reason worded as concern rather than accusation — the one a recovery
    // app exists to receive.
    await page.getByRole("button", { name: "I'm worried about their safety" }).click();
    await page.getByRole("button", { name: "Send report" }).click();

    await expect(page.getByText("Report sent — thank you")).toBeVisible();

    const mine = await myReports(userA);
    expect(mine.total).toBe(1);
    expect(mine.reports[0].reason).toBe("self_harm");
    expect(mine.reports[0].details).toBeNull();
  });

  test("Report a user — details stop at 1000 characters and arrive without markup", async ({
    page,
    userA,
    userB,
  }) => {
    await makeFriends(userA, userB);
    await openApp(page, userA, { checkedInToday: true });
    await openFriendProfile(page, userB);
    await openReportSheet(page, userB);

    await page.getByRole("button", { name: "Something else" }).click();

    // The textarea truncates instead of letting the request 422 — the cap is
    // the backend's (`max_length=1000`), enforced before the send.
    const long = "<b>x</b>" + "y".repeat(1200);
    await page.getByPlaceholder(DETAILS).fill(long);
    await expect(page.getByPlaceholder(DETAILS)).toHaveValue(long.slice(0, 1000));

    await page.getByRole("button", { name: "Send report" }).click();
    await expect(page.getByText("Report sent — thank you")).toBeVisible();

    const stored = (await myReports(userA)).reports[0].details;
    expect(stored.length).toBeLessThanOrEqual(1000);
    expect(stored).not.toContain("<b>");
  });

  test("Report a user — a second report while the first is open stays in the sheet", async ({
    page,
    userA,
    userB,
  }) => {
    await makeFriends(userA, userB);
    await fileReport(userA, userB, "spam");

    await openApp(page, userA, { checkedInToday: true });
    await openFriendProfile(page, userB);
    await openReportSheet(page, userB);

    await page.getByRole("button", { name: "Something else" }).click();
    await page.getByPlaceholder(DETAILS).fill("It is still going on.");
    await page.getByRole("button", { name: "Send report" }).click();

    await expect(page.getByText(/already reported this user/)).toBeVisible();
    // Still open, with what was typed kept — nothing to retype.
    await expect(page.getByRole("button", { name: "Send report" })).toBeVisible();
    await expect(page.getByPlaceholder(DETAILS)).toHaveValue("It is still going on.");
    // And no toast: a refusal is not a success.
    await expect(page.getByText("Report sent — thank you")).toHaveCount(0);

    // The queue still holds exactly the first report.
    const mine = await myReports(userA);
    expect(mine.total).toBe(1);
    expect(mine.reports[0].reason).toBe("spam");
  });

  test("Report a user — a server failure keeps the sheet open and does not celebrate", async ({
    page,
    userA,
    userB,
  }) => {
    await makeFriends(userA, userB);
    await openApp(page, userA, { checkedInToday: true });
    await openFriendProfile(page, userB);

    await page.route("**/api/reports/**", (route) =>
      route.request().method() === "POST"
        ? route.fulfill({ status: 500, contentType: "application/json", json: { detail: null } })
        : route.fallback(),
    );

    await openReportSheet(page, userB);
    await page.getByRole("button", { name: "Spam or scams" }).click();
    await page.getByRole("button", { name: "Send report" }).click();

    await expect(page.getByText("Something went wrong on our end. Please try again.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Send report" })).toBeEnabled();
    await expect(page.getByText("Report sent — thank you")).toHaveCount(0);

    await page.unroute("**/api/reports/**");
    expect((await myReports(userA)).total).toBe(0);
  });

  test("Report sheet — reopening it starts blank", async ({ page, userA, userB }) => {
    await makeFriends(userA, userB);
    await openApp(page, userA, { checkedInToday: true });
    await openFriendProfile(page, userB);

    await openReportSheet(page, userB);
    await page.getByRole("button", { name: "Spam or scams" }).click();
    await page.getByPlaceholder(DETAILS).fill("half-written");
    await page.getByRole("button", { name: "Cancel" }).click();

    await openReportSheet(page, userB);
    // A reason left over from the previous attempt is the wrong default here.
    await expect(page.getByRole("button", { name: "Send report" })).toBeDisabled();
    await expect(page.getByPlaceholder(DETAILS)).toHaveValue("");
  });

  test("Report a stranger — reachable from search and creates no relationship", async ({
    page,
    userA,
    userB,
  }) => {
    await stubUserDirectory(page, [userB]);
    await openApp(page, userA, { checkedInToday: true });
    await openFriends(page);

    await page.getByRole("button", { name: /Find friends/ }).click();
    await page.getByPlaceholder("Search by username…").fill(userB.username);
    await expect(page.getByText(userB.username)).toBeVisible({ timeout: 20_000 });
    await expect(async () => {
      await page.getByText(userB.username).click();
      await expect(page.getByText("day streak")).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 20_000 });

    // Reporting does not require being friends — it is offered to anyone.
    await openReportSheet(page, userB);
    await page.getByRole("button", { name: "Pretending to be someone else" }).click();
    await page.getByRole("button", { name: "Send report" }).click();
    await expect(page.getByText("Report sent — thank you")).toBeVisible();

    expect((await myReports(userA)).reports[0]).toMatchObject({
      reported: userB.id,
      reason: "impersonation",
    });
    // No friendship was created or touched on the way.
    expect((await api.get("/friendships", as(userA))).friendships).toHaveLength(0);
    expect((await api.get("/friendships/sent", as(userA))).friendships).toHaveLength(0);
  });

  test("Report a user — the reported user is never told", async ({
    page,
    browser,
    userA,
    userB,
  }) => {
    await makeFriends(userA, userB);
    await openApp(page, userA, { checkedInToday: true });

    // B is signed in and watching, socket connected, while the report is filed.
    const { context, page: pageB } = await openSecondApp(browser, userB, {
      checkedInToday: true,
    });
    try {
      await expect(tab(pageB, "Home")).toBeVisible();

      await openFriendProfile(page, userB);
      await openReportSheet(page, userB);
      await page.getByRole("button", { name: "Harassment or bullying" }).click();
      await page.getByRole("button", { name: "Send report" }).click();
      await expect(page.getByText("Report sent — thank you")).toBeVisible();

      // Nothing surfaces on B's side: no banner, no toast, no tab counter.
      await pageB.waitForTimeout(1500);
      await expect(pageB.getByText(/report/i)).toHaveCount(0);
      await expect(tabBadge(pageB, "Friends")).toHaveCount(0);
      await expect(tabBadge(pageB, "Chat")).toHaveCount(0);

      // And B still sees A as a friend — a report is not a block.
      await tab(pageB, "Friends").click();
      await expect(pageB.getByText("1 in your circle")).toBeVisible();
      await expect(pageB.getByText(userA.username)).toBeVisible();

      // Nor can B read anything about it.
      expect((await myReports(userB)).total).toBe(0);
    } finally {
      await context.close();
    }
  });

  test("Blocking stays a separate action — a report neither blocks nor unfriends", async ({
    page,
    userA,
    userB,
  }) => {
    await makeFriends(userA, userB);
    await openApp(page, userA, { checkedInToday: true });
    await openFriendProfile(page, userB);

    await openReportSheet(page, userB);
    await page.getByRole("button", { name: "Spam or scams" }).click();
    await page.getByRole("button", { name: "Send report" }).click();
    await expect(page.getByText("Report sent — thank you")).toBeVisible();

    // Still a friend, and Message is still offered.
    await expect(page.getByText("Friend", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /Message/ })).toBeVisible();
    expect(
      (await api.get("/friendships", as(userA))).friendships.filter((f) => f.status === 5),
    ).toHaveLength(1);

    // Blocking afterwards is the deliberate second step.
    await page.locator("#nh-stage button").nth(1).click();
    await page.getByText("Block this user").click();
    await confirmWith(page, "Block");
    await expect(page.getByText("User blocked")).toBeVisible();
    expect((await myReports(userA)).total).toBe(1);
  });

  test("Report a user in a chat — the conversation is captured as evidence", async ({
    page,
    userA,
    userB,
  }) => {
    await makeFriends(userA, userB);
    // What the moderator will have to read to decide anything.
    const first = await sendMessage(userB, { to: userA, content: "you should just give up" });
    await sendMessage(userA, { chatId: first.chat, content: "please stop" });
    await sendMessage(userB, { chatId: first.chat, content: "no" });

    await openApp(page, userA, { checkedInToday: true });
    await openFriendProfile(page, userB);
    await openReportSheet(page, userB);
    await page.getByRole("button", { name: "Harassment or bullying" }).click();
    await page.getByPlaceholder(DETAILS).fill("they will not leave me alone");
    await page.getByRole("button", { name: "Send report" }).click();
    await expect(page.getByText("Report sent — thank you")).toBeVisible();

    const reportId = (await myReports(userA)).reports[0].id;
    const admin = await asAdmin();
    const { evidence } = await reportEvidence(admin, reportId);

    // Who they were at the time, then the exchange, both sides, in order.
    const kinds = evidence.map((e) => e.kind);
    expect(kinds[0]).toBe("profile");
    const messages = evidence.filter((e) => e.kind === "message");
    expect(messages.map((m) => m.content)).toEqual([
      "you should just give up",
      "please stop",
      "no",
    ]);
    expect(new Set(messages.map((m) => m.author_id))).toEqual(
      new Set([userA.id, userB.id]),
    );

    // The app sends a chat id, never text: nothing the reporter typed can end
    // up attributed to the person they reported.
    expect(messages.map((m) => m.content)).not.toContain(
      "they will not leave me alone",
    );
  });

  test("Report a user with no chat — the profile is still captured", async ({
    page,
    userA,
    userB,
  }) => {
    await makeFriends(userA, userB);
    await openApp(page, userA, { checkedInToday: true });
    await openFriendProfile(page, userB);
    await openReportSheet(page, userB);
    await page.getByRole("button", { name: "Pretending to be someone else" }).click();
    await page.getByRole("button", { name: "Send report" }).click();
    await expect(page.getByText("Report sent — thank you")).toBeVisible();

    const reportId = (await myReports(userA)).reports[0].id;
    const admin = await asAdmin();
    const { evidence } = await reportEvidence(admin, reportId);

    expect(evidence.map((e) => e.kind)).toEqual(["profile"]);
    // The username as it was when the report was filed — the thing an
    // impersonation report is about, and the thing that can change next.
    expect(evidence[0].content).toContain(userB.username);
  });

  test("Evidence is a moderator's to read — not the reporter's, not the reported user's", async ({
    userA,
    userB,
  }) => {
    const report = await fileReport(userA, userB, "spam");

    await expect(
      api.get(`/reports/${report.id}/evidence`, as(userA)),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      api.get(`/reports/${report.id}/evidence`, as(userB)),
    ).rejects.toMatchObject({ status: 404 });

    const admin = await asAdmin();
    expect((await reportEvidence(admin, report.id)).total).toBeGreaterThan(0);
  });

  test("POST /reports/{id} — self-report, unknown user and invalid input are refused", async ({
    userA,
    userB,
  }) => {
    // Cannot report yourself.
    await expect(fileReport(userA, userA, "spam")).rejects.toMatchObject({ status: 400 });

    // Nor an account that does not exist.
    await expect(
      api.post("/reports/no-such-user", { ...as(userA), body: { reason: "spam" } }),
    ).rejects.toMatchObject({ status: 404 });

    // The reason list is closed…
    await expect(
      api.post(`/reports/${userB.id}`, { ...as(userA), body: { reason: "because" } }),
    ).rejects.toMatchObject({ status: 422 });

    // …and details are capped server-side, not only in the textarea.
    await expect(
      api.post(`/reports/${userB.id}`, {
        ...as(userA),
        body: { reason: "spam", details: "z".repeat(1001) },
      }),
    ).rejects.toMatchObject({ status: 422 });

    // None of the refusals filed anything.
    expect((await myReports(userA)).total).toBe(0);
  });

  test("POST /reports/{id} — one open report per pair, whatever the reason", async ({
    userA,
    userB,
  }) => {
    const first = await fileReport(userA, userB, "spam", "first one");
    expect(first.status).toBe(4);

    // A different reason about the same person is still the same open report.
    await expect(fileReport(userA, userB, "harassment")).rejects.toMatchObject({
      status: 409,
    });

    // The pair is directional: B reporting A is a separate, allowed report.
    const back = await fileReport(userB, userA, "other");
    expect(back.reported).toBe(userA.id);

    expect((await myReports(userA)).total).toBe(1);
    expect((await myReports(userB)).total).toBe(1);
  });

  test("GET /reports — the moderation queue is admin-only", async ({ userA, userB }) => {
    await fileReport(userA, userB, "spam");

    // 404 rather than 403: whether an admin surface exists here is not something
    // an ordinary caller needs confirmed.
    await expect(api.get("/reports", as(userA))).rejects.toMatchObject({ status: 404 });
    await expect(
      api.get(`/reports/${(await myReports(userA)).reports[0].id}`, as(userA)),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      api.put(`/reports/${(await myReports(userA)).reports[0].id}/resolve/ignored`, as(userA)),
    ).rejects.toMatchObject({ status: 404 });

    // The report itself is untouched by the attempts.
    expect((await myReports(userA)).reports[0].status).toBe(4);
  });

  test("GET /reports/mine — shape, and it only ever holds my own reports", async ({
    userA,
    userB,
  }) => {
    await sendRequest(userB, userA);
    await fileReport(userA, userB, "inappropriate", "  spaced out  ");

    const mine = await myReports(userA);
    expect(mine).toHaveProperty("reports");
    expect(mine.total).toBe(1);
    expect(mine.reports[0]).toMatchObject({
      reporter: userA.id,
      reported: userB.id,
      reason: "inappropriate",
      details: "spaced out", // trimmed on the way in
      status: 4,
    });
    expect(mine.reports[0]).toHaveProperty("created_at");

    const paged = await api.get("/reports/mine?paginated=true&page=1&pageSize=20", as(userA));
    expect(paged).toHaveProperty("items");
    expect(paged.items).toHaveLength(1);

    // The report exists, and the person it names cannot see it in any form.
    expect((await myReports(userB)).reports).toHaveLength(0);
  });
});
