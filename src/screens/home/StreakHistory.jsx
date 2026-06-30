import { EmptyState, fmtLongDate, Header, Screen } from "@components";
import { Card, Icon, SectionLabel } from "@ui";
import { useEffect, useState } from "react";
import { getStreakHistory } from "../../services/api/streak.js";
import { cacheRead, cacheWrite } from "../../store/cache.js";

function streakDays(s) {
  const end = s.end_at ?? new Date().toISOString();
  return Math.max(
    0,
    Math.floor((new Date(end) - new Date(s.start_at)) / 86_400_000),
  );
}

export function StreakHistory({ onBack, currentDays, currentStart, empty }) {
  const [streaks, setStreaks] = useState(
    () => cacheRead("streak_history")?.data ?? [],
  );
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    getStreakHistory(true, 1, 20).then((res) => {
      const list = res.streaks ?? res.items ?? [];
      setStreaks(list);
      setHasMore(res.hasNext ?? false);
      cacheWrite("streak_history", list);
    });
  }, []);

  const loadMore = async () => {
    setLoadingMore(true);
    const next = page + 1;
    try {
      const res = await getStreakHistory(true, next, 20);
      const list = res.streaks ?? res.items ?? [];
      setStreaks((prev) => [...prev, ...list]);
      setHasMore(res.hasNext ?? false);
      setPage(next);
    } finally {
      setLoadingMore(false);
    }
  };

  // Exclude the active streak (status 1, no end) from history list
  const past = streaks.filter(
    (s) => s.end_at !== null && s.end_at !== undefined,
  );

  return (
    <Screen geo="history" padTop={56}>
      <Header title="Streak history" onBack={onBack} />
      <div
        style={{
          padding: "14px 20px 0",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {!empty && (
          <Card
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              borderColor: "var(--primary)",
              boxShadow:
                "0 0 0 1px var(--primary), 0 8px 24px -16px var(--primary)",
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                background: "var(--primary-soft)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="flame" size={24} color="var(--primary)" sw={1.4} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)" }}
                >
                  {currentDays} days
                </span>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: "var(--primary)",
                    background: "var(--primary-soft)",
                    padding: "2px 7px",
                    borderRadius: 99,
                  }}
                >
                  ACTIVE
                </span>
              </div>
              <div
                style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 2 }}
              >
                Since {currentStart} · going strong
              </div>
            </div>
          </Card>
        )}

        {empty && past.length === 0 ? (
          <EmptyState
            icon="flame"
            iconBg="var(--primary-soft)"
            iconColor="var(--primary)"
            iconSw={1.4}
            round
            pad="60px 30px"
            title="Your first streak is still going strong!"
            sub="Past streaks will appear here. For now, focus on today."
          />
        ) : (
          <>
            <SectionLabel style={{ padding: "6px 4px 0" }}>
              Past streaks
            </SectionLabel>
            {past.map((s, i) => {
              const days = streakDays(s);
              return (
                <Card
                  key={s.id}
                  pad={15}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    animation: "nhRise .4s both",
                    animationDelay: `${i * 0.04}s`,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 13,
                      background: "var(--surface-2)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: "var(--display-weight)",
                        fontSize: 18,
                        color: "var(--ink)",
                        lineHeight: 1,
                      }}
                    >
                      {days}
                    </span>
                    <span
                      style={{
                        fontSize: 8.5,
                        color: "var(--ink-3)",
                        fontWeight: 600,
                      }}
                    >
                      DAYS
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 14.5,
                        fontWeight: 600,
                        color: "var(--ink)",
                      }}
                    >
                      {fmtLongDate(s.start_at)} → {fmtLongDate(s.end_at)}
                    </div>
                    {s.is_record && (
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          marginTop: 5,
                          fontSize: 11,
                          fontWeight: 700,
                          color: "var(--accent-ink)",
                          background: "var(--accent-soft)",
                          padding: "2px 8px",
                          borderRadius: 99,
                        }}
                      >
                        <Icon
                          name="badges"
                          size={12}
                          color="var(--accent-ink)"
                          sw={1.6}
                          fill="var(--accent-ink)"
                        />{" "}
                        Record at the time
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
            {hasMore && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: "8px 0 4px",
                }}
              >
                {loadingMore ? (
                  <span
                    className="nh-spin"
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      border: "2.5px solid var(--border)",
                      borderTopColor: "var(--primary)",
                    }}
                  />
                ) : (
                  <button
                    onClick={loadMore}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--ink-3)",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: 8,
                    }}
                  >
                    Load older streaks
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Screen>
  );
}
