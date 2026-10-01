import { BottomSheet, clampText, textLength } from "@components";
import { Btn, Icon } from "@ui";
import { useEffect, useState } from "react";
import { errorMessage } from "../../connectors/api.js";
import { broadcastMessage } from "../../services/api/message.js";

// Mirrors BroadcastRequest's max_length in the backend.
const MESSAGE_MAX = 2000;

/**
 * Message everyone, from the official account.
 *
 * Each person gets it in their own conversation with the account, which they
 * can read and cannot answer — the sheet says so, because whoever writes this
 * should not be waiting for replies that cannot come. Only offered to an
 * account on OFFICIAL_USER_IDS; the endpoint answers 404 to anyone else.
 */
export function BroadcastSheet({ open, onClose }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(null);

  useEffect(() => {
    if (open) {
      setMessage("");
      setSending(false);
      setError(null);
      setSent(null);
    }
  }, [open]);

  const send = async () => {
    if (sending || !message.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await broadcastMessage(message.trim());
      setSent(res?.sent ?? 0);
    } catch (e) {
      setError(errorMessage(e, "Couldn't send that message. Please try again."));
    }
    setSending(false);
  };

  return (
    <BottomSheet open={open} onClose={sending ? undefined : onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "var(--ink)",
            padding: "0 4px 2px",
          }}
        >
          Message everyone
        </div>
        <div
          style={{
            fontSize: 12.5,
            color: "var(--ink-3)",
            padding: "0 4px 10px",
            lineHeight: 1.5,
          }}
        >
          Every active account receives this in its conversation with the
          official account. They can read it, but replies are turned off.
        </div>

        {sent !== null ? (
          <>
            <div
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                background: "var(--surface-2)",
                display: "flex",
                gap: 10,
                alignItems: "center",
                fontSize: 13.5,
                color: "var(--ink)",
                lineHeight: 1.5,
              }}
            >
              <Icon name="check" size={16} color="var(--primary)" />
              Sent to {sent} {sent === 1 ? "person" : "people"}.
            </div>
            <div style={{ marginTop: 16 }}>
              <Btn kind="primary" size="lg" full onClick={onClose}>
                Done
              </Btn>
            </div>
          </>
        ) : (
          <>
            <textarea
              value={message}
              onChange={(e) => setMessage(clampText(e.target.value, MESSAGE_MAX))}
              placeholder="What would you like everyone to know?"
              rows={5}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "13px 15px",
                fontSize: 15,
                fontFamily: "var(--font-body)",
                color: "var(--ink)",
                background: "var(--surface-2)",
                border: "1.5px solid var(--border)",
                borderRadius: 14,
                outline: "none",
                resize: "none",
              }}
            />
            <div
              style={{
                fontSize: 11.5,
                color: "var(--ink-3)",
                padding: "6px 6px 0",
                textAlign: "right",
              }}
            >
              {textLength(message)}/{MESSAGE_MAX}
            </div>

            {error && (
              <div
                style={{
                  fontSize: 12.5,
                  color: "var(--accent-ink)",
                  padding: "8px 4px 0",
                  lineHeight: 1.5,
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <Btn kind="outline" size="lg" full onClick={onClose} disabled={sending}>
                Cancel
              </Btn>
              <Btn
                kind="primary"
                size="lg"
                full
                icon="send"
                onClick={send}
                loading={sending}
                disabled={!message.trim()}
              >
                Send to all
              </Btn>
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
