import {
  CONFIRM_COPY,
  ConfirmSheet,
  EmojiButton,
  EmojiPicker,
  hashHue,
  insertAtCursor,
  RoleBadge,
} from "@components";
import { Avatar, Btn, GeoBackground, Icon, useGuardedCallback } from "@ui";
import { useEffect, useRef, useState } from "react";
import { acceptChat, rejectChat } from "../../services/api/chat.js";
import {
  readAllMessages,
  sendMessage as apiSend,
} from "../../services/api/message.js";
import { getUser } from "../../services/api/user.js";
import {
  joinChat,
  leaveChat,
  markRead,
  onTypingIndicator,
  setTyping,
} from "../../services/ws/chat.js";
import { useChatThread } from "../../store/useChats.js";
import { STATUS_CONSTANTS } from "../../services/constants.js";
import { Bubble } from "./Bubble.jsx";
import { TypingBubble } from "./TypingBubble.jsx";

export function ChatThread({
  onBack,
  chat: initialChat,
  meId,
  // This account's own `role`. Needed to tell, before the peer's profile
  // loads, which side of an official conversation this is.
  meRole,
  onOpenProfile,
  onRead,
  // `{ byMe: true, user }` when this account blocked the other person,
  // `{ byMe: false }` when they blocked it, null otherwise. Either way the
  // conversation is read-only: the history stays, nothing new goes in.
  blocked,
  onUnblock,
}) {
  const [chat, setChat] = useState(initialChat);
  const [otherUser, setOtherUser] = useState(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [typing, setPeerTyping] = useState(false);
  const [confirmIgnore, setConfirmIgnore] = useState(false);
  const [confirmUnblock, setConfirmUnblock] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  // Outgoing typing indicator: emitted on the first keystroke, then held down
  // by a rolling timer so we send one "start" and one "stop" per burst.
  const typingSentRef = useRef(false);
  const typingTimerRef = useRef(null);

  const goBack = useGuardedCallback(onBack);
  const otherId = chat.sender === meId ? chat.reciver : chat.sender;
  const { messages: msgData, loading, refetch } = useChatThread(chat.id, meId);
  const msgList = msgData?.messages ?? [];

  const scrollDown = () => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };
  useEffect(() => {
    scrollDown();
  }, [msgList.length, typing]);

  useEffect(() => {
    if (!otherId) return;
    getUser(otherId)
      .then(setOtherUser)
      .catch(() => {});
  }, [otherId]);

  useEffect(() => {
    if (!chat.id) return;
    try {
      joinChat(chat.id);
    } catch {}
    // Mark read: WS notifies the other user live; REST is the source of truth
    // and works even when the socket is down. Refresh statuses + clear the
    // list badge once persisted.
    try {
      markRead(chat.id);
    } catch {}
    readAllMessages(chat.id)
      .then(() => {
        refetch();
        onRead?.(chat.id);
      })
      .catch(() => {});
    let unsub;
    try {
      unsub = onTypingIndicator(({ chatId, userId, isTyping }) => {
        if (chatId === chat.id && userId !== meId) setPeerTyping(isTyping);
      });
    } catch {}
    return () => {
      stopTyping();
      try {
        leaveChat(chat.id);
      } catch {}
      if (unsub)
        try {
          unsub();
        } catch {}
    };
  }, [chat.id]);

  /** Tell the other participant we stopped typing (idempotent). */
  const stopTyping = () => {
    clearTimeout(typingTimerRef.current);
    if (!typingSentRef.current) return;
    typingSentRef.current = false;
    if (!chat.id) return;
    try {
      setTyping(chat.id, false);
    } catch {}
  };

  const onInputChange = (value) => {
    setInput(value);
    if (!chat.id) return;
    if (!value.trim()) {
      stopTyping();
      return;
    }
    if (!typingSentRef.current) {
      typingSentRef.current = true;
      try {
        setTyping(chat.id, true);
      } catch {}
    }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(stopTyping, 2500);
  };

  // `sending` only catches taps a render apart; two in the same tick both read
  // the same state and post twice. The guard holds until the POST settles.
  const send = useGuardedCallback(async () => {
    if (!input.trim() || sending) return;
    const content = input.trim();
    setInput("");
    setEmojiOpen(false);
    stopTyping();
    setSending(true);
    try {
      // Existing chat → send by id. No chat yet → send by user; backend creates
      // the chat and returns the message carrying its parent `chat` id.
      const sent = chat.id
        ? await apiSend({ chatId: chat.id, content })
        : await apiSend({ recipientId: otherId, content });
      if (!chat.id && sent?.chat) {
        // Adopt the freshly created chat so the thread joins its room and
        // useChatThread reloads history for the new id.
        setChat((c) => ({
          ...c,
          id: sent.chat,
          status: STATUS_CONSTANTS.enabled,
        }));
      } else {
        await refetch();
      }
    } catch (err) {
      // Surface the failure and put the text back so it isn't lost
      console.error("[ChatThread] send failed:", err);
      setInput(content);
    }
    setSending(false);
  });

  const accept = useGuardedCallback(async () => {
    if (!chat.id) return;
    try {
      const updated = await acceptChat(chat.id);
      setChat(updated);
    } catch {}
  });

  const reject = useGuardedCallback(async () => {
    if (chat.id) {
      try {
        await rejectChat(chat.id);
      } catch {}
    }
    onBack();
  });

  // Their profile is closed to whoever blocked them, so the name comes from
  // what the block row already carried.
  const who = otherUser ?? blocked?.user ?? null;
  const username = who?.username ?? "…";
  const hue = hashHue(who?.username ?? otherId ?? "");
  const src = who?.profile_picture ?? null;
  const ended = chat.status === STATUS_CONSTANTS.disabled;
  const pending = chat.status === STATUS_CONSTANTS.pending;
  // A conversation with an official NoHarm account is one-way: the backend
  // refuses a reply (OFFICIAL_CHAT_READONLY), so there is no composer to offer
  // and no invitation to accept. `chat.official` arrives with the chat itself;
  // the peer's role covers a chat object that predates the field.
  const officialPeer = chat.official
    ? meRole !== "official"
    : otherUser?.role === "official";
  const iReceived = pending && chat.reciver === meId && !officialPeer;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <GeoBackground screen="chat" />
      <div
        style={{
          position: "relative",
          zIndex: 2,
          paddingTop: 44,
          background: "var(--banner-bg)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "6px 14px 10px",
            // The bar spans the window; its contents line up with the
            // transcript below. See the comment on <Screen>.
            width: "100%",
            maxWidth: "var(--content-max)",
            margin: "0 auto",
          }}
        >
          <button
            onClick={goBack}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              display: "flex",
            }}
          >
            <Icon name="back" size={24} color="var(--ink)" sw={2.2} />
          </button>
          <div
            onClick={() => onOpenProfile(otherId)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flex: 1,
              cursor: "pointer",
            }}
          >
            <Avatar name={username} size={38} hue={hue} src={src} />
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  fontSize: 15.5,
                  fontWeight: 700,
                  color: "var(--ink)",
                }}
              >
                {username}
                <RoleBadge role={who?.role} />
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: typing ? "var(--primary)" : "var(--ink-3)",
                }}
              >
                {officialPeer
                  ? "Official NoHarm account"
                  : blocked?.byMe
                  ? "blocked"
                  : typing
                  ? "typing…"
                  : ended
                    ? "conversation ended"
                    : pending
                      ? "pending"
                      : "online"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        id="nh-thread"
        className="nh-scroll"
        style={{
          position: "relative",
          zIndex: 1,
          flex: 1,
          overflowY: "auto",
          padding: "16px 16px 8px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          width: "100%",
          maxWidth: "var(--content-max)",
          margin: "0 auto",
        }}
      >
        {officialPeer && (
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              padding: "12px 14px",
              borderRadius: 14,
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              fontSize: 13,
              color: "var(--ink-2)",
              lineHeight: 1.5,
            }}
          >
            <Icon
              name="official"
              size={18}
              color="var(--primary)"
              style={{ marginTop: 1, flexShrink: 0 }}
            />
            <div>
              <strong style={{ display: "block", color: "var(--ink)" }}>
                This is NoHarm's official account
              </strong>
              Messages here come from the NoHarm team. Replies are turned off,
              so this conversation is read-only.
            </div>
          </div>
        )}
        {loading && (
          <div
            style={{
              textAlign: "center",
              padding: "24px",
              fontSize: 13,
              color: "var(--ink-3)",
            }}
          >
            Loading…
          </div>
        )}
        {!loading && msgList.length === 0 && !ended && !officialPeer && (
          <div
            style={{
              textAlign: "center",
              padding: "40px var(--pad-x)",
              fontSize: 13.5,
              color: "var(--ink-3)",
              lineHeight: 1.5,
            }}
          >
            This is the beginning of your conversation with{" "}
            <strong style={{ color: "var(--ink)" }}>{username}</strong>.
          </div>
        )}
        {msgList.map((m) => (
          <Bubble key={m.id} msg={m} mine={m.sender === meId} />
        ))}
        {typing && <TypingBubble />}
        {ended && (
          <div
            style={{
              textAlign: "center",
              fontSize: 12.5,
              color: "var(--ink-3)",
              padding: "14px var(--pad-x)",
              lineHeight: 1.5,
            }}
          >
            This conversation has ended. You can no longer send messages here.
          </div>
        )}
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 2,
          background: "var(--surface)",
          borderTop: "1px solid var(--border)",
          padding: "10px 14px 26px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "var(--content-max)",
            margin: "0 auto",
          }}
        >
          {officialPeer ? (
            <div
              style={{
                textAlign: "center",
                color: "var(--ink-3)",
                fontSize: 13.5,
                lineHeight: 1.5,
                padding: "4px 8px",
              }}
            >
              You can't reply to the official account.
            </div>
          ) : blocked ? (
            <div
              style={{
                textAlign: "center",
                color: "var(--ink-3)",
                fontSize: 13.5,
                lineHeight: 1.5,
                padding: "4px 8px",
              }}
            >
              {blocked.byMe ? (
                <>
                  You blocked{" "}
                  <strong style={{ color: "var(--ink)" }}>{username}</strong>.
                  Unblock them to message again.
                  <div style={{ marginTop: 10 }}>
                    <Btn
                      kind="outline"
                      full
                      icon="block"
                      onClick={() => setConfirmUnblock(true)}
                    >
                      Unblock
                    </Btn>
                  </div>
                </>
              ) : (
                // Worded like any closed conversation: the person who was
                // blocked is never told so in as many words.
                "You can't send messages in this conversation."
              )}
            </div>
          ) : ended ? (
            <div
              style={{
                textAlign: "center",
                color: "var(--ink-3)",
                fontSize: 13.5,
                fontWeight: 600,
                padding: "8px",
              }}
            >
              Messaging unavailable
            </div>
          ) : iReceived ? (
            <div>
              <div
                style={{
                  fontSize: 13.5,
                  color: "var(--ink-2)",
                  textAlign: "center",
                  marginBottom: 10,
                  lineHeight: 1.5,
                }}
              >
                <strong style={{ color: "var(--ink)" }}>{username}</strong> wants
                to start a conversation.
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <Btn kind="outline" full onClick={() => setConfirmIgnore(true)}>
                  Ignore
                </Btn>
                <Btn kind="primary" full icon="check" onClick={accept}>
                  Accept
                </Btn>
              </div>
            </div>
          ) : (
            <>
            {emojiOpen && (
              <EmojiPicker
                style={{ marginBottom: 10 }}
                onPick={(emoji) =>
                  insertAtCursor(inputRef.current, input, emoji, onInputChange)
                }
              />
            )}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 9 }}>
              <div
                style={{
                  flex: 1,
                  background: "var(--surface-2)",
                  borderRadius: 22,
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  paddingLeft: 6,
                }}
              >
                <EmojiButton
                  open={emojiOpen}
                  onToggle={() => setEmojiOpen((o) => !o)}
                />
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => onInputChange(e.target.value)}
                  onBlur={stopTyping}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Message…"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    border: "none",
                    background: "none",
                    outline: "none",
                    padding: "12px 16px 12px 4px",
                    fontSize: 15,
                    color: "var(--ink)",
                    fontFamily: "var(--font-body)",
                  }}
                />
              </div>
              <button
                onClick={send}
                disabled={!input.trim() || sending}
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: "50%",
                  background: input.trim()
                    ? "var(--primary)"
                    : "var(--surface-2)",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: input.trim() ? "pointer" : "default",
                  flexShrink: 0,
                  transition: "background .2s",
                }}
              >
                <Icon
                  name="send"
                  size={20}
                  color={input.trim() ? "var(--on-primary)" : "var(--ink-3)"}
                  fill={input.trim() ? "var(--on-primary)" : "none"}
                />
              </button>
            </div>
            </>
          )}
        </div>
      </div>

      <ConfirmSheet
        open={confirmUnblock}
        onClose={() => setConfirmUnblock(false)}
        {...CONFIRM_COPY.unblock(username)}
        onConfirm={() => onUnblock?.(otherId)}
      />

      <ConfirmSheet
        open={confirmIgnore}
        onClose={() => setConfirmIgnore(false)}
        {...CONFIRM_COPY.ignoreChat(username)}
        onConfirm={reject}
      />
    </div>
  );
}
