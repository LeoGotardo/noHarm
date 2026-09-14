import { BottomSheet } from "@components";
import { Btn, Icon } from "@ui";
import { useEffect, useState } from "react";
import { errorMessage } from "../../connectors/api.js";

/**
 * How long to suspend an account for.
 *
 * Fixed windows plus "permanently", which is a separate, deliberate choice —
 * `days: null` in the API, spelled out there for the same reason it is spelled
 * out here: a permanent ban should never be what happens when someone is in a
 * hurry.
 *
 * The ladder these mirror lives in the moderation policy: a first offence is a
 * warning, reincidence steps up, and only a short list of things (a threat, a
 * minor, deliberately pushing someone toward a relapse) skips straight to the
 * end.
 */
const WINDOWS = [
  { days: 1, label: "24 hours", sub: "A pause. First-time, minor." },
  { days: 7, label: "7 days", sub: "Repeated, or harassment." },
  { days: 30, label: "30 days", sub: "Serious, or it kept happening." },
  { days: null, label: "Permanent", sub: "No way back. Threats, minors, drugs.", danger: true },
];

export function SuspendSheet({ open, onClose, username, onSubmit }) {
  const [choice, setChoice] = useState(undefined);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setChoice(undefined);
      setMessage("");
      setSending(false);
      setError(null);
    }
  }, [open]);

  const send = async () => {
    if (choice === undefined || sending) return;
    setSending(true);
    setError(null);
    try {
      await onSubmit(choice, message);
      onClose?.();
    } catch (e) {
      setError(errorMessage(e, "Couldn't apply that. Please try again."));
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
          Suspend {username}
        </div>
        <div
          style={{
            fontSize: 12.5,
            color: "var(--ink-3)",
            padding: "0 4px 10px",
            lineHeight: 1.5,
          }}
        >
          They cannot sign in until it ends, and it ends by itself — nothing to
          remember. Their streak and friends are untouched.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {WINDOWS.map((w) => {
            const picked = choice === w.days;
            const accent = w.danger ? "var(--accent-ink)" : "var(--primary)";
            const soft = w.danger ? "var(--accent-soft)" : "var(--primary-soft)";
            return (
              <button
                key={w.label}
                onClick={() => setChoice(w.days)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  background: picked ? soft : "var(--surface-2)",
                  border: `1.5px solid ${picked ? accent : "var(--border)"}`,
                  borderRadius: 14,
                  cursor: "pointer",
                  width: "100%",
                  textAlign: "left",
                  fontFamily: "var(--font-body)",
                }}
              >
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: picked ? accent : "transparent",
                    boxShadow: picked ? "none" : "inset 0 0 0 1.5px var(--border)",
                  }}
                >
                  {picked && (
                    <Icon name="check" size={13} color="var(--on-primary)" sw={3} />
                  )}
                </span>
                <span style={{ flex: 1 }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: 15,
                      fontWeight: 600,
                      color: picked ? accent : "var(--ink)",
                    }}
                  >
                    {w.label}
                  </span>
                  <span
                    style={{ display: "block", fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}
                  >
                    {w.sub}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, 500))}
          placeholder="What to tell them, in your words? (optional)"
          rows={2}
          style={{
            width: "100%",
            boxSizing: "border-box",
            marginTop: 12,
            padding: "12px 14px",
            fontSize: 14.5,
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
          They read this when they come back. Never name who reported them.
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
            icon="block"
            onClick={send}
            loading={sending}
            disabled={choice === undefined}
          >
            Suspend
          </Btn>
        </div>
      </div>
    </BottomSheet>
  );
}
