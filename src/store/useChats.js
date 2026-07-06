import { useCallback, useEffect, useState } from "react";
import { tokens } from "../connectors/tokens.js";
import { getChats } from "../services/api/chat.js";
import { getMessages } from "../services/api/message.js";
import { markRead, onMessage, onMessagesRead } from "../services/ws/chat.js";
import { cacheRead, cacheWrite } from "./cache.js";

const emptyChats = { chats: [], total: 0 };

// API returns { items: [] } — normalize to { chats: [] } for consumers
const normChats = (r) => ({ ...r, chats: r.items ?? r.chats ?? [] });
const emptyMsgs = { messages: [], total: 0 };

export function useChats(meId) {
  const [chats, setChats] = useState(
    () => cacheRead("chats")?.data ?? emptyChats,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tokens.getAccess()) {
      setLoading(false);
      return;
    }
    getChats()
      .then((data) => {
        const nd = normChats(data);
        console.log("[useChats] chats:", nd);
        setChats(nd);
        cacheWrite("chats", nd);
      })
      .finally(() => setLoading(false));

    try {
      // Update last_message + unread_count locally so the card refreshes without
      // a full refetch. Only the other participant's messages bump unread.
      const unsub = onMessage(({ message }) => {
        setChats((prev) => ({
          ...prev,
          chats: prev.chats.map((c) => {
            if (c.id !== message.chat) return c;
            const mine = message.sender === meId;
            return {
              ...c,
              last_message: message,
              unread_count: mine
                ? (c.unread_count ?? 0)
                : (c.unread_count ?? 0) + 1,
            };
          }),
        }));
      });
      return unsub;
    } catch {}
  }, [meId]);

  // Clear the unread badge for a chat I just opened/read.
  const markChatRead = useCallback((chatId) => {
    setChats((prev) => {
      const chats = prev.chats.map((c) =>
        c.id === chatId ? { ...c, unread_count: 0 } : c,
      );
      const next = { ...prev, chats };
      cacheWrite("chats", next);
      return next;
    });
  }, []);

  return { chats, loading, markChatRead };
}

/** Load messages for a single open chat thread. */
export function useChatThread(chatId) {
  const cacheKey = `messages_${chatId}`;
  const [messages, setMessages] = useState(
    () => cacheRead(cacheKey)?.data ?? emptyMsgs,
  );
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    // No chat yet (composing the first message) — nothing to load.
    if (!chatId) return;
    const data = await getMessages(chatId);
    console.log(`[useChatThread] messages (chat ${chatId}):`, data);
    setMessages(data);
    cacheWrite(cacheKey, data);
  }, [chatId]);

  useEffect(() => {
    if (!chatId) {
      setLoading(false);
      return;
    }
    fetchMessages().finally(() => setLoading(false));

    try {
      const unsubs = [
        // Append incoming message to the open thread. Since the chat is open,
        // mark it read live over the socket.
        onMessage(({ message }) => {
          if (message.chat !== chatId) return;
          setMessages((prev) => {
            const next = {
              messages: [...prev.messages, message],
              total: prev.total + 1,
            };
            cacheWrite(cacheKey, next);
            return next;
          });
          try {
            markRead(chatId);
          } catch {}
        }),
        // Mark all messages as read when other user reads
        onMessagesRead(({ chatId: cid }) => {
          if (cid !== chatId) return;
          setMessages((prev) => ({
            ...prev,
            messages: prev.messages.map((m) => ({ ...m, status: 8 })),
          }));
        }),
      ];
      return () => unsubs.forEach((u) => u());
    } catch {}
  }, [chatId]);

  return { messages, loading, refetch: fetchMessages };
}
