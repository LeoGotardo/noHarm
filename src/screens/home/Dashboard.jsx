import { Screen, StreakRing, hashHue } from "@components";
import { Avatar, Btn, Card, Icon } from "@ui";
import { StatTile } from "./StatTile.jsx";

export function Dashboard({
  me,
  days,
  hasStreak,
  checkedIn,
  milestone,
  startLabel,
  personalRecord,
  totalStreaks,
  nextBadgeName,
  onCheckIn,
  onRelapse,
  onOpenHistory,
  onProfile,
  onStartStreak,
  pulseKey,
}) {
  const isRecord = days >= personalRecord;
  const toRecord = personalRecord - days;
  return (
    <Screen geo="home" pulseKey={pulseKey} padTop={64}>
      <div
        style={{
          padding: "0 22px 6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontSize: 13, color: "var(--ink-3)", fontWeight: 500 }}>
            Good morning,
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)" }}>
            {me?.username ?? "…"}
          </div>
        </div>
        <div onClick={onProfile} style={{ cursor: "pointer" }}>
          <Avatar
            name={me?.username ?? "?"}
            size={42}
            hue={hashHue(me?.username ?? "")}
            src={me?.profile_picture ?? null}
          />
        </div>
      </div>

      {!hasStreak ? (
        <div
          style={{
            padding: "32px 22px 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "var(--primary-soft)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 18px",
              }}
            >
              <Icon name="flame" size={34} color="var(--primary)" sw={1.4} />
            </div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: "var(--display-weight)",
                fontSize: 24,
                color: "var(--ink)",
                lineHeight: 1.2,
              }}
            >
              Begin your journey
            </div>
            <div
              style={{
                fontSize: 14.5,
                color: "var(--ink-2)",
                marginTop: 10,
                lineHeight: 1.55,
                padding: "0 12px",
              }}
            >
              Every recovery starts with a single day. When did yours begin?
            </div>
          </div>
          <div style={{ width: "100%" }}>
            <Btn
              kind="primary"
              size="lg"
              full
              icon="flame"
              onClick={onStartStreak}
            >
              Start my streak
            </Btn>
          </div>
        </div>
      ) : (
        <>
          <div style={{ padding: "14px 0 6px" }}>
            <StreakRing
              days={days}
              milestone={milestone}
              label={days === 1 ? "clean day" : "clean days"}
              sub={
                days === 0 ? "A fresh start begins now" : `Since ${startLabel}`
              }
              recordPill={
                isRecord && days > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "3px 10px",
                      borderRadius: 99,
                      background: "var(--primary-soft)",
                      color: "var(--primary)",
                      fontSize: 11,
                      fontWeight: 700,
                      marginBottom: 8,
                    }}
                  >
                    <Icon
                      name="flame"
                      size={13}
                      color="var(--primary)"
                      sw={1.6}
                    />{" "}
                    PERSONAL BEST
                  </div>
                ) : null
              }
            />
          </div>

          <div
            style={{
              textAlign: "center",
              padding: "2px 32px 18px",
              fontSize: 13.5,
              color: "var(--ink-2)",
            }}
          >
            {isRecord ? (
              <>You're in record territory — keep going.</>
            ) : (
              <>
                <strong style={{ color: "var(--primary)", fontWeight: 700 }}>
                  {milestone - days} days
                </strong>{" "}
                to your{" "}
                <strong style={{ color: "var(--ink)", fontWeight: 600 }}>
                  {nextBadgeName}
                </strong>{" "}
                badge · {toRecord} to your record
              </>
            )}
          </div>

          <div style={{ padding: "0 22px" }}>
            {checkedIn ? (
              <div
                className="nh-rise"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  padding: "15px",
                  borderRadius: 18,
                  background: "var(--primary-soft)",
                  color: "var(--primary)",
                  fontWeight: 700,
                  fontSize: 16.5,
                }}
              >
                <span
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    animation: "nhPop .5s both",
                  }}
                >
                  <Icon
                    name="check"
                    size={16}
                    color="var(--on-primary)"
                    sw={3}
                  />
                </span>
                Checked in today
              </div>
            ) : (
              <Btn
                kind="primary"
                size="lg"
                full
                onClick={onCheckIn}
                icon="check"
              >
                Check in for today
              </Btn>
            )}
          </div>
        </>
      )}

      {hasStreak && (
        <>
          <div style={{ padding: "20px 22px 0" }}>
            <Card pad={16} style={{ display: "flex", alignItems: "stretch" }}>
              <StatTile value={days} label="Current" accent />
              <div
                style={{
                  width: 1,
                  background: "var(--border)",
                  margin: "4px 0",
                }}
              />
              <StatTile value={personalRecord} label="Personal best" />
              <div
                style={{
                  width: 1,
                  background: "var(--border)",
                  margin: "4px 0",
                }}
              />
              <StatTile value={totalStreaks} label="Total streaks" />
            </Card>
          </div>

          <div style={{ padding: "12px 22px 0" }}>
            <Card
              pad={0}
              onClick={onOpenHistory}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 13,
                padding: "14px 16px",
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
                }}
              >
                <Icon name="history" size={20} color="var(--ink-2)" />
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}
                >
                  Streak history
                </div>
                <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>
                  {totalStreaks} streaks · best {personalRecord} days
                </div>
              </div>
              <Icon name="chevR" size={18} color="var(--ink-3)" />
            </Card>
          </div>

          <div style={{ padding: "18px 22px 0", textAlign: "center" }}>
            <button
              onClick={onRelapse}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--ink-3)",
                fontSize: 13.5,
                fontWeight: 600,
                padding: 8,
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              I relapsed
            </button>
          </div>
        </>
      )}
    </Screen>
  );
}
