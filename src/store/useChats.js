import { useCallback, useEffect, useRef, useState } from "react";
import { tokens } from "../connectors/tokens.js";
import { getChats } from "../services/api/chat.js";
import { getMessages } from "../services/api/message.js";
import { markRead, onMessage, onMessagesRead } from "../services/ws/chat.js";
import { onSocketReady } from "../services/ws/connection.js";
import { STATUS_CONSTANTS } from "../services/constants.js";
import { cacheRead, cacheWrite } from "./cache.js";

const emptyChats = { chats: [], total: 0 };

/**
 * Fold one incoming message into the chat list.
 *
 * Pure so the same transition can be applied twice: once live, and again over
 * the server's answer when a message landed while that request was in flight.
 * Returns the state unchanged when the chat is unknown — the caller refetches,
 * because a first message creates a conversation the list has never seen.
 */
function applyIncoming(state, message, meId) {
  let found = false;
  const chats = state.chats.map((c) => {
    if (c.id !== message.chat) return c;
    found = true;
    const mine = message.sender === meId;
    // Same message twice (live, then replayed over the fetch) must not count
    // twice. The last_message id is what tells them apart.
    if (c.last_message?.id === message.id) return c;
    return {
      ...c,
      last_message: message,
      unread_count: mine ? (c.unread_count ?? 0) : (c.unread_count ?? 0) + 1,
    };
  });
  return found ? { ...state, chats } : state;
}

// API returns { items: [] } — normalize to { chats: [] } for consumers
const normChats = (r) => ({ ...r, chats: r.items ?? r.chats ?? [] });
const emptyMsgs = { messages: [], total: 0 };

export function useChats(meId) {
  const [chats, setChats] = useState(
    () => cacheRead("chats")?.data ?? emptyChats,
  );
  const [loading, setLoading] = useState(true);

  // The socket handler reads the current user from a ref so it never has to be
  // torn down and re-subscribed just because `meId` resolved a tick later.
  const meIdRef = useRef(meId);
  meIdRef.current = meId;

  // Every message the socket delivered, with a sequence number.
  //
  // A GET /chats response describes the server at the moment the request was
  // issued. If a message lands while that request is open, applying the
  // response verbatim silently undoes the increment the live handler just made
  // and the unread badge never appears. So each request remembers the sequence
  // it started at, and replays everything that arrived after it.
  //
  // Per-request rather than one shared buffer: two requests can be open at once
  // (the list is fetched on mount and again if the effect re-runs), and a
  // shared buffer is emptied by whichever resolves first — leaving the second
  // to overwrite the very increment the first had just restored.
  const logRef = useRef([]);
  const seqRef = useRef(0);
  // Chat ids currently in the list, so the handler can tell a known chat from a
  // conversation that did not exist when the list was fetched.
  const knownIdsRef = useRef(new Set());
  // Until the first response lands, "not in the list" means "the list has not
  // arrived yet", not "new conversation". Refetching on that would issue a
  // second request whose own replay window starts after the message — and its
  // answer, being the older one, would overwrite the increment.
  const loadedRef = useRef(false);
  // Chats a message referred to but that no response has contained yet. A first
  // message CREATES the conversation, so a list fetched a moment earlier does
  // not have it and the replay has nothing to fold the message into — the count
  // can only come from asking again. Bounded: a couple of tries per chat, so a
  // message for something the server never returns cannot loop.
  const pendingChatsRef = useRef(new Map());

  const recordIncoming = useCallback((message) => {
    seqRef.current += 1;
    logRef.current.push({ seq: seqRef.current, message });
    // Only the tail can ever be replayed; anything older is already in the
    // server's answer.
    if (logRef.current.length > 50) logRef.current.splice(0, logRef.current.length - 50);
    return seqRef.current;
  }, []);

  const load = useCallback(async () => {
    const from = seqRef.current;
    try {
      const data = await getChats();
      let nd = normChats(data);
      for (const entry of logRef.current) {
        if (entry.seq > from) nd = applyIncoming(nd, entry.message, meIdRef.current);
      }
      setChats(nd);
      cacheWrite("chats", nd);
      loadedRef.current = true;

      const present = new Set(nd.chats.map((c) => c.id));
      for (const [chatId, tries] of [...pendingChatsRef.current]) {
        if (present.has(chatId)) pendingChatsRef.current.delete(chatId);
        else if (tries >= 2) pendingChatsRef.current.delete(chatId);
        else {
          pendingChatsRef.current.set(chatId, tries + 1);
          // The conversation was created by that message; give the write a beat
          // to land before asking again.
          setTimeout(() => load(), 250);
        }
      }
      return nd;
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!tokens.getAccess()) {
      setLoading(false);
      return;
    }

    load();

    // Anything the socket missed while it was down — or before it finished the
    // first handshake — is only discoverable by asking again. The replay log
    // above reconciles a response that crossed a live message; this covers the
    // opposite gap, where there was no live message *because* the socket was
    // not listening yet.
    const unsubReady = onSocketReady(() => load());

    try {
      // Update last_message + unread_count locally so the card refreshes without
      // a full refetch. Only the other participant's messages bump unread.
      const unsub = onMessage(({ message }) => {
        recordIncoming(message);
        // Membership is tested against the ref, not inside the updater: React
        // may invoke an updater more than once, and a refetch is a side effect.
        const known = knownIdsRef.current.has(message.chat);
        setChats((prev) => {
          const next = applyIncoming(prev, message, meIdRef.current);
          if (next !== prev) cacheWrite("chats", next);
          return next;
        });
        // A first message creates a conversation the list has never seen; only
        // a refetch can name it.
        if (!known) {
          if (!pendingChatsRef.current.has(message.chat))
            pendingChatsRef.current.set(message.chat, 0);
          // Before the first response lands there is nothing to compare against:
          // the in-flight request will resolve and settle it.
          if (loadedRef.current) load();
        }
      });
      return () => {
        unsubReady();
        unsub();
      };
    } catch {
      // Socket not connected yet — `onSocketReady` above is what picks it up
      // when it is, and this effect's other subscription is all that was lost.
      return unsubReady;
    }
  }, [load, recordIncoming]);

  useEffect(() => {
    knownIdsRef.current = new Set(chats.chats.map((c) => c.id));
  }, [chats]);

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

  return { chats, loading, markChatRead, refetch: load };
}

