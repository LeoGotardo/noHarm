import { BottomSheet, Header, Screen, fmtLongDate } from "@components";
import { Btn, Card, Icon, SectionLabel } from "@ui";
import { useEffect, useState } from "react";
import { errorMessage } from "../../connectors/api.js";
import {
  acceptConsents,
  getConsents,
  withdrawHealthConsent,
} from "../../services/api/consent.js";
import { exportMyData } from "../../services/api/user.js";
import { copyText, downloadJson } from "../../services/download.js";
import { LEGAL_DOCUMENTS } from "../legal/legalContent.js";
import { LinkRow } from "./LinkRow.jsx";

/**
 * Settings → Privacy & data. Three things live here, and they are the three
 * rights the app can actually honour by itself.
 *
 * - **Read what you agreed to**, with the date and the version, including the
 *   consents that were later withdrawn. A record that disappears when it stops
 *   applying is not a record.
 * - **Take a copy of everything** (`GET /users/me/export`). This is the right
 *   of access, and until this screen existed it was the only one with no
 *   implementation — deleting is the danger zone below, correcting is Edit
 *   profile.
 * - **Turn recovery-data consent on or off.** Off deletes every streak, which
 *   is the whole reason that consent is separate from the terms: it has to be
 *   refusable by someone who wants to keep their account.
 */
