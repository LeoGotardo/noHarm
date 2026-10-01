import { BottomSheet, clampText } from "@components";
import { Btn, Icon } from "@ui";
import { useEffect, useState } from "react";
import { errorMessage } from "../../connectors/api.js";
import { noticeCopy } from "../../services/api/notice.js";

const MESSAGE_MAX = 500;

/**
 * Send a warning: the rung between doing nothing and taking someone's account.
 *
 * It changes nothing about the account, which is what makes it usable — a
 * moderator who agrees with a report but does not think it deserves a
 * suspension had, before this, only silence to offer, and silence is what
 * almost everything got.
 *
 * The note is optional and is shown to the user verbatim. The sheet says what
 * they will see, including the line that must never appear in it.
 */
export function WarnSheet({ open, onClose, username, reason, onSubmit }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setMessage("");
      setSending(false);
      setError(null);
    }
  }, [open]);

  const copy = noticeCopy(reason);

  const send = async () => {
    if (sending) return;
    setSending(true);
    setError(null);
    try {
      await onSubmit(message);
      onClose?.();
    } catch (e) {
      setError(errorMessage(e, "Couldn't send that warning. Please try again."));
      setSending(false);
    }
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
          Warn {username}
        </div>
        <div
          style={{
            fontSize: 12.5,
            color: "var(--ink-3)",
            padding: "0 4px 10px",
            lineHeight: 1.5,
          }}
        >
          Nothing about their account changes. They see this once, on their next
          open, and acknowledge it.
        </div>

        <div
          style={{
            padding: "12px 14px",
            borderRadius: 12,
            background: "var(--surface-2)",
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
          }}
        >
          <Icon
            name="flag"
            size={15}
            color="var(--ink-3)"
            style={{ marginTop: 2, flexShrink: 0 }}
          />
          <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.5 }}>
            <strong style={{ display: "block", marginBottom: 2 }}>{copy.title}</strong>
            {copy.body}
          </div>
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(clampText(e.target.value, MESSAGE_MAX))}
          placeholder="Anything to add, in your words? (optional)"
          rows={3}
          style={{
            width: "100%",
            boxSizing: "border-box",
            marginTop: 12,
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
            lineHeight: 1.5,
          }}
        >
          They read this verbatim. Never name who reported them — that promise
          is why reports get filed at all.
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
            icon="bell"
            onClick={send}
            loading={sending}
          >
            Send warning
          </Btn>
        </div>
      </div>
    </BottomSheet>
  );
}
