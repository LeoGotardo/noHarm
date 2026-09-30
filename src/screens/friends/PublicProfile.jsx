import {
  BottomSheet,
  hashHue,
  Header,
  RoleBadge,
  Screen
} from "@components";
import { Avatar, Btn, Card, Icon, Skeleton } from "@ui";
import { useEffect, useState } from "react";
import { getUser, getUserStats } from "../../services/api/user.js";
import { cachedUser, cacheWrite } from "../../store/cache.js";
import { ReportSheet } from "./ReportSheet.jsx";
import { SheetAction } from "./SheetAction.jsx";

export function PublicProfile({
  onBack,
  userId,
  relation,
  onMessage,
  onAdd,
  onAccept,
  onReject,
  onRemove,
  onBlock,
  onReport,
}) {
  const [user, setUser] = useState(
    () => cachedUser(userId),
  );
  const [rel, setRel] = useState(relation);
  const [menu, setMenu] = useState(false);
  const [report, setReport] = useState(false);
  const [loading, setLoading] = useState(!user);
  // Activity numbers live behind their own endpoint: they are friends-only, and
  // the profile itself is not. Null while loading, and `visible: false` when the
  // viewer is not a friend — both render as the placeholder, never as a 0 that
  // would read as "this person lost their streak".
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!userId) return;
    const cached = cachedUser(userId);
    if (cached) {
      setUser(cached);
      setLoading(false);
      return;
    }
    getUser(userId)
      .then((u) => {
        setUser(u);
        cacheWrite(`user_${userId}`, u);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  // Not cached: a friend's streak changes daily, and a stale number here is
  // worse than a placeholder. Re-read whenever the relationship changes too —
  // accepting a request is exactly when these become visible.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setStats(null);
    getUserStats(userId)
      .then((s) => {
        if (!cancelled) setStats(s);
      })
      .catch(() => {
        if (!cancelled) setStats({ visible: false });
      });
    return () => {
      cancelled = true;
    };
  }, [userId, rel]);

  const username = user?.username ?? "...";
  const hue = hashHue(user?.username);

  return (
    <Screen geo="profile" padTop={56}>
      <Header
        title=""
        onBack={onBack}
        right={
          <button
            onClick={() => setMenu(true)}
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <Icon name="gear" size={19} color="var(--ink-2)" />
          </button>
        }
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "8px 24px 0",
          position: "relative",
          zIndex: 1,
        }}
      >
        {loading ? (
          <>
            <Skeleton
              style={{ width: 104, height: 104, borderRadius: "50%" }}
            />
            <Skeleton
              style={{ width: 140, height: 22, borderRadius: 8, marginTop: 14 }}
            />
            <Skeleton
              style={{ width: 100, height: 16, borderRadius: 8, marginTop: 8 }}
            />
          </>
        ) : (
          <>
            <Avatar
              name={username}
              size={104}
              hue={hue}
              src={user?.profile_picture}
            />
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "var(--ink)",
                marginTop: 14,
              }}
            >
              {username}
            </div>
            {user?.role && (
              <div style={{ marginTop: 6 }}>
                <RoleBadge role={user.role} size="md" />
              </div>
            )}
            <div
              style={{ fontSize: 13.5, color: "var(--ink-3)", marginTop: 3 }}
            >
              {rel === "friend" ? "Friend" : "Add to see activity"}
            </div>
          </>
        )}

        <Card
          style={{
            width: "100%",
            marginTop: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            padding: "18px 16px",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: "var(--display-weight)",
                fontSize: 30,
                color: rel === "friend" ? "var(--primary)" : "var(--ink-3)",
                lineHeight: 1,
              }}
            >
              {stats?.visible ? stats.day_streak : rel === "friend" ? "—" : "?"}
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 5 }}>
              day streak
            </div>
          </div>
          <div
            style={{
              width: 1,
              alignSelf: "stretch",
              background: "var(--border)",
              margin: "4px 0",
            }}
          />
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: "var(--display-weight)",
                fontSize: 30,
                color: "var(--ink)",
                lineHeight: 1,
              }}
            >
              {stats?.visible ? stats.badges_earned : "—"}
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 5 }}>
              badges earned
            </div>
          </div>
        </Card>

        <div style={{ width: "100%", marginTop: 22 }}>
          {rel === "friend" && (
            <Btn kind="primary" size="lg" full icon="chat" onClick={onMessage}>
              Message
            </Btn>
          )}
          {rel === "none" && (
            <Btn
              kind="primary"
              size="lg"
              full
              icon="plus"
              onClick={() => {
                setRel("pending_out");
                onAdd?.();
              }}
            >
              Add friend
            </Btn>
          )}
          {rel === "pending_out" && (
            <Btn kind="quiet" size="lg" full disabled>
              Request sent
            </Btn>
          )}
          {rel === "pending_in" && (
            <div style={{ display: "flex", gap: 10 }}>
              <Btn
                kind="outline"
                size="lg"
                full
                onClick={() => {
                  setRel("none");
                  onReject?.();
                }}
              >
                Decline
              </Btn>
              <Btn
                kind="primary"
                size="lg"
                full
                icon="check"
                onClick={() => {
                  setRel("friend");
                  onAccept?.();
                }}
              >
                Accept
              </Btn>
            </div>
          )}
          {rel === "blocked" && (
            <Btn kind="quiet" size="lg" full disabled>
              Blocked
            </Btn>
          )}
        </div>
      </div>

      <BottomSheet open={menu} onClose={() => setMenu(false)}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--ink)",
              padding: "0 4px 8px",
            }}
          >
            {username}
          </div>
          {rel === "friend" && (
            <SheetAction
              icon="trash"
              label="Remove friend"
              onClick={() => {
                setMenu(false);
                setRel("none");
                onRemove?.();
              }}
            />
          )}
          <SheetAction
            icon="flag"
            label="Report this user"
            onClick={() => {
              setMenu(false);
              setReport(true);
            }}
          />
          <SheetAction
            icon="block"
            label="Block this user"
            danger
            onClick={() => {
              setMenu(false);
              setRel("blocked");
              onBlock?.();
            }}
          />
          <div
            style={{
              fontSize: 12.5,
              color: "var(--ink-3)",
              padding: "8px 6px 0",
              lineHeight: 1.5,
            }}
          >
            Blocking removes them from your friends and hides your activity from
            each other. Reporting is private — they are never told.
          </div>
        </div>
      </BottomSheet>

      <ReportSheet
        open={report}
        onClose={() => setReport(false)}
        username={username}
        onSubmit={onReport}
      />
    </Screen>
  );
}