export function DataAndPrivacy({ onBack, onOpenDocument, onConsentChange }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [exporting, setExporting] = useState(false);
  // Set when the export could not be handed over as a file — the native shell
  // has no download manager. The JSON is shown to copy instead of being lost.
  const [exportText, setExportText] = useState(null);
  const [copied, setCopied] = useState(false);

  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const [working, setWorking] = useState(false);

  async function load() {
    try {
      setStatus(await getConsents());
      setError(null);
    } catch (e) {
      setError(errorMessage(e, "Could not load your consents."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const healthOn = Boolean(status?.health_data_consent);

  // Newest first: what someone came here to check is the current state, and
  // the history is what they scroll to.
  const history = [...(status?.consents ?? [])].reverse();

  async function runExport() {
    setExporting(true);
    setError(null);
    try {
      const data = await exportMyData();
      const stamp = new Date().toISOString().slice(0, 10);
      const result = downloadJson(`noharm-my-data-${stamp}.json`, data);
      if (!result.ok) setExportText(result.json);
    } catch (e) {
      setError(errorMessage(e, "Could not build your export. Please try again."));
    } finally {
      setExporting(false);
    }
  }

  async function setHealthConsent(on) {
    setWorking(true);
    setError(null);
    try {
      if (on) await acceptConsents(["health_data"]);
      else await withdrawHealthConsent();
      await load();
      // The streak screens read this off `GET /users/me`, so the profile has
      // to be refetched too — the streaks are gone either way.
      await onConsentChange?.();
    } catch (e) {
      setError(errorMessage(e, "Could not save that. Please try again."));
    } finally {
      setWorking(false);
      setConfirmWithdraw(false);
    }
  }

  return (
    <Screen geo="history" padTop={56}>
      <Header title="Privacy & data" onBack={onBack} />
      <div
        style={{
          padding: "14px var(--pad-x) 0",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {error && (
          <div
            style={{
              display: "flex",
              gap: 10,
              padding: "12px 14px",
              borderRadius: 14,
              background: "var(--accent-soft)",
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

        <div>
          <SectionLabel>Documents</SectionLabel>
          <Card pad={8}>
            <LinkRow
              icon="lock"
              label={LEGAL_DOCUMENTS.terms.title}
              onClick={() => onOpenDocument("terms", status?.versions?.terms)}
            />
            <LinkRow
              icon="lock"
              label={LEGAL_DOCUMENTS.privacy.title}
              onClick={() => onOpenDocument("privacy", status?.versions?.privacy)}
              last
            />
          </Card>
        </div>

        <div>
          <SectionLabel>Recovery data</SectionLabel>
          <Card pad={14}>
            <div
              style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.55 }}
            >
              {healthOn
                ? "NoHarm is keeping your clean days, check-ins and streak history. This is health information and you consented to it separately — you can withdraw that here."
                : "Tracking is off. NoHarm is not keeping any recovery data for you, and the streak screens have nothing to show until you turn it back on."}
            </div>
            <div style={{ marginTop: 14 }}>
              {healthOn ? (
                <Btn
                  kind="outline"
                  full
                  disabled={loading || working}
                  onClick={() => setConfirmWithdraw(true)}
                >
                  Withdraw consent
                </Btn>
              ) : (
                <Btn
                  kind="primary"
                  full
                  loading={working}
                  disabled={loading}
                  onClick={() => setHealthConsent(true)}
                >
                  Turn tracking on
                </Btn>
              )}
            </div>
          </Card>
        </div>

        <div>
          <SectionLabel>Your data</SectionLabel>
          <Card pad={14}>
            <div
              style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.55 }}
            >
              A copy of everything NoHarm holds about you, as a JSON file:
              profile, consents, streaks, friends, badges and your
              conversations.
            </div>
            <div style={{ marginTop: 14 }}>
              <Btn
                kind="outline"
                full
                icon="chevR"
                loading={exporting}
                onClick={runExport}
              >
                Download my data
              </Btn>
            </div>
          </Card>
        </div>

        <div>
          <SectionLabel>What you have agreed to</SectionLabel>
          <Card pad={14}>
            {loading ? (
              <div style={{ fontSize: 13.5, color: "var(--ink-3)" }}>
                Loading…
              </div>
            ) : history.length === 0 ? (
              <div style={{ fontSize: 13.5, color: "var(--ink-3)" }}>
                Nothing recorded yet.
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {history.map((c, i) => (
                  <div
                    key={`${c.document}-${c.version}-${c.accepted_at}-${i}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      alignItems: "baseline",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "var(--ink)",
                        }}
                      >
                        {LEGAL_DOCUMENTS[c.document]?.title ??
                          (c.document === "health_data"
                            ? "Recovery data"
                            : c.document)}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
                        Version {c.version} ·{" "}
                        {fmtLongDate(c.accepted_at)}
                      </div>
                    </div>
                    {c.withdrawn_at && (
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: 0.4,
                          textTransform: "uppercase",
                          color: "var(--ink-3)",
                          background: "var(--surface-2)",
                          padding: "3px 8px",
                          borderRadius: 99,
                          flexShrink: 0,
                        }}
                      >
                        Withdrawn
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div style={{ height: 8 }} />
      </div>

      <BottomSheet
        open={confirmWithdraw}
        onClose={() => setConfirmWithdraw(false)}
      >
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
            Withdraw consent?
          </div>
          <div
            style={{
              fontSize: 14,
              color: "var(--ink-2)",
              marginTop: 8,
              lineHeight: 1.5,
            }}
          >
            Your current streak and your whole streak history are deleted
            straight away. There is no grace period and this cannot be undone —
            keeping a copy of data you asked us to stop holding would defeat the
            point.
            <br />
            <br />
            Your account, friends, badges and messages stay exactly as they are.
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
            loading={working}
            onClick={() => setHealthConsent(false)}
          >
            Withdraw and delete my streaks
          </Btn>
          <Btn kind="ghost" full onClick={() => setConfirmWithdraw(false)}>
            Cancel
          </Btn>
        </div>
      </BottomSheet>

      <BottomSheet open={Boolean(exportText)} onClose={() => setExportText(null)}>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>
            Your data
          </div>
          <div
            style={{
              fontSize: 13.5,
              color: "var(--ink-2)",
              marginTop: 6,
              lineHeight: 1.5,
            }}
          >
            This app cannot save files to your device, so here it is to copy.
            Opening NoHarm in a browser gives you a download instead.
          </div>
        </div>
        <textarea
          readOnly
          value={exportText ?? ""}
          style={{
            width: "100%",
            boxSizing: "border-box",
            height: 220,
            padding: 12,
            fontSize: 11.5,
            fontFamily: "ui-monospace, monospace",
            lineHeight: 1.45,
            color: "var(--ink)",
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            resize: "none",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginTop: 14,
          }}
        >
          <Btn
            kind="primary"
            full
            onClick={async () => {
              setCopied(await copyText(exportText ?? ""));
            }}
          >
            {copied ? "Copied" : "Copy to clipboard"}
          </Btn>
          <Btn
            kind="ghost"
            full
            onClick={() => {
              setExportText(null);
              setCopied(false);
            }}
          >
            Close
          </Btn>
        </div>
      </BottomSheet>
    </Screen>
  );
}
