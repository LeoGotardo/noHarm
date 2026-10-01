import { BottomSheet, clampText } from "@components";
import { Btn, Icon } from "@ui";
import { useEffect, useState } from "react";
import { errorMessage } from "../../connectors/api.js";

const MESSAGE_MAX = 500;

/**
 * Take away the name or the picture — the two reports that are about the
 * profile itself rather than about anything the person did.
 *
 * Neither is a rung of the conduct ladder. A suspension answers behaviour by
 * removing the account for a while; these remove the offending thing and leave
 * the account working, with its streak, its friends and its history. That is
 * deliberately the narrowest possible sanction: an impersonating handle is a
 * problem with a handle, and answering it by taking someone's recovery tracker
 * away is not proportionate.
 */
const COPY = {
  rename: {
    title: (u) => `Reset ${u}'s username`,
    lede:
      "Their handle is replaced right now with a neutral one, and the app asks " +
      "them for a new name before they can use it again. Nothing else changes.",
    note: {
      icon: "edit",
      title: "What they see",
      body:
        "A screen asking them to choose a new username, with your note. They " +
        "keep their streak, friends and history.",
    },
    warning:
      "The old name stays in this report's evidence and in the audit log — " +
      "resetting it does not erase what was reported.",
    cta: "Reset username",
    ctaIcon: "edit",
    failure: "Couldn't reset that username. Please try again.",
  },
  picture: {
    title: (u) => `Remove ${u}'s picture`,
    lede:
      "The photo is deleted and a new one is refused until an admin lifts the " +
      "block. Their account keeps working.",
    note: {
      icon: "camera",
      title: "What they see",
      body:
        "Their picture gone, the edit screen refusing a new one, and a notice " +
        "with your note saying why.",
    },
    warning:
      "This also stops the photo being pulled back from their Google account " +
      "at the next sign-in, which is what makes the block hold.",
    cta: "Remove picture",
    ctaIcon: "camera",
    failure: "Couldn't remove that picture. Please try again.",
  },
};

export function ProfileSanctionSheet({ kind, open, onClose, username, onSubmit }) {
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

  const copy = COPY[kind];

  const send = async () => {
    if (sending) return;
    setSending(true);
    setError(null);
    try {
      await onSubmit(message);
      onClose?.();
    } catch (e) {
      setError(errorMessage(e, copy.failure));
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
          {copy.title(username)}
        </div>
        <div
          style={{
            fontSize: 12.5,
            color: "var(--ink-3)",
            padding: "0 4px 10px",
            lineHeight: 1.5,
          }}
        >
          {copy.lede}
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
            name={copy.note.icon}
            size={15}
            color="var(--ink-3)"
            style={{ marginTop: 2, flexShrink: 0 }}
          />
          <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.5 }}>
            <strong style={{ display: "block", marginBottom: 2 }}>
              {copy.note.title}
            </strong>
            {copy.note.body}
          </div>
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(clampText(e.target.value, MESSAGE_MAX))}
          placeholder="Why, in your words? (optional)"
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
          is why reports get filed at all. {copy.warning}
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
            icon={copy.ctaIcon}
            onClick={send}
            loading={sending}
          >
            {copy.cta}
          </Btn>
        </div>
      </div>
    </BottomSheet>
  );
}
