import { Header, Screen, fmtLongDate, fmtTime, hashHue } from "@components";
import { Avatar, Btn, Card, Icon, SectionLabel, Skeleton } from "@ui";
import { useEffect, useRef, useState } from "react";
import { errorMessage } from "../../connectors/api.js";
import {
  PROFILE_REASONS,
  REPORT_STATUS,
  claimReport,
  getEvidence,
  parseProfileEvidence,
  reasonLabel,
  releaseReport,
  resetUsername,
  resolveReport,
  setPictureBlocked,
  suspendUser,
} from "../../services/api/moderation.js";
import { warnUser } from "../../services/api/notice.js";
import { ProfileSanctionSheet } from "./ProfileSanctionSheet.jsx";
import { SuspendSheet } from "./SuspendSheet.jsx";
import { WarnSheet } from "./WarnSheet.jsx";

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", gap: 12, padding: "8px 4px" }}>
      <div style={{ fontSize: 13, color: "var(--ink-3)", width: 92, flexShrink: 0 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 13.5,
          color: "var(--ink)",
          flex: 1,
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Note({ icon, tone = "quiet", children }) {
  const danger = tone === "danger";
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        padding: "10px 12px",
        borderRadius: 12,
        background: danger ? "var(--accent-soft)" : "var(--surface-2)",
      }}
    >
      <Icon
        name={icon}
        size={15}
        color={danger ? "var(--accent-ink)" : "var(--ink-3)"}
        style={{ marginTop: 1, flexShrink: 0 }}
      />
      <div
        style={{
          fontSize: 12.5,
          lineHeight: 1.5,
          color: danger ? "var(--accent-ink)" : "var(--ink-2)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** One captured message, laid out as the conversation it was. */
function MessageBubble({ item, reportedUid }) {
  const fromReported = item.author_id === reportedUid;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: fromReported ? "flex-start" : "flex-end",
        marginBottom: 8,
      }}
    >
      <div style={{ maxWidth: "82%" }}>
        <div
          style={{
            fontSize: 10.5,
            color: "var(--ink-3)",
            marginBottom: 3,
            textAlign: fromReported ? "left" : "right",
          }}
        >
          {fromReported ? "Reported account" : "Reporter"}
          {item.occurred_at ? ` · ${fmtTime(item.occurred_at)}` : ""}
        </div>
        <div
          style={{
            padding: "9px 12px",
            borderRadius: 14,
            fontSize: 14,
            lineHeight: 1.45,
            color: "var(--ink)",
            background: fromReported ? "var(--surface-2)" : "var(--primary-soft)",
            border: "1px solid var(--border)",
            wordBreak: "break-word",
          }}
        >
          {item.content}
        </div>
      </div>
    </div>
  );
}

/**
 * One report, everything captured with it, and the two decisions that can
 * follow — which are deliberately separate.
 *
 * Opening this **claims** the report, so a second moderator is told someone is
 * on it; leaving without deciding releases it. Reading the evidence writes an
 * audit entry naming this moderator: it is two users' private messages, and a
 * power to read them that leaves no trace is indistinguishable from one being
 * abused.
 */
