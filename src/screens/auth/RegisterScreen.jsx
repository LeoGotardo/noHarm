import {
  GoogleButton,
  GoogleLogoMono,
  Header,
  Screen
} from "@components";
import { Avatar, Checkbox, Field, Icon } from "@ui";
import { useState } from "react";
import { errorMessage } from "../../connectors/api.js";
import { signUp } from "../../services/api/auth.js";
import { CONSENT_COPY, LEGAL_DOCUMENTS } from "../legal/legalContent.js";
import { LegalDocument } from "../legal/LegalDocument.jsx";

// Mirrors the backend's MINIMUM_AGE_YEARS. Only ever used to answer before the
// Google popup opens — the backend enforces it and owns the real value, and if
// the two disagree the server wins with a 403 the screen shows.
const MIN_AGE = Number(import.meta.env.VITE_MINIMUM_AGE) || 18;

/** Whole years between a `YYYY-MM-DD` string and today, or null if unparseable. */
function ageFrom(isoDate) {
  if (!isoDate) return null;
  const born = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(born.getTime())) return null;
  const now = new Date();
  let years = now.getFullYear() - born.getFullYear();
  const beforeBirthday =
    now.getMonth() < born.getMonth() ||
    (now.getMonth() === born.getMonth() && now.getDate() < born.getDate());
  if (beforeBirthday) years -= 1;
  return years;
}

export function RegisterScreen({ onBack, onDone }) {
  const [username, setUsername] = useState("");
  const [birthDate, setBirthDate] = useState("");
  // Three separate answers. The first two are a condition of holding an
  // account; the third covers the streak tracker alone and is a real choice —
  // declining it creates a working account with tracking off.
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [healthDataConsent, setHealthDataConsent] = useState(false);
  const [reading, setReading] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const tooShort = username.length > 0 && username.length < 3;
  const age = ageFrom(birthDate);
  const futureDate = age !== null && age < 0;
  const underage = age !== null && age >= 0 && age < MIN_AGE;
  const canSubmit =
    username.length >= 3 &&
    !tooShort &&
    Boolean(birthDate) &&
    !underage &&
    !futureDate &&
    acceptedTerms &&
    acceptedPrivacy &&
    !loading;

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signUp(username.trim(), {
        birthDate,
        acceptedTerms,
        acceptedPrivacy,
        healthDataConsent,
      });
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
      const code = e?.body?.errorCode;
      if (code === "UNDERAGE")
        setError(
          `You need to be at least ${
            e?.body?.details?.minimumAge ?? MIN_AGE
          } to use NoHarm.`,
        );
      else if (code === "INVALID_BIRTH_DATE")
        setError("That date of birth is in the future.");
      else if (code === "CONSENT_REQUIRED")
        setError("Please accept the Terms of Use and the Privacy Policy.");
      else if (e?.status === 409)
        setError("That username is already taken. Please choose another.");
      else if (e?.status === 422)
        setError("Invalid username. Use only letters, numbers, _ or -.");
      else setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  if (reading) {
    return <LegalDocument docKey={reading} onBack={() => setReading(null)} />;
  }

  return (
    <Screen geo="auth" padTop={56} padBottom={28} maxWidth="var(--form-max)" panel>
      <Header title="Create account" onBack={onBack} />
      <div
        style={{
          padding: "14px 24px 0",
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 26,
          }}
        >
          <div style={{ position: "relative" }}>
            <Avatar name={username || "A"} size={88} hue={154} />
            <span
              style={{
                position: "absolute",
                right: -2,
                bottom: -2,
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "var(--surface)",
                border: "2px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <GoogleLogoMono size={14} color="var(--ink-3)" />
            </span>
          </div>
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--ink-3)",
            textAlign: "center",
            marginBottom: 24,
            lineHeight: 1.5,
          }}
        >
          Your profile photo will come from Google.
        </div>
        {error && (
          <div
            style={{
              display: "flex",
              gap: 10,
              padding: "12px 14px",
              borderRadius: 14,
              background: "var(--accent-soft)",
              marginBottom: 16,
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
        <Field
          label="Username"
          value={username}
          onChange={setUsername}
          placeholder="3–50 characters"
          error={tooShort ? "At least 3 characters." : null}
          hint={
            !tooShort && username.length > 0
              ? "This is how friends will find you."
              : null
          }
          right={
            username.length >= 3 ? (
              <Icon name="check" size={18} color="var(--primary)" sw={2.4} />
            ) : null
          }
        />
        <div style={{ marginTop: 16 }}>
          <Field
            label="Date of birth"
            type="date"
            value={birthDate}
            onChange={setBirthDate}
            error={
              futureDate
                ? "That date is in the future."
                : underage
                  ? `You need to be at least ${MIN_AGE} to use NoHarm.`
                  : null
            }
            hint={
              !birthDate
                ? `NoHarm is for people aged ${MIN_AGE} and over.`
                : null
            }
          />
        </div>

        <div
          style={{
            marginTop: 18,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {[
            ["terms", acceptedTerms, setAcceptedTerms],
            ["privacy", acceptedPrivacy, setAcceptedPrivacy],
            ["health_data", healthDataConsent, setHealthDataConsent],
          ].map(([key, value, set]) => (
            <div key={key}>
              <Checkbox
                checked={value}
                onChange={set}
                label={CONSENT_COPY[key].label}
                sub={CONSENT_COPY[key].sub}
              />
              {LEGAL_DOCUMENTS[key] && (
                <button
                  onClick={() => setReading(key)}
                  style={{
                    background: "none",
                    border: "none",
                    padding: "6px 12px 0",
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: "var(--primary)",
                    cursor: "pointer",
                  }}
                >
                  Read {LEGAL_DOCUMENTS[key].title}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Pushes the button to the thumb; collapsed past the breakpoint. */}
        <div className="nh-thumb-gap" style={{ minHeight: 18 }} />
        <GoogleButton
          onClick={submit}
          loading={loading}
          disabled={!canSubmit}
          variant="signup"
        />
        <div
          style={{
            textAlign: "center",
            fontSize: 12,
            color: "var(--ink-3)",
            marginTop: 14,
            lineHeight: 1.5,
          }}
        >
          This is a safe, judgment-free space. The first two are required; the
          third only turns the streak tracker on.
        </div>
      </div>
    </Screen>
  );
}
