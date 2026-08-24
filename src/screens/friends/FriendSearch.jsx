import { EmptyState, Header, PersonRow, Screen } from "@components";
import { Card, Divider, Field, Icon } from "@ui";
import { Fragment, useEffect, useState } from "react";

export function FriendSearch({
  onBack,
  pool,
  poolComplete = true,
  onLoadMore,
  onOpenProfile,
  onSendRequest,
}) {
  const [q, setQ] = useState("");
  const [sentTo, setSentTo] = useState({});
  const trimmed = q.trim().toLowerCase();
  const results =
    trimmed.length < 2
      ? []
      : pool.filter((p) => p.username.toLowerCase().includes(trimmed));

  // There is no search endpoint, so the directory is filtered locally. When the
  // loaded slice has no match we widen it a page at a time until something
  // turns up or the directory runs out — otherwise anyone past the first page
  // would be unfindable.
  const searching = trimmed.length >= 2 && results.length === 0 && !poolComplete;
  useEffect(() => {
    if (!searching || !onLoadMore) return;
    let cancelled = false;
    (async () => {
      const more = await onLoadMore();
      if (cancelled || !more) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [searching, pool.length, onLoadMore]);

  return (
    <Screen geo="friends" padTop={56}>
      <Header title="Add friends" onBack={onBack} />
      <div style={{ padding: "12px 20px 0" }}>
        <Field
          value={q}
          onChange={setQ}
          placeholder="Search by username…"
          right={<Icon name="search" size={18} color="var(--ink-3)" />}
        />
      </div>
      <div style={{ padding: "16px 20px 0" }}>
        {trimmed.length < 2 ? (
          <EmptyState
            icon="search"
            iconSize={32}
            pad="50px 30px"
            sub={
              <>
                Type at least 2 characters to search.
                <br />
                Usernames are private — only exact matches show.
              </>
            }
          />
        ) : searching ? (
          <EmptyState
            icon="search"
            iconSize={32}
            pad="50px 30px"
            title="Searching…"
            sub="Looking through the directory."
          />
        ) : results.length === 0 ? (
          <EmptyState
            pad="50px 30px"
            title="No one found"
            sub={`No user matches "${q}".`}
          />
        ) : (
          <Card pad={6}>
            {results.map((p, i) => {
              const rel = sentTo[p.id] ? "pending" : p.rel;
              return (
                <Fragment key={p.id}>
                  {i > 0 && <Divider />}
                  <div style={{ padding: "0 8px" }}>
                    <PersonRow
                      person={p}
                      onClick={() => onOpenProfile(p.id)}
                      right={
                        rel === "friend" ? (
                          <span
                            style={{
                              fontSize: 12.5,
                              fontWeight: 600,
                              color: "var(--primary)",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Icon
                              name="check"
                              size={15}
                              color="var(--primary)"
                              sw={2.4}
                            />
                            Friends
                          </span>
                        ) : rel === "pending" ? (
                          <span
                            style={{
                              fontSize: 12.5,
                              fontWeight: 600,
                              color: "var(--ink-3)",
                            }}
                          >
                            Requested
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSentTo((s) => ({ ...s, [p.id]: true }));
                              onSendRequest(p.id);
                            }}
                            style={{
                              padding: "8px 16px",
                              borderRadius: 12,
                              background: "var(--primary)",
                              border: "none",
                              color: "var(--on-primary)",
                              fontSize: 13,
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                            }}
                          >
                            <Icon
                              name="plus"
                              size={15}
                              color="var(--on-primary)"
                              sw={2.4}
                            />
                            Add
                          </button>
                        )
                      }
                    />
                  </div>
                </Fragment>
              );
            })}
          </Card>
        )}
      </div>
    </Screen>
  );
}
