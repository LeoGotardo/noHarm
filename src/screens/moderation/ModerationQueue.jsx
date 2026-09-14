import { EmptyState, Header, Screen, SegTabs, fmtRelDate } from "@components";
import { Card, Icon, Skeleton } from "@ui";
import { useCallback, useEffect, useState } from "react";
import { errorMessage } from "../../connectors/api.js";
import {
  REPORT_STATUS,
  getQueue,
  reasonLabel,
} from "../../services/api/moderation.js";

const TABS = [
  { id: "open", label: "Open" },
  { id: "actioned", label: "Actioned" },
  { id: "dismissed", label: "Dismissed" },
];

const STATUS_OF = {
  open: REPORT_STATUS.open,
  actioned: REPORT_STATUS.actioned,
  dismissed: REPORT_STATUS.dismissed,
};

/** A lock older than this is stale — the backend ignores it too. */
const LOCK_MINUTES = 30;

function isHeld(report, meId) {
  if (!report.locked_by || !report.locked_at) return null;
  const age = (Date.now() - new Date(report.locked_at).getTime()) / 60000;
  if (age > LOCK_MINUTES) return null;
  return report.locked_by === meId ? "mine" : "theirs";
}

function ReportRow({ report, meId, onOpen, last }) {
  const held = isHeld(report, meId);

  return (
    <button
      onClick={onOpen}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "13px 4px",
        background: "none",
        border: "none",
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        borderBottom: last ? "none" : "1px solid var(--border)",
        fontFamily: "var(--font-body)",
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 11,
          background: "var(--surface-2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon name="flag" size={18} color="var(--ink-2)" />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "var(--ink)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {/* The username copied when the report was filed — the account may
              have renamed itself, or be gone entirely. */}
          {report.reported_username ?? report.reported_uid ?? "Unknown account"}
        </div>
        <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 2 }}>
          {reasonLabel(report.reason)} · {fmtRelDate(report.created_at)}
        </div>
      </div>

      {held && (
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: 0.3,
            textTransform: "uppercase",
            color: held === "mine" ? "var(--primary)" : "var(--ink-3)",
            background:
              held === "mine" ? "var(--primary-soft)" : "var(--surface-2)",
            padding: "3px 8px",
            borderRadius: 99,
            flexShrink: 0,
          }}
        >
          {held === "mine" ? "Yours" : "In review"}
        </span>
      )}
      <Icon name="chevR" size={17} color="var(--ink-3)" />
    </button>
  );
}

/**
 * The moderation queue.
 *
 * Reached from Settings, and only by an account the backend answers `GET
 * /reports` for — see `store/useModeration.js`. Everyone else never sees the
 * row, and would get a 404 here anyway.
 */
export function ModerationQueue({ onBack, meId, onOpenReport, reloadKey }) {
  const [tab, setTab] = useState("open");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getQueue(STATUS_OF[tab]);
      setReports(res.reports ?? res.items ?? []);
    } catch (e) {
      setError(errorMessage(e, "Couldn't load the queue."));
    } finally {
      setLoading(false);
    }
  }, [tab]);

  // `reloadKey` changes when a report comes back decided, so the list a
  // moderator returns to is not the one they left.
  useEffect(() => {
    load();
  }, [load, reloadKey]);

  return (
    <Screen geo="history" padTop={56}>
      <Header
        title="Moderation"
        sub={loading ? undefined : `${reports.length} ${tab}`}
        onBack={onBack}
      />

      <div style={{ marginTop: 4 }}>
        <SegTabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      <div style={{ padding: "14px 20px 0" }}>
        {loading ? (
          <Card pad={8}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  padding: "13px 4px",
                }}
              >
                <Skeleton style={{ width: 38, height: 38, borderRadius: 11 }} />
                <div style={{ flex: 1 }}>
                  <Skeleton style={{ width: "55%", height: 14, borderRadius: 7 }} />
                  <Skeleton
                    style={{ width: "35%", height: 11, borderRadius: 6, marginTop: 7 }}
                  />
                </div>
              </div>
            ))}
          </Card>
        ) : error ? (
          <EmptyState
            icon="close"
            title="Couldn't load the queue"
            sub={error}
            action={{ label: "Try again", onClick: load }}
          />
        ) : reports.length === 0 ? (
          <EmptyState
            icon="check"
            title={tab === "open" ? "Nothing waiting" : `No ${tab} reports`}
            sub={
              tab === "open"
                ? "Every report has been reviewed."
                : "Reports you close show up here."
            }
          />
        ) : (
          <Card pad={8}>
            {reports.map((report, i) => (
              <ReportRow
                key={report.id}
                report={report}
                meId={meId}
                last={i === reports.length - 1}
                onOpen={() => onOpenReport(report)}
              />
            ))}
          </Card>
        )}
      </div>
    </Screen>
  );
}
