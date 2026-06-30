import { GoogleButton, Header, Logo, Screen } from "@components";
import { Icon } from "@ui";
import { useState } from "react";
import { signIn } from "../../services/api/auth.js";

export function LoginScreen({ onBack, onDone }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      const msg = e?.body?.detail ?? e?.message ?? null;
      if (e?.status === 403)
        setError("This account has been suspended. Please contact support.");
      else if (e?.status === 404)
        setError("No account found. Try signing up instead.");
      else setError(msg ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen geo="auth" padTop={56} padBottom={28}>
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
    </Screen>
  );
}