export function ReportReview({ onBack, report, onDecided, onToast }) {
  const [evidence, setEvidence] = useState(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [pictureOpen, setPictureOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [heldByOther, setHeldByOther] = useState(false);
  const [busy, setBusy] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [warnOpen, setWarnOpen] = useState(false);
  const [status, setStatus] = useState(report.status);
  // Tracks whether *this* screen took the lock, so leaving only releases a
  // lock it is actually holding.
  const claimed = useRef(false);

  const open = status === REPORT_STATUS.open;
  const username = report.reported_username ?? report.reported_uid ?? "this account";

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (report.status === REPORT_STATUS.open) {
        try {
          await claimReport(report.id);
          claimed.current = true;
        } catch (e) {
          // 409: someone else is on it. Reading is still fine — deciding is
          // what would collide, and those buttons go away below.
          if (!cancelled && e?.status === 409) setHeldByOther(true);
        }
      }

      try {
        const res = await getEvidence(report.id);
        if (!cancelled) setEvidence(res.evidence ?? []);
      } catch (e) {
        if (!cancelled) setError(errorMessage(e, "Couldn't load the evidence."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [report.id, report.status]);

  const leave = async () => {
    // Released on the way out: a lock nobody is holding is a report nobody
    // else can touch for half an hour.
    if (claimed.current && status === REPORT_STATUS.open) {
      try {
        await releaseReport(report.id);
      } catch {
        /* the lock expires on its own — never block going back */
      }
    }
    onBack();
  };

  const decide = async (outcome) => {
    setBusy(true);
    try {
      await resolveReport(report.id, outcome);
      claimed.current = false;
      setStatus(
        outcome === "accepted" ? REPORT_STATUS.actioned : REPORT_STATUS.dismissed,
      );
      onToast?.(outcome === "accepted" ? "Marked as actioned" : "Report dismissed");
      onDecided?.();
      onBack();
    } catch (e) {
      setError(errorMessage(e, "Couldn't close that report."));
    } finally {
      setBusy(false);
    }
  };

  const suspend = async (days, message) => {
    await suspendUser(report.reported_uid, days, report.reason, message);
    onToast?.(
      days === null ? "Account banned" : `Account suspended for ${days} day${days === 1 ? "" : "s"}`,
    );
  };

  const warn = async (message) => {
    await warnUser(report.reported_uid, report.reason, message);
    onToast?.("Warning sent");
  };

  const resetName = async (message) => {
    const res = await resetUsername(report.reported_uid, report.reason, message);
    onToast?.(`Renamed to ${res?.username ?? "a neutral handle"}`);
  };

  const blockPicture = async (message) => {
    await setPictureBlocked(report.reported_uid, true, report.reason, message);
    onToast?.("Picture removed");
  };

  const profile = evidence?.find((item) => item.kind === "profile");
  const messages = evidence?.filter((item) => item.kind === "message") ?? [];
  const snapshot = profile ? parseProfileEvidence(profile.content) : null;

  return (
    <Screen geo="history" padTop={56}>
      <Header title="Report" onBack={leave} />

      <div
        style={{
          padding: "10px var(--pad-x) 0",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {heldByOther && (
          <Note icon="lock" tone="danger">
            Another moderator is reviewing this report. You can read it, but
            closing it is theirs to do until their claim expires.
          </Note>
        )}

        {!open && (
          <Note icon="check">
            Already reviewed — {status === REPORT_STATUS.actioned ? "actioned" : "dismissed"}.
          </Note>
        )}

        <div>
          <SectionLabel>The report</SectionLabel>
          <Card pad={10}>
            <Row label="Account" value={username} />
            <Row label="Reason" value={reasonLabel(report.reason)} />
            <Row label="Filed" value={fmtLongDate(report.created_at)} />
            {/* By name. The promise that a reported user never learns who
                complained is about the reported user — a moderator cannot
                weigh a complaint without knowing whether the same person filed
                the last four. The uid stays, because two people can pick
                similar names and only one of them filed this. */}
            <Row
              label="Reporter"
              value={
                report.reporter ? (
                  <>
                    {report.reporter_username ?? "name unavailable"}
                    <span style={{ color: "var(--ink-3)", fontSize: 12 }}>
                      {" · "}
                      {report.reporter}
                    </span>
                  </>
                ) : (
                  "account deleted"
                )
              }
            />
            {report.details && (
              <Row
                label="In their words"
                value={
                  <span style={{ fontStyle: "italic", lineHeight: 1.5 }}>
                    “{report.details}”
                  </span>
                }
              />
            )}
          </Card>
        </div>

        <div>
          <SectionLabel>Evidence</SectionLabel>
          {loading ? (
            <Card pad={12}>
              <Skeleton style={{ width: "70%", height: 14, borderRadius: 7 }} />
              <Skeleton
                style={{ width: "90%", height: 14, borderRadius: 7, marginTop: 10 }}
              />
              <Skeleton
                style={{ width: "50%", height: 14, borderRadius: 7, marginTop: 10 }}
              />
            </Card>
          ) : error ? (
            <Card pad={12}>
              <div style={{ fontSize: 13, color: "var(--accent-ink)" }}>{error}</div>
            </Card>
          ) : (
            <Card pad={12}>
              {snapshot && (
                <div style={{ marginBottom: messages.length ? 14 : 0 }}>
                  <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 10 }}>
                    The account as it was when the report was filed
                  </div>
                  {/* Shown, not described. A report about a name or a picture
                      cannot be decided from the words "Picture: set" — the
                      photo and the handle *are* the evidence, which is why
                      they are captured at filing time and why they are drawn
                      here at a size a moderator can actually judge. */}
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <Avatar
                      name={snapshot.username ?? "?"}
                      src={snapshot.profile_picture ?? null}
                      size={64}
                      hue={hashHue(snapshot.username ?? "")}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: "var(--ink)",
                          wordBreak: "break-word",
                        }}
                      >
                        {snapshot.username ?? "—"}
                      </div>
                      <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 2 }}>
                        {snapshot.profile_picture
                          ? "Picture as captured"
                          : "No picture at the time"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {messages.length > 0 ? (
                <>
                  <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 8 }}>
                    Last {messages.length} messages of the conversation, both sides
                  </div>
                  {messages.map((item) => (
                    <MessageBubble
                      key={item.id}
                      item={item}
                      reportedUid={report.reported_uid}
                    />
                  ))}
                </>
              ) : (
                <div style={{ fontSize: 13, color: "var(--ink-3)", lineHeight: 1.5 }}>
                  No conversation was attached — the report was filed from a
                  profile, not from a chat.
                </div>
              )}
            </Card>
          )}
          {!loading && !error && (
            <div
              style={{
                fontSize: 11.5,
                color: "var(--ink-3)",
                padding: "8px 6px 0",
                lineHeight: 1.5,
              }}
            >
              You opening this was logged. The copy is kept for 180 days after
              the report is closed, then deleted.
            </div>
          )}
        </div>

        {open && !heldByOther && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingBottom: 8 }}>
            <SectionLabel>Decide</SectionLabel>
            {report.reason === "self_harm" ? (
              <Note icon="heart">
                This is someone worried about a friend, not a complaint. It is
                not answered with a warning or a suspension — reach out with
                crisis resources, then close it as actioned.
              </Note>
            ) : (
              <Note icon="flag">
                A warning changes nothing about the account and is where most
                cases should stop. Suspending and closing are still two steps:
                closing a report never punishes anyone by itself, which is what
                keeps a busy queue from turning into decisions nobody chose.
              </Note>
            )}
            {/* Offered only for the two reasons that are about the profile
                itself. These are not rungs of the conduct ladder — they take
                away the thing being complained about and leave the account
                otherwise untouched, which is why they sit above a warning
                rather than beside a suspension. */}
            {PROFILE_REASONS.has(report.reason) && (
              <>
                <Btn
                  kind="outline"
                  size="lg"
                  full
                  icon="edit"
                  onClick={() => setRenameOpen(true)}
                  disabled={busy}
                >
                  Reset their username
                </Btn>
                <Btn
                  kind="outline"
                  size="lg"
                  full
                  icon="camera"
                  onClick={() => setPictureOpen(true)}
                  disabled={busy}
                >
                  Remove their picture
                </Btn>
              </>
            )}
            {/* The ladder, in order. A warning changes nothing about the
                account, which is exactly why it is the rung most cases stop
                at — and the one that did not exist before. */}
            <Btn
              kind="outline"
              size="lg"
              full
              icon="bell"
              onClick={() => setWarnOpen(true)}
              disabled={busy || report.reason === "self_harm"}
            >
              Send a warning
            </Btn>
            <Btn
              kind="outline"
              size="lg"
              full
              icon="block"
              onClick={() => setSuspendOpen(true)}
              disabled={busy}
            >
              Suspend this account
            </Btn>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn
                kind="outline"
                size="lg"
                full
                onClick={() => decide("ignored")}
                disabled={busy}
              >
                Dismiss
              </Btn>
              <Btn
                kind="primary"
                size="lg"
                full
                icon="check"
                onClick={() => decide("accepted")}
                loading={busy}
              >
                Mark actioned
              </Btn>
            </div>
          </div>
        )}
      </div>

      <SuspendSheet
        open={suspendOpen}
        onClose={() => setSuspendOpen(false)}
        username={username}
        onSubmit={suspend}
      />

      <ProfileSanctionSheet
        kind="rename"
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        username={username}
        onSubmit={resetName}
      />

      <ProfileSanctionSheet
        kind="picture"
        open={pictureOpen}
        onClose={() => setPictureOpen(false)}
        username={username}
        onSubmit={blockPicture}
      />

      <WarnSheet
        open={warnOpen}
        onClose={() => setWarnOpen(false)}
        username={username}
        reason={report.reason}
        onSubmit={warn}
      />
    </Screen>
  );
}
