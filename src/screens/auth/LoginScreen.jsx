import { BottomSheet, GoogleButton, Header, Logo, Screen } from "@components";
import { Btn, Icon } from "@ui";
import { useState } from "react";
import { errorMessage } from "../../connectors/api.js";
import { reactivate, signIn } from "../../services/api/auth.js";
import { SUPPORT_EMAIL } from "../../services/api/notice.js";

/** "March 3, 2027" from the ISO instant the backend sends. */
function fmtDeadline(iso) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function LoginScreen({ onBack, onDone }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Set when the backend answers ACCOUNT_PENDING_DELETION: the account is still
  // restorable, and this holds what the restore needs.
  const [restore, setRestore] = useState(null);
  const [restoring, setRestoring] = useState(false);

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signIn();
      if (result?.success === false) {
        if (
          result.errorCode === "auth/popup-closed-by-user" ||
          result.errorCode === "auth/cancelled-popup-request"
        )
          return;
        setError("Google sign-in failed. Please try again.");
        return;
      }
      onDone();
    } catch (e) {
      // Checked before the generic 403: a deletion that has not run yet is a
      // question ("want it back?"), not a rejection.
      if (e?.body?.errorCode === "ACCOUNT_PENDING_DELETION") {
        setRestore({
          idToken: e.idToken,
          deadline: fmtDeadline(e.deletionScheduledAt),
        });
      } else if (e?.body?.errorCode === "ACCOUNT_SUSPENDED") {
        // A suspension ends. Saying only "suspended" to someone serving three
        // days reads as "your account is gone", and in a recovery app the
        // account is a streak and a friend list — the date is the difference
        // between a pause and a loss.
        const until = fmtDeadline(e.body?.details?.suspendedUntil);
        const when = until
          ? `This account is paused until ${until}. You can sign in again then.`
          : "This account is paused. You can sign in again when it ends.";
        // The appeal route, said where the refusal is — anywhere else and
        // nobody finds it. A different person reviews it; that is the policy
        // this line is promising, and docs/operations.md is where it is kept.
        setError(`${when} If you think it was a mistake, write to ${SUPPORT_EMAIL}.`);
      } else if (e?.status === 403)
        setError("This account has been suspended. Please contact support.");
      else if (e?.status === 404)
        setError("No account found. Try signing up instead.");
      else setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const confirmRestore = async () => {
    setRestoring(true);
    try {
      await reactivate(restore.idToken);
      setRestore(null);
      onDone();
    } catch (e) {
      setRestore(null);
      setError(errorMessage(e, "We couldn't restore your account. Please try again."));
    } finally {
      setRestoring(false);
    }
  };

  return (
    <Screen geo="auth" padTop={56} padBottom={28} maxWidth="var(--form-max)">
      <Header title="Welcome back" onBack={onBack} />
      <div
        style={{
          padding: "20px 24px 0",
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 28,
          }}
        >
          <Logo size={64} />
        </div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "var(--ink)",
            textAlign: "center",
            marginBottom: 4,
            fontFamily: "var(--font-display)",
          }}
        >
          Good to see you again
        </div>
        <div
          style={{
            fontSize: 14.5,
            color: "var(--ink-3)",
            textAlign: "center",
            marginBottom: 32,
          }}
        >
          Your streak is still going strong.
        </div>
        {error && (
          <div
            style={{
              display: "flex",
              gap: 10,
              padding: "12px 14px",
              borderRadius: 14,
              background: "var(--accent-soft)",
              marginBottom: 20,
              alignItems: "flex-start",
            }}
          >
            <Icon
              name="bell"
              size={18}
              color="var(--accent-ink)"
              style={{ marginTop: 1 }}
            />
            <div
              style={{
                fontSize: 13.5,
                color: "var(--accent-ink)",
                lineHeight: 1.45,
                fontWeight: 500,
              }}
            >
              {error}
            </div>
          </div>
        )}
        <div style={{ flex: 1 }} />
        <GoogleButton onClick={submit} loading={loading} variant="signin" />
        <div
          style={{
            textAlign: "center",
            fontSize: 12,
            color: "var(--ink-3)",
            marginTop: 16,
            lineHeight: 1.6,
          }}
        >
          We only use Google to verify your identity.
          <br />
          We never post anything on your behalf.
        </div>
      </div>
      <BottomSheet open={!!restore} onClose={() => setRestore(null)}>
        <div style={{ textAlign: "center", marginBottom: 6 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "var(--accent-soft)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
            }}
          >
            <Icon name="heart" size={26} color="var(--accent-ink)" />
          </div>
          <div style={{ fontSize: 19, fontWeight: 700, color: "var(--ink)" }}>
            Want your account back?
          </div>
          <div
            style={{
              fontSize: 14,
              color: "var(--ink-2)",
              marginTop: 8,
              lineHeight: 1.5,
            }}
          >
            You deleted this account and it hasn't been erased yet. Restore it
            and your streak, badges and friends come back exactly as they were.
            {restore?.deadline && (
              <>
                <br />
                <br />
                If you do nothing, it is permanently deleted on{" "}
                <strong>{restore.deadline}</strong>.
              </>
            )}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginTop: 18,
          }}
        >
          <Btn full loading={restoring} onClick={confirmRestore}>
            Restore my account
          </Btn>
          <Btn kind="ghost" full onClick={() => setRestore(null)}>
            Leave it deleted
          </Btn>
        </div>
      </BottomSheet>
    </Screen>
  );
}