/**
 * Load messages for a single open chat thread.
 *
 * `meId` is what keeps a read receipt honest: the sender is in the same room as
 * the reader, so both ends see every `new_message` and every `messages_read`.
 * Without knowing who I am, the thread marked my own messages read the moment I
 * opened the chat and the double tick appeared before the other side had seen
 * anything.
 */
export function useChatThread(chatId, meId) {
  const cacheKey = `messages_${chatId}`;
  const [messages, setMessages] = useState(
    () => cacheRead(cacheKey)?.data ?? emptyMsgs,
  );
  const [loading, setLoading] = useState(true);
  // Read through a ref for the same reason the chat list does: the socket
  // subscription must not be torn down because `meId` resolved a tick later.
  const meIdRef = useRef(meId);
  meIdRef.current = meId;

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
            // The sender gets an echo of their own message, and `send` also
            // refetches the thread after the POST resolves. Whichever lands
            // second used to append a second copy of the same row — the list
            // has always deduped on `last_message.id`, and this is the same
            // rule for the thread.
            if (prev.messages.some((m) => m.id === message.id)) return prev;
            const next = {
              messages: [...prev.messages, message],
              total: prev.total + 1,
            };
            cacheWrite(cacheKey, next);
            return next;
          });
          // Only the peer's messages can be read by me; echoing my own send
          // back into mark_read is a read receipt for a message nobody opened.
          if (message.sender !== meIdRef.current) {
            try {
              markRead(chatId);
            } catch {}
          }
        }),
        // Mark as read the messages the reader received — never the ones they
        // sent. `readerId` says who read; both participants get this event.
        onMessagesRead(({ chatId: cid, readerId }) => {
          if (cid !== chatId) return;
          setMessages((prev) => ({
            ...prev,
            messages: prev.messages.map((m) =>
              readerId && m.sender === readerId
                ? m
                : { ...m, status: STATUS_CONSTANTS.read },
            ),
          }));
        }),
      ];
      return () => unsubs.forEach((u) => u());
    } catch {}
  }, [chatId]);

  return { messages, loading, refetch: fetchMessages };
}
