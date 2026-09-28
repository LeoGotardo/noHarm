import { EmptyState, Header, Screen, SegTabs, fmtLongDate, fmtTime } from "@components";
import { Card, Icon, SectionLabel, Skeleton } from "@ui";
import { useCallback, useEffect, useState } from "react";
import { errorMessage } from "../../connectors/api.js";
import { DayChart } from "./DayChart.jsx";
import { StateBars } from "./StateBars.jsx";
import {
  HEALTH_FIELDS,
  INACTIVE_STATES,
  STATUS_LABELS,
  getErrors,
  getHostAccess,
  getOverview,
  getUsers,
} from "../../services/api/admin.js";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Accounts" },
  { id: "errors", label: "Errors" },
  { id: "access", label: "Access" },
];

/**
 * The admin board.
 *
 * Reached from Settings, behind the same allowlist as the moderation queue —
 * one `ADMIN_USER_IDS` decides both, and `useModerator` probing the report
 * queue is the answer for this screen too.
 *
 * ## What it deliberately does not show
 *
 * No streak, no relapse, no message count, no per-account activity of any
 * kind. This app was built so that who is struggling cannot be read off a
 * screen, and an admin panel is precisely the screen that would undo that by
 * accident. Everything here is either a count or a fact about an account's
 * *administrative* state.
 *
 * ## Health reads zero when things are fine
 *
 * The opposite of an activity dashboard. Every field in that block is a
 * failure, and two of them — the retention jobs — fail in a way nothing else
 * reports: a deleted account past its window answers "not found" whether the
 * purge ran or not.
 */
export function AdminDashboard({ onBack }) {
  const [tab, setTab] = useState("overview");

  return (
    <Screen geo="history" padTop={56}>
      <Header title="Admin" onBack={onBack} />

      <div style={{ marginTop: 4 }}>
        <SegTabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      <div style={{ padding: "16px var(--pad-x) 0" }}>
        {tab === "overview" && <Overview />}
        {tab === "users" && <Accounts />}
        {tab === "errors" && <Errors />}
        {tab === "access" && <Access />}
      </div>
    </Screen>
  );
}

/** Fetch + loading + error, shared by all four tabs. */
function useLoaded(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetcher());
    } catch (e) {
      setError(errorMessage(e, "Couldn't load that."));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}

function Rows({ n = 4 }) {
  return (
    <Card pad={12}>
      {Array.from({ length: n }, (_, i) => (
        <Skeleton
          key={i}
          style={{ width: `${80 - i * 12}%`, height: 14, borderRadius: 7, marginTop: i ? 12 : 0 }}
        />
      ))}
    </Card>
  );
}

function Failed({ error, onRetry }) {
  return (
    <EmptyState
      icon="close"
      title="Couldn't load that"
      sub={error}
      action={{ label: "Try again", onClick: onRetry }}
    />
  );
}

/** One number with its name. The unit of this whole screen. */
function Stat({ label, value, tone }) {
  const colour =
    tone === "bad" ? "var(--accent-ink)" : tone === "good" ? "var(--primary)" : "var(--ink)";
  return (
    <div style={{ padding: "10px 4px", minWidth: 0 }}>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: "var(--display-weight)",
          fontSize: 26,
          lineHeight: 1.1,
          color: colour,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 2, lineHeight: 1.35 }}>
        {label}
      </div>
    </div>
  );
}

function StatGrid({ children }) {
  return (
    <Card pad={10}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
          gap: 4,
        }}
      >
        {children}
      </div>
    </Card>
  );
}

function Block({ label, children, note }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <SectionLabel>{label}</SectionLabel>
      {children}
      {note && (
        <div
          style={{
            fontSize: 11.5,
            color: "var(--ink-3)",
            padding: "8px 6px 0",
            lineHeight: 1.5,
          }}
        >
          {note}
        </div>
      )}
    </div>
  );
}

