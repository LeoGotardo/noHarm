import { BottomSheet } from "@components";
import { Btn, Icon } from "@ui";
import { useEffect, useState } from "react";
import { errorMessage } from "../../connectors/api.js";
import {
  REPORT_DETAILS_MAX,
  REPORT_REASONS,
} from "../../services/api/report.js";

/**
 * Report sheet: pick a reason, optionally say what happened, send.
 *
 * `onSubmit(reason, details)` does the request. A rejection keeps the sheet
 * open with the message inline — a report is not something to make someone
 * retype — and a resolve closes it, leaving the toast to the caller.
 */
export function ReportSheet({ open, onClose, username, onSubmit }) {
  const [reason, setReason] = useState(null);
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  // Fresh every time it opens: a reason left selected from a previous report is
  // the wrong default for the next one.
  useEffect(() => {
    if (open) {
      setReason(null);
      setDetails("");
      setSending(false);
      setError(null);
    }
  }, [open]);

  const send = async () => {
    if (!reason || sending || !onSubmit) return;
    setSending(true);
    setError(null);
    try {
      await onSubmit(reason, details);
      onClose?.();
    } catch (e) {
      setError(errorMessage(e, "Couldn't send that report. Please try again."));
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
          Report {username}
        </div>
        <div
          style={{
            fontSize: 12.5,
            color: "var(--ink-3)",
            padding: "0 4px 10px",
            lineHeight: 1.5,
          }}
        >
          Only our team sees this — {username} is never told you reported them.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {REPORT_REASONS.map((r) => {
            const picked = reason === r.value;
            return (
              <button
                key={r.value}
                onClick={() => setReason(r.value)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "13px 14px",
                  background: picked ? "var(--primary-soft)" : "var(--surface-2)",
                  border: `1.5px solid ${picked ? "var(--primary)" : "var(--border)"}`,
                  borderRadius: 14,
                  cursor: "pointer",
                  width: "100%",
                  textAlign: "left",
                  color: picked ? "var(--primary)" : "var(--ink)",
                  fontSize: 15,
                  fontWeight: 600,
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
                    background: picked ? "var(--primary)" : "transparent",
                    boxShadow: picked ? "none" : "inset 0 0 0 1.5px var(--border)",
                  }}
                >
                  {picked && (
                    <Icon
                      name="check"
                      size={13}
                      color="var(--on-primary)"
                      sw={3}
                    />
                  )}
                </span>
                {r.label}
              </button>
            );
          })}
        </div>

        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value.slice(0, REPORT_DETAILS_MAX))}
          placeholder="Anything else we should know? (optional)"
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
          <Btn
            kind="outline"
            size="lg"
            full
            onClick={onClose}
            disabled={sending}
          >
            Cancel
          </Btn>
          <Btn
            kind="primary"
            size="lg"
            full
            icon="flag"
            onClick={send}
            loading={sending}
            disabled={!reason}
          >
            Send report
          </Btn>
        </div>
      </div>
    </BottomSheet>
  );
}
