import { BottomSheet, Mark, Screen } from "@components";
import { Btn, Checkbox, Icon, useGuardedCallback } from "@ui";
import { useEffect, useState } from "react";
import { errorMessage } from "../../connectors/api.js";
import {
  acceptConsents,
  getConsents,
  withdrawHealthConsent,
} from "../../services/api/consent.js";
import { CONSENT_COPY, LEGAL_DOCUMENTS } from "./legalContent.js";
import { LegalDocument } from "./LegalDocument.jsx";

/**
 * The account owes an answer on something, and the app shows nothing else.
 *
 * The same shape as `ForcedRename`: not a banner beside the app but instead of
 * it. A dismissible prompt is one people dismiss, and the state it leaves
 * behind — an account using a service under terms it never accepted — is the
 * exact state this screen exists to make impossible.
 *
 * ## Two kinds of pending, and they end differently
 *
 * `terms` and `privacy` are a condition of holding an account: there is no way
 * past this screen without ticking both. That is not a dark pattern, it is what
 * the alternative would be — the way to refuse them is to close the account,
 * and the screen says so.
 *
 * `health_data` only ever appears here when an **active** consent has gone out
 * of date; an account that declined it or withdrew it is never asked again.
 * Leaving it unticked is therefore a real choice, and it has to resolve to
 * something: continuing without it withdraws the consent, which deletes every
 * streak. That is confirmed first, and it is what keeps this screen from
 * reappearing for ever on an account that keeps saying no.
 */
export function ConsentGate({ onDone }) {
  // `GET /users/me` said something is pending; this asks what, and for which
  // versions. Fetched here rather than threaded down as props so there is one
  // description of the account's consent state in the app, and it is the
  // server's.
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ticked, setTicked] = useState({});
  const [reading, setReading] = useState(null);
  const [confirmDrop, setConfirmDrop] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    let live = true;
    getConsents()
      .then((data) => {
        if (!live) return;
        setStatus(data);
        // The profile and this call can disagree — another device may have
        // answered in between. The server's newer word wins, and an empty
        // `pending` means there is nothing to show.
        if ((data.pending ?? []).length === 0) onDone();
      })
      .catch((e) => {
        if (live) setError(errorMessage(e, "Could not load what is pending."));
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, []);

  const pending = status?.pending ?? [];
  const versions = status?.versions;
  const binding = pending.filter((d) => d !== "health_data");
  const healthPending = pending.includes("health_data");
  const bindingDone = binding.every((d) => ticked[d]);

  if (reading) {
    return (
      <LegalDocument
        docKey={reading}
        version={versions?.[reading]}
        onBack={() => setReading(null)}
      />
    );
  }

  const submit = async (keepHealth) => {
    setSaving(true);
    setError(null);
    try {
      const accepting = [...binding, ...(keepHealth ? ["health_data"] : [])];
      if (accepting.length) await acceptConsents(accepting);
      // Only after the acceptances land. Withdrawing first and then failing to
      // record the rest would delete the streaks and leave the gate up.
      if (healthPending && !keepHealth) await withdrawHealthConsent();
      await onDone();
    } catch (e) {
      setError(errorMessage(e, "Could not save. Please try again."));
      setSaving(false);
    }
  };

  const proceed = useGuardedCallback(async () => {
    if (!bindingDone) {
      setShowErrors(true);
      return;
    }
    if (healthPending && !ticked.health_data) {
      setConfirmDrop(true);
      return;
    }
    await submit(Boolean(ticked.health_data));
  });

  if (loading) {
    return (
      <Screen geo="auth" padTop={56} padBottom={28} maxWidth="var(--form-max)">
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13.5,
            color: "var(--ink-3)",
          }}
        >
          Loading…
        </div>
      </Screen>
    );
  }

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
        <div
          style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}
        >
          <Mark size={48} title="NoHarm" />
        </div>

        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: "var(--display-weight)",
            fontSize: 25,
            color: "var(--ink)",
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          Before you continue
        </div>
        <div
          style={{
            fontSize: 14,
            color: "var(--ink-2)",
            textAlign: "center",
            lineHeight: 1.55,
            marginBottom: 22,
          }}
        >
          {binding.length
            ? "We have updated what you agreed to when you joined. Please read it and confirm."
            : "One of your choices covers a document that has changed. Please confirm it still stands."}
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

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {pending.map((docKey) => (
            <div key={docKey}>
              <Checkbox
                checked={Boolean(ticked[docKey])}
                onChange={(v) => setTicked((t) => ({ ...t, [docKey]: v }))}
                label={CONSENT_COPY[docKey]?.label ?? docKey}
                sub={CONSENT_COPY[docKey]?.sub}
                error={
                  showErrors && docKey !== "health_data" && !ticked[docKey]
                }
              />
              {LEGAL_DOCUMENTS[docKey] && (
                <button
                  onClick={() => setReading(docKey)}
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
                  Read {LEGAL_DOCUMENTS[docKey].title}
                </button>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 22 }}>
          <Btn kind="primary" full loading={saving} onClick={proceed}>
            Continue
          </Btn>
        </div>

        {binding.length > 0 && (
          <div
            style={{
              textAlign: "center",
              fontSize: 12,
              color: "var(--ink-3)",
              marginTop: 14,
              lineHeight: 1.5,
            }}
          >
            You need to accept these to keep using NoHarm. If you would rather
            not, you can delete your account from Settings.
          </div>
        )}
      </div>

      <BottomSheet open={confirmDrop} onClose={() => setConfirmDrop(false)}>
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
            <Icon name="trash" size={26} color="var(--accent-ink)" />
          </div>
          <div style={{ fontSize: 19, fontWeight: 700, color: "var(--ink)" }}>
            Turn off tracking?
          </div>
          <div
            style={{
              fontSize: 14,
              color: "var(--ink-2)",
              marginTop: 8,
              lineHeight: 1.5,
            }}
          >
            Without this consent we cannot keep your recovery data, so your
            current streak and your whole streak history are deleted. This
            cannot be undone.
            <br />
            <br />
            Your account, friends and messages are unaffected, and you can turn
            tracking back on later — starting from zero.
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
          <Btn
            kind="danger"
            full
            loading={saving}
            onClick={async () => {
              setConfirmDrop(false);
              await submit(false);
            }}
          >
            Turn it off and delete my streaks
          </Btn>
          <Btn
            kind="ghost"
            full
            onClick={() => {
              setConfirmDrop(false);
              setTicked((t) => ({ ...t, health_data: true }));
            }}
          >
            Keep tracking
          </Btn>
        </div>
      </BottomSheet>
    </Screen>
  );
}
