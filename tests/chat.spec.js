/** TESTING.md → "Chat" (inclui realtime via Socket.IO) */
import { test, expect, openApp, openSecondApp, tab, tabBadge } from "./helpers/fixtures.js";
import { getChats, makeFriends, sendMessage } from "./helpers/api.js";
import { connectAs, emitMessage, emitTyping, joinChat } from "./helpers/socket.js";

const openChatTab = async (page) => {
  await tab(page, "Chat").click();
  await expect(page.getByText("Messages")).toBeVisible();
};

/**
 * The transcript itself.
 *
 * In the desktop two-pane layout a message body appears twice — once as the
 * conversation list's preview line, once as the bubble — so an unscoped
 * getByText is ambiguous there and passes only by accident on a phone.
 */
const thread = (page) => page.locator("#nh-thread");

test.describe("Chat", () => {
  test("Chat list — empty state", async ({ appA, page }) => {
    await openChatTab(page);
    await expect(page.getByText("No conversations yet")).toBeVisible();
    await expect(page.getByText("0 conversations")).toBeVisible();
  });

  test("Chat list — conversation with last message and unread badge", async ({
    page,
    userA,
    userB,
  }) => {
    await makeFriends(userA, userB);
    await sendMessage(userB, { to: userA, content: "oi, como foi hoje?" });

    await openApp(page, userA, { checkedInToday: true });

    // Unread count shows on the Chat tab badge
    await expect(tabBadge(page, "Chat")).toHaveText("1");

    await openChatTab(page);
    await expect(page.getByText("1 conversation")).toBeVisible();
    await expect(page.getByText("oi, como foi hoje?")).toBeVisible();
    await expect(page.getByText(userB.username)).toBeVisible();
  });

  test("Chat thread — opens, marks as read and sends a message", async ({
    page,
    userA,
    userB,
  }) => {
    await makeFriends(userA, userB);
    await sendMessage(userB, { to: userA, content: "opening message" });

    await openApp(page, userA, { checkedInToday: true });
    await openChatTab(page);
    await page.getByText("opening message").click();

    await expect(page.getByPlaceholder("Message…")).toBeVisible();
    await expect(thread(page).getByText("opening message")).toBeVisible();

    await page.getByPlaceholder("Message…").fill("tudo certo por aqui");
    await page.keyboard.press("Enter");

    await expect(thread(page).getByText("tudo certo por aqui")).toBeVisible();

    // Persisted on the backend
    const chats = await getChats(userA);
    expect(chats[0].last_message.message).toBe("tudo certo por aqui");

    // Opening the thread marked B's message as read (status 8)
    await expect
      .poll(async () => (await getChats(userA))[0].unread_count ?? 0)
      .toBe(0);
  });

  test("Send — two taps in one tick post one message", async ({
    page,
    userA,
    userB,
  }) => {
    await makeFriends(userA, userB);
    await sendMessage(userB, { to: userA, content: "opening message" });

    await openApp(page, userA, { checkedInToday: true });
    await openChatTab(page);
    await page.getByText("opening message").click();
    await expect(page.getByPlaceholder("Message…")).toBeVisible();

    const posts = [];
    page.on("request", (r) => {
      if (r.method() === "POST" && new URL(r.url()).pathname === "/api/messages")
        posts.push(r.url());
    });

    await page.getByPlaceholder("Message…").fill("só uma vez");
    // Both clicks land before React re-renders, which is what the `sending`
    // flag alone cannot catch — only useGuardedCallback does.
    await page.evaluate(() => {
      const btn = document.querySelectorAll("#nh-stage button");
      const send = btn[btn.length - 1];
      send.click();
      send.click();
    });

    await expect(thread(page).getByText("só uma vez")).toBeVisible();
    await expect.poll(() => posts.length, { timeout: 3000 }).toBe(1);
    const chats = await getChats(userA);
    expect(chats[0].last_message.message).toBe("só uma vez");
  });

  test("Message person — from Friends, the conversation is created on the first message", async ({
    page,
    userA,
    userB,
  }) => {
    await makeFriends(userA, userB);
    await openApp(page, userA, { checkedInToday: true });

    await tab(page, "Friends").click();
    // Wait for the row to be enriched with the friend's username, then hit the
    // chat bubble button inside that row.
    const row = page.locator(`div:has(> div > div:text-is("${userB.username}"))`).last();
    await expect(row).toBeVisible();
    await row.locator("button").click();

    await expect(
      page.getByText("This is the beginning of your conversation with"),
    ).toBeVisible();

    await page.getByPlaceholder("Message…").fill("first message");
    await page.keyboard.press("Enter");
    await expect(thread(page).getByText("first message")).toBeVisible();

    await expect.poll(async () => (await getChats(userA)).length).toBe(1);
  });

  test("Realtime (WS) — the other user's message arrives in the open thread", async ({
    page,
    browser,
    userA,
    userB,
  }) => {
    await makeFriends(userA, userB);
    await sendMessage(userA, { to: userB, content: "opening the thread" });

    await openApp(page, userA, { checkedInToday: true });
    await openChatTab(page);
    await page.getByText("opening the thread").click();
    await expect(page.getByPlaceholder("Message…")).toBeVisible();

    const { context, page: pageB } = await openSecondApp(browser, userB, {
      checkedInToday: true,
    });
    try {
      await pageB.getByRole("button", { name: "Chat", exact: true }).click();
      await pageB.getByText("opening the thread").click();
      await pageB.getByPlaceholder("Message…").fill("chegou em tempo real");
      await pageB.keyboard.press("Enter");

      await expect(thread(page).getByText("chegou em tempo real")).toBeVisible({
        timeout: 15_000,
      });
    } finally {
      await context.close();
    }
  });

  test("Realtime (WS) — the 'typing…' indicator appears when the event arrives", async ({
    page,
    userA,
    userB,
  }) => {
    await makeFriends(userA, userB);
    const msg = await sendMessage(userA, { to: userB, content: "oi" });

    await openApp(page, userA, { checkedInToday: true });
    await openChatTab(page);
    await page.getByText("oi", { exact: true }).click();
    await expect(page.getByPlaceholder("Message…")).toBeVisible();

    // Receiving half: drive the event from B's socket.
    const socketB = await connectAs(userB);
    try {
      joinChat(socketB, msg.chat);
      await page.waitForTimeout(300);
      emitTyping(socketB, msg.chat, true);

      await expect(page.getByText("typing…")).toBeVisible({ timeout: 10_000 });

      emitTyping(socketB, msg.chat, false);
      await expect(page.getByText("typing…")).toBeHidden({ timeout: 10_000 });
    } finally {
      socketB.close();
    }
  });

  test("Realtime (WS) — a message sent over the socket appears in the chat list", async ({
    page,
    userA,
    userB,
  }) => {
    await makeFriends(userA, userB);
    const msg = await sendMessage(userA, { to: userB, content: "thread" });

    await openApp(page, userA, { checkedInToday: true });
    await openChatTab(page);
    await expect(page.getByText("thread", { exact: true })).toBeVisible();

    const socketB = await connectAs(userB);
    try {
      joinChat(socketB, msg.chat);
      await page.waitForTimeout(300);
      emitMessage(socketB, msg.chat, "resposta via socket");

      await expect(page.getByText("resposta via socket")).toBeVisible({
        timeout: 15_000,
      });
    } finally {
      socketB.close();
    }
  });
});

test.describe("Chat — no double renders", () => {
  test("A sent message appears once, however the echo and the refetch race", async ({
    page,
    userA,
    userB,
  }) => {
    // Sending posts, then refetches the thread — and the server also echoes the
    // message back over the socket, to the sender as well as the recipient.
    // Whichever of the two lands second used to append a second copy of the
    // same row, so the sender saw their own message twice.
    await makeFriends(userA, userB);
    await sendMessage(userB, { to: userA, content: "abre a conversa" });

    await openApp(page, userA, { checkedInToday: true });
    await openChatTab(page);
    await page.getByText("abre a conversa").click();
    await expect(page.getByPlaceholder("Message…")).toBeVisible();

    await page.getByPlaceholder("Message…").fill("uma só vez");
    await page.keyboard.press("Enter");

    await expect(thread(page).getByText("uma só vez")).toHaveCount(1);
    // And it stays one after the echo has certainly arrived.
    await page.waitForTimeout(1500);
    await expect(thread(page).getByText("uma só vez")).toHaveCount(1);
  });
});