function Overview() {
  const [days, setDays] = useState(30);
  const { data, loading, error, reload } = useLoaded(
    () => getOverview({ days }),
    [days],
  );

  // First load gets a skeleton; a period change does not. Swapping the range
  // must not collapse the page and rebuild it — the charts hold their previous
  // render at reduced opacity and the frame stays where the reader left it.
  const reloading = loading && Boolean(data);

  if (loading && !data) return <Rows n={6} />;
  if (error) return <Failed error={error} onRetry={reload} />;
  if (!data) return null;

  const { accounts, moderation, health, security } = data;
  // Only the fields that are current failures. `distinct_faults` is history —
  // counting it would mean the board never reads healthy again after the first
  // bug — and a flagged address belongs to a different block entirely.
  const healthy = HEALTH_FIELDS.every((f) => f.context || !health[f.key]);

  return (
    <>
      <Block
        label="Accounts"
        note={`New sign-ups are cumulative: 30 days includes the last 7.`}
      >
        <StatGrid>
          <Stat label="Active" value={accounts.by_status.enabled ?? 0} />
          <Stat label="Deleted" value={accounts.by_status.deleted ?? 0} />
          <Stat label="Banned" value={accounts.bans.total} />
          <Stat label="New today" value={accounts.created["1"] ?? 0} />
          <Stat label="New · 7 days" value={accounts.created["7"] ?? 0} />
          <Stat label="New · 30 days" value={accounts.created["30"] ?? 0} />
        </StatGrid>
      </Block>

      <Block
        label="Bans and sanctions"
        note={
          "A suspension lifts itself at the next sign-in, so “expired” counts " +
          "accounts that have not come back since theirs ran out."
        }
      >
        <StatGrid>
          <Stat label="Permanent bans" value={accounts.bans.permanent} />
          <Stat label="Expired, not returned" value={accounts.bans.expired} />
          <Stat label="Username reset" value={accounts.sanctions.must_change_username} />
          <Stat label="Picture blocked" value={accounts.sanctions.picture_blocked} />
          <Stat
            label="Owe re-acceptance"
            value={accounts.consent_debt.any}
            tone={accounts.consent_debt.any ? "bad" : undefined}
          />
        </StatGrid>
      </Block>

      {/* One row, above what it scopes. Date range first, as presets: nobody
          reaches for "the last 37 days". */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "2px 2px 12px",
        }}
      >
        <SectionLabel>Over the last</SectionLabel>
        <div style={{ display: "flex", gap: 4 }}>
          {(data.series.periods ?? [7, 30, 90]).map((n) => (
            <button
              key={n}
              onClick={() => setDays(n)}
              aria-pressed={days === n}
              className="nh-tap nh-tap-row"
              style={{
                border: "none",
                cursor: "pointer",
                borderRadius: 999,
                padding: "5px 12px",
                fontSize: 12.5,
                fontWeight: days === n ? 700 : 600,
                background: days === n ? "var(--primary-soft)" : "var(--surface-2)",
                color: days === n ? "var(--primary)" : "var(--ink-3)",
              }}
            >
              {n} days
            </button>
          ))}
        </div>
      </div>

      <Card pad={16} style={{ marginBottom: 18 }}>
        {/* Two charts rather than one with two scales: sign-ups and reports
            differ by an order of magnitude, and a second y-axis would invent a
            correlation the data does not contain. */}
        <DayChart title="Sign-ups per day" data={data.series.signups} dim={reloading} />
        <div style={{ height: 1, background: "var(--border)", margin: "20px 0" }} />
        <DayChart
          title="Reports filed per day"
          data={data.series.reports}
          dim={reloading}
        />
      </Card>

      <Block label="Account states">
        <Card pad={16}>
          <StateBars
            dim={reloading}
            states={INACTIVE_STATES.map((state) => ({
              ...state,
              count: accounts.by_status[state.key] ?? 0,
            }))}
          />
        </Card>
      </Block>

      <Block
        label="Moderation"
        note="Self-harm reports are counted on their own: a place in the queue is the wrong answer for them."
      >
        <StatGrid>
          <Stat
            label="Open reports"
            value={moderation.queue.open ?? 0}
            tone={moderation.queue.open ? "bad" : undefined}
          />
          <Stat
            label="Self-harm, open"
            value={moderation.self_harm_open}
            tone={moderation.self_harm_open ? "bad" : undefined}
          />
          <Stat label="Claimed and abandoned" value={moderation.stale_locks} />
          <Stat label="Notices unread" value={moderation.unacknowledged_notices} />
          <Stat label="Actioned" value={moderation.queue.actioned ?? 0} />
          <Stat label="Dismissed" value={moderation.queue.dismissed ?? 0} />
        </StatGrid>
      </Block>

      <Block
        label="Health"
        note={
          healthy
            ? "Every number here is a failure, so zero across the board is the healthy reading."
            : undefined
        }
      >
        <Card pad={10}>
          {HEALTH_FIELDS.map((field, i) => {
            const value = health[field.key] ?? 0;
            const bad = value > 0 && !field.context;
            return (
              <div
                key={field.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 4px",
                  borderTop: i ? "1px solid var(--border)" : "none",
                }}
              >
                <Icon
                  name={bad ? "close" : "check"}
                  size={17}
                  color={bad ? "var(--accent-ink)" : "var(--primary)"}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, color: "var(--ink)" }}>{field.label}</div>
                  {bad && (
                    <div style={{ fontSize: 12, color: "var(--accent-ink)", marginTop: 2 }}>
                      {field.bad}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 16,
                    color: bad ? "var(--accent-ink)" : "var(--ink-3)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {value}
                </div>
              </div>
            );
          })}
        </Card>
      </Block>

      <Block
        label="Suspicious traffic"
        note={
          "Addresses producing an unusual number of refusals in the last " +
          `${Math.round(security.window_seconds / 60)} minutes. Nothing is blocked on these ` +
          "numbers — acting on them automatically would let anyone deny service " +
          "to a shared mobile network by pushing rubbish through it."
        }
      >
        {security.flagged_addresses.length === 0 ? (
          <Card pad={14}>
            <div style={{ fontSize: 13.5, color: "var(--ink-3)" }}>Nothing flagged.</div>
          </Card>
        ) : (
          <Card pad={8}>
            {security.flagged_addresses.map((entry, i) => (
              <div
                key={entry.ip}
                style={{
                  padding: "11px 6px",
                  borderTop: i ? "1px solid var(--border)" : "none",
                }}
              >
                <div
                  style={{
                    fontSize: 14.5,
                    fontWeight: 600,
                    color: "var(--ink)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {entry.ip}
                </div>
                <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 3 }}>
                  {Object.entries(entry.counts)
                    .map(([kind, n]) => `${kind}: ${n}`)
                    .join(" · ")}
                  {" — flagged for "}
                  {entry.reasons.join(", ")}
                </div>
              </div>
            ))}
          </Card>
        )}
      </Block>

      <div
        style={{
          fontSize: 11.5,
          color: "var(--ink-3)",
          textAlign: "center",
          padding: "4px 6px 12px",
          lineHeight: 1.5,
        }}
      >
        Computed {fmtTime(data.generated_at)} · cached for a minute, so a refresh
        can honestly return the same numbers. Opening this page is logged.
      </div>
    </>
  );
}

