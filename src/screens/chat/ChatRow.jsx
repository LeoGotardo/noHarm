import { fmtTime, hashHue } from "@components";
import { Avatar, useGuardedCallback } from "@ui";
import { STATUS_CONSTANTS } from "../../services/constants.js";

export function ChatRow({ c, meId, users, onOpen, onOpenProfile, selected }) {

  const open = useGuardedCallback(onOpen);
  const openProfile = useGuardedCallback(onOpenProfile);
  const otherId = c.sender === meId ? c.reciver : c.sender;
  const u = users[otherId];
  const username = u?.username ?? "…";
  const hue = hashHue(u?.username ?? otherId ?? "");
  const src = u?.profile_picture ?? null;
  const pending = c.status === STATUS_CONSTANTS.pending;
  // Backend provides last_message + unread_count per chat (GET /chats).
  const lastMsg = c.last_message ?? c.lastMessage;
  const lastText = lastMsg?.message ?? "";
  const lastTime = fmtTime(lastMsg?.send_at ?? lastMsg?.created_at);
  const unread = c.unread_count ?? 0;
  return (
    <div
      className="nh-tap nh-tap-row"
      onClick={() => open(c.id)}
      aria-current={selected ? "true" : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 13,
        padding: "12px 8px",
        cursor: "pointer",
        // Two panes without this is a list you cannot read: the transcript on
        // the right belongs to one of these rows and nothing says which.
        background: selected ? "var(--primary-soft)" : undefined,
        borderRadius: selected ? 12 : undefined,
      }}
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          openProfile(otherId);
        }}
        style={{ cursor: "pointer" }}
      >
        <Avatar name={username} size={52} hue={hue} src={src} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 15.5,
              fontWeight: unread ? 700 : 600,
              color: "var(--ink)",
            }}
          >
            {username}
          </span>
          {pending && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "var(--accent-ink)",
                background: "var(--accent-soft)",
                padding: "2px 7px",
                borderRadius: 99,
              }}
            >
              PENDING
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: 13.5,
            color: unread ? "var(--ink-2)" : "var(--ink-3)",
            fontWeight: unread ? 600 : 400,
            marginTop: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {lastText ||
            (pending ? "Wants to start a conversation" : "No messages yet")}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 6,
        }}
      >
        <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
          {lastTime}
        </span>
        {unread > 0 && (
          <span
            style={{
              minWidth: 20,
              height: 20,
              padding: "0 6px",
              borderRadius: 99,
              background: "var(--primary)",
              color: "var(--on-primary)",
              fontSize: 11.5,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {unread}
          </span>
        )}
      </div>
    </div>
  );
}
