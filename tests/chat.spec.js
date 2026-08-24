/** TESTING.md → "Chat" (inclui realtime via Socket.IO) */
import { test, expect, openApp, openSecondApp, tab, tabBadge } from "./helpers/fixtures.js";
import { getChats, makeFriends, sendMessage } from "./helpers/api.js";
import { connectAs, emitMessage, emitTyping, joinChat } from "./helpers/socket.js";

const openChatTab = async (page) => {
  await tab(page, "Chat").click();
  await expect(page.getByText("Messages")).toBeVisible();
};

test.describe("Chat", () => {
  test("Chat list — estado vazio", async ({ appA, page }) => {
    await openChatTab(page);
    await expect(page.getByText("No conversations yet")).toBeVisible();
    await expect(page.getByText("0 conversations")).toBeVisible();
  });

  test("Chat list — conversa com última mensagem e badge de não-lidas", async ({
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

  test("Chat thread — abre, marca como lida e envia mensagem", async ({
    page,
    userA,
    userB,
  }) => {
    await makeFriends(userA, userB);
    await sendMessage(userB, { to: userA, content: "mensagem inicial" });

    await openApp(page, userA, { checkedInToday: true });
    await openChatTab(page);
    await page.getByText("mensagem inicial").click();

    await expect(page.getByPlaceholder("Message…")).toBeVisible();
    await expect(page.getByText("mensagem inicial")).toBeVisible();

    await page.getByPlaceholder("Message…").fill("tudo certo por aqui");
    await page.keyboard.press("Enter");

    await expect(page.getByText("tudo certo por aqui")).toBeVisible();

    // Persisted on the backend
    const chats = await getChats(userA);
    expect(chats[0].last_message.message).toBe("tudo certo por aqui");

    // Opening the thread marked B's message as read (status 8)
    await expect
      .poll(async () => (await getChats(userA))[0].unread_count ?? 0)
      .toBe(0);
  });

  test("Message person — a partir de Friends cria a conversa na primeira mensagem", async ({
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

    await page.getByPlaceholder("Message…").fill("primeira mensagem");
    await page.keyboard.press("Enter");
    await expect(page.getByText("primeira mensagem")).toBeVisible();

    await expect.poll(async () => (await getChats(userA)).length).toBe(1);
  });

  test("Realtime (WS) — mensagem do outro usuário chega na thread aberta", async ({
    page,
    browser,
    userA,
    userB,
  }) => {
    await makeFriends(userA, userB);
    await sendMessage(userA, { to: userB, content: "abrindo a conversa" });

    await openApp(page, userA, { checkedInToday: true });
    await openChatTab(page);
    await page.getByText("abrindo a conversa").click();
    await expect(page.getByPlaceholder("Message…")).toBeVisible();

    const { context, page: pageB } = await openSecondApp(browser, userB, {
      checkedInToday: true,
    });
    try {
      await pageB.getByRole("button", { name: "Chat", exact: true }).click();
      await pageB.getByText("abrindo a conversa").click();
      await pageB.getByPlaceholder("Message…").fill("chegou em tempo real");
      await pageB.keyboard.press("Enter");

      await expect(page.getByText("chegou em tempo real")).toBeVisible({
        timeout: 15_000,
      });
    } finally {
      await context.close();
    }
  });

  test("Realtime (WS) — indicador 'typing…' aparece ao receber o evento", async ({
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

  test("Realtime (WS) — mensagem enviada pelo socket aparece na lista de chats", async ({
    page,
    userA,
    userB,
  }) => {
    await makeFriends(userA, userB);
    const msg = await sendMessage(userA, { to: userB, content: "conversa" });

    await openApp(page, userA, { checkedInToday: true });
    await openChatTab(page);
    await expect(page.getByText("conversa", { exact: true })).toBeVisible();

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