function Accounts() {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useLoaded(() => getUsers({ page }), [page]);

  if (loading) return <Rows n={6} />;
  if (error) return <Failed error={error} onRetry={reload} />;
  if (!data) return null;

  return (
    <>
      <Card pad={8}>
        {data.items.map((user, i) => (
          <div
            key={user.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "11px 6px",
              borderTop: i ? "1px solid var(--border)" : "none",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 14.5,
                  fontWeight: 600,
                  color: "var(--ink)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.username}
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
                Joined {fmtLongDate(user.created_at)}
                {user.banned_until && ` · banned until ${fmtLongDate(user.banned_until)}`}
                {user.must_change_username && " · owes a username"}
                {user.picture_blocked && " · picture blocked"}
              </div>
            </div>
            <div
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                padding: "4px 9px",
                borderRadius: 99,
                whiteSpace: "nowrap",
                background: user.status === 1 ? "var(--primary-soft)" : "var(--surface-2)",
                color: user.status === 1 ? "var(--primary)" : "var(--ink-2)",
              }}
            >
              {STATUS_LABELS[user.status] ?? user.status}
            </div>
          </div>
        ))}
      </Card>
      <Pager page={data.page} total={data.totalPages} hasNext={data.hasNext} onPage={setPage} />
    </>
  );
}

