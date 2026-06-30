import { BadgeMedallion, hashHue, Header, Screen } from "@components";
import { Avatar, Btn, Card, Icon } from "@ui";

export function MyProfile({
  me,
  earnedBadges = [],
  days,
  personalRecord,
  badgeCount,
  totalBadges,
  joined,
  onEdit,
  onSettings,
  onOpenBadges,
}) {
  const username = me?.username ?? "";
  const hue = hashHue(username);
  const src = me?.profile_picture ?? null;

  const joinedLabel = joined
    ? new Date(joined).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <Screen geo="profile" padTop={56}>
      <Header
        title=""
        right={
          <button
            onClick={onSettings}
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
            <Icon name="gear" size={20} color="var(--ink-2)" />
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
        <Avatar name={username || "?"} size={106} hue={hue} src={src} />
        <div
          style={{
            fontSize: 23,
            fontWeight: 700,
            color: "var(--ink)",
            marginTop: 14,
          }}
        >
          {username || "—"}
        </div>
        {joinedLabel && (
          <div style={{ fontSize: 13.5, color: "var(--ink-3)", marginTop: 3 }}>
            Member since {joinedLabel}
          </div>
        )}
        <div style={{ marginTop: 16 }}>
          <Btn kind="outline" icon="edit" onClick={onEdit}>
            Edit profile
          </Btn>
        </div>

        <div
          style={{
            width: "100%",
            marginTop: 24,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          <Card style={{ textAlign: "center", padding: "18px 12px" }}>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: "var(--display-weight)",
                fontSize: 30,
                color: "var(--primary)",
                lineHeight: 1,
              }}
            >
              {days}
            </div>
            <div
              style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 6 }}
            >
              current streak
            </div>
          </Card>
          <Card style={{ textAlign: "center", padding: "18px 12px" }}>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: "var(--display-weight)",
                fontSize: 30,
                color: "var(--ink)",
                lineHeight: 1,
              }}
            >
              {personalRecord}
            </div>
            <div
              style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 6 }}
            >
              personal best
            </div>
          </Card>
        </div>

        <Card
          pad={0}
          onClick={onOpenBadges}
          style={{
            width: "100%",
            marginTop: 12,
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "15px 16px",
          }}
        >
          <div style={{ display: "flex" }}>
            {earnedBadges.slice(0, 3).map((b, i) => (
              <div
                key={b.id}
                style={{
                  marginLeft: i ? -14 : 0,
                  borderRadius: "50%",
                  background: "var(--surface)",
                }}
              >
                <BadgeMedallion milestone={b.milestone} earned size={40} />
              </div>
            ))}
            {earnedBadges.length === 0 && (
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "var(--surface-2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="badges" size={20} color="var(--ink-3)" />
              </div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>
              {badgeCount} badge{badgeCount !== 1 ? "s" : ""} earned
            </div>
            <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>
              {totalBadges - badgeCount} more to unlock
            </div>
          </div>
          <Icon name="chevR" size={18} color="var(--ink-3)" />
        </Card>
      </div>
    </Screen>
  );
}
