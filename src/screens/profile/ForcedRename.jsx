import { Mark, Screen } from "@components";
import { Btn, Field, useGuardedCallback } from "@ui";
import { useState } from "react";
import { errorMessage } from "../../connectors/api.js";
import { SUPPORT_EMAIL } from "../../services/api/notice.js";
import { putMe } from "../../services/api/user.js";

/**
 * The account cannot be used until a new username is chosen.
 *
 * Moderation reached this for a name that had to stop being readable — an
 * impersonation, or something nobody should have to see beside their own
 * messages. The name is already gone: the server renamed the account to a
 * generated handle at the moment the decision was made, because a flag alone
 * would have left the old one on every friend list until the next sign-in.
 *
 * So this screen is not the sanction, it is the way out of it. It says what
 * happened, it does not accuse, and it is the only screen the app will show
 * until a name is entered — a nag the user could dismiss would leave accounts
 * sitting under `user_1a2b3c4d` for ever, which is nobody's idea of a fix.
 *
 * There is no way past it other than choosing, and no way to log out into a
 * fresh start: the account keeps its streak, its friends and its history, and
 * that is the whole reason this is not a ban.
 */
export function ForcedRename({ me, onDone }) {
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const trimmed = username.trim();
  const tooShort = trimmed.length > 0 && trimmed.length < 3;
  const unchanged = trimmed === (me?.username ?? "");
  const valid = trimmed.length >= 3 && !unchanged;

  const save = useGuardedCallback(async () => {
    if (!valid) return;
    setSaving(true);
    setError(null);
    try {
      await putMe(trimmed);
      await onDone();
    } catch (e) {
      if (e?.status === 409) setError("That username is already taken.");
      else if (e?.status === 422)
        setError("Use 3–50 characters: letters, numbers, _ or -.");
      else setError(errorMessage(e, "Could not save. Please try again."));
      setSaving(false);
    }
  });

  return (
    <Screen geo="auth" padTop={56} padBottom={28} maxWidth="var(--form-max)">
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 var(--pad-x)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
          <Mark size={54} title="NoHarm" />
        </div>

        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: "var(--display-weight)",
            fontSize: 26,
            color: "var(--ink)",
            textAlign: "center",
            lineHeight: 1.15,
          }}
        >
          Choose a new username
        </div>

        <div
          style={{
            fontSize: 14,
            color: "var(--ink-2)",
            textAlign: "center",
            lineHeight: 1.55,
            padding: "10px 4px 0",
          }}
        >
          Your previous username was removed after a review. Everything else is
          exactly as you left it — your streak, your friends, your badges.
        </div>

        <div
          style={{
            fontSize: 12.5,
            color: "var(--ink-3)",
            textAlign: "center",
            lineHeight: 1.55,
            padding: "8px 4px 20px",
          }}
        >
          Until you pick one you'll appear as{" "}
          <span style={{ color: "var(--ink-2)", fontWeight: 600 }}>
            {me?.username ?? "a temporary handle"}
          </span>
          .
        </div>

        <Field
          label="New username"
          value={username}
          onChange={setUsername}
          placeholder="3–50 characters"
          error={
            tooShort
              ? "At least 3 characters."
              : unchanged && trimmed.length >= 3
                ? "Pick something other than the temporary handle."
                : null
          }
        />

        {error && (
          <div
            style={{
              fontSize: 13,
              color: "var(--accent-ink)",
              lineHeight: 1.5,
              padding: "10px 4px 0",
            }}
          >
            {error}
          </div>
        )}

        <div style={{ marginTop: 20 }}>
          <Btn
            kind="primary"
            size="lg"
            full
            onClick={save}
            disabled={!valid}
            loading={saving}
          >
            Save and continue
          </Btn>
        </div>

        <div
          style={{
            fontSize: 12,
            color: "var(--ink-3)",
            textAlign: "center",
            lineHeight: 1.55,
            padding: "18px 6px 0",
          }}
        >
          If you think this was a mistake, write to{" "}
          <span style={{ color: "var(--ink-2)", fontWeight: 600 }}>
            {SUPPORT_EMAIL}
          </span>
          . A different person reviews it.
        </div>
      </div>
    </Screen>
  );
}