function Errors() {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useLoaded(() => getErrors({ page }), [page]);

  if (loading) return <Rows n={5} />;
  if (error) return <Failed error={error} onRetry={reload} />;
  if (!data) return null;

  if (!data.items.length) {
    return (
      <EmptyState
        icon="check"
        title="Nothing has failed"
        sub="One row here would be one kind of failure, however many times it happened."
      />
    );
  }

  return (
    <>
      <Card pad={8}>
        {data.items.map((fault, i) => (
          <div
            key={fault.id}
            style={{
              padding: "12px 6px",
              borderTop: i ? "1px solid var(--border)" : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink)" }}>
                {fault.exception_type}
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
                {fault.method} {fault.path} · {fault.status_code}
              </div>
            </div>
            {fault.message && (
              <div
                style={{
                  fontSize: 12.5,
                  color: "var(--ink-2)",
                  marginTop: 4,
                  lineHeight: 1.45,
                  wordBreak: "break-word",
                }}
              >
                {fault.message}
              </div>
            )}
            <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 5 }}>
              {fault.count}× · last {fmtLongDate(fault.last_seen)} at {fmtTime(fault.last_seen)}
            </div>
          </div>
        ))}
      </Card>
      <Pager page={data.page} total={data.totalPages} hasNext={data.hasNext} onPage={setPage} />
    </>
  );
}

function Access() {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useLoaded(() => getHostAccess({ page }), [page]);

  if (loading) return <Rows n={4} />;
  if (error) return <Failed error={error} onRetry={reload} />;
  if (!data) return null;

  return (
    <>
      {data.items.length === 0 ? (
        <EmptyState
          icon="lock"
          title="No logins recorded"
          sub="A cron on the host feeds this. An empty list can also mean the collector is not running."
        />
      ) : (
        <Card pad={8}>
          {data.items.map((entry, i) => (
            <div
              key={`${entry.occurred_at}-${entry.source_ip}-${entry.os_user}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 6px",
                borderTop: i ? "1px solid var(--border)" : "none",
              }}
            >
              <Icon name="lock" size={17} color="var(--ink-3)" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, color: "var(--ink)" }}>
                  <strong>{entry.os_user}</strong> from {entry.source_ip}
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
                  {fmtLongDate(entry.occurred_at)} at {fmtTime(entry.occurred_at)} · {entry.method}
                </div>
              </div>
            </div>
          ))}
        </Card>
      )}
      <div
        style={{
          fontSize: 11.5,
          color: "var(--ink-3)",
          padding: "10px 6px 0",
          lineHeight: 1.5,
        }}
      >
        Successful logins only — a public SSH port collects thousands of failed
        attempts a day and they would bury these. Anyone with root on the box
        can edit the journal before it is read, so this catches access nobody
        expected, not someone covering their tracks.
      </div>
      <Pager page={data.page} total={data.totalPages} hasNext={data.hasNext} onPage={setPage} />
    </>
  );
}

function Pager({ page, total, hasNext, onPage }) {
  if (total <= 1) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: "14px 0 4px",
        fontSize: 13,
        color: "var(--ink-3)",
      }}
    >
      <button
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        className="nh-tap nh-tap-row"
        style={{
          background: "none",
          border: "none",
          cursor: page > 1 ? "pointer" : "default",
          color: page > 1 ? "var(--primary)" : "var(--ink-3)",
          fontSize: 13,
          fontWeight: 600,
          padding: "6px 10px",
        }}
      >
        Previous
      </button>
      <span>
        {page} of {total}
      </span>
      <button
        onClick={() => onPage(page + 1)}
        disabled={!hasNext}
        className="nh-tap nh-tap-row"
        style={{
          background: "none",
          border: "none",
          cursor: hasNext ? "pointer" : "default",
          color: hasNext ? "var(--primary)" : "var(--ink-3)",
          fontSize: 13,
          fontWeight: 600,
          padding: "6px 10px",
        }}
      >
        Next
      </button>
    </div>
  );
}
