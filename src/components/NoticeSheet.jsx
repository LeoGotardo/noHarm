import { BottomSheet } from "@components";
import { Btn, Icon } from "@ui";
import { useState } from "react";
import { SUPPORT_EMAIL, noticeCopy } from "../services/api/notice.js";
import { fmtLongDate } from "./utils.js";

/**
 * What moderation decided, told to the person it was about.
 *
 * Tone is the whole design here. This is a recovery app: the account holds a
 * streak and the people keeping someone company, and a notice that reads as
 * "you are in trouble" is one that makes them close the app on the day they
 * most need it. So it says what happened, what changes (usually nothing), and
 * where to argue — and then gets out of the way.
 *
 * What it never says is who reported them.
 */
export function NoticeSheet({ notice, onAcknowledge }) {
  const [busy, setBusy] = useState(false);
  if (!notice) return null;

  const copy = noticeCopy(notice.reason);
  const suspension = notice.kind === "suspension";

  const confirm = async () => {
    setBusy(true);
    await onAcknowledge(notice.id);
    setBusy(false);
  };

  return (
    <BottomSheet open onClose={undefined}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "var(--surface-2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="flag" size={24} color="var(--ink-2)" />
          </div>
        </div>

        <div
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: "var(--ink)",
            textAlign: "center",
            fontFamily: "var(--font-display)",
          }}
        >
          {copy.title}
        </div>

        <div
          style={{
            fontSize: 14,
            color: "var(--ink-2)",
            textAlign: "center",
            lineHeight: 1.55,
            padding: "6px 6px 2px",
          }}
        >
          {copy.body}
        </div>

        {notice.message && (
          <div
            style={{
              margin: "10px 2px 0",
              padding: "12px 14px",
              borderRadius: 12,
              background: "var(--surface-2)",
              fontSize: 13.5,
              color: "var(--ink)",
              lineHeight: 1.5,
            }}
          >
            {notice.message}
          </div>
        )}

        <div
          style={{
            fontSize: 12.5,
            color: "var(--ink-3)",
            textAlign: "center",
            lineHeight: 1.55,
            padding: "12px 6px 0",
          }}
        >
          {suspension
            ? "Your account was paused. Your streak and your friends are exactly where you left them."
            : "Nothing has changed about your account — no pause, no limits. This is us telling you once."}
        </div>

        <div
          style={{
            fontSize: 12,
            color: "var(--ink-3)",
            textAlign: "center",
            lineHeight: 1.55,
            padding: "10px 6px 0",
          }}
        >
          If you think this was a mistake, write to{" "}
          <span style={{ color: "var(--ink-2)", fontWeight: 600 }}>
            {SUPPORT_EMAIL}
          </span>
          . A different person reviews it. · {fmtLongDate(notice.created_at)}
        </div>

        <div style={{ marginTop: 16 }}>
          <Btn kind="primary" size="lg" full onClick={confirm} loading={busy}>
            I understand
          </Btn>
        </div>
      </div>
    </BottomSheet>
  );
}
