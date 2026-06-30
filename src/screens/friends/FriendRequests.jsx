import { EmptyState, Header, PersonRow, Screen, SegTabs, fmtRelDate, hashHue } from "@components";
import { Card, Divider, Icon } from "@ui";
import { Fragment, useEffect, useState } from "react";
import { getUser } from "../../services/api/user.js";
import { cacheRead, cacheWrite } from "../../store/cache.js";

async function enrichRequest(friendship, meId) {
  const otherId =
    friendship.sender === meId ? friendship.reciver : friendship.sender;
  const cacheKey = `user_${otherId}`;
  const cached = cacheRead(cacheKey);
  const user =
    cached?.data ??
    (await getUser(otherId)
      .then((u) => {
        cacheWrite(cacheKey, u);
        return u;
      })
      .catch(() => null));
  return {
    friendshipId: friendship.id,
    id: otherId,
    username: user?.username ?? otherId.slice(0, 8),
    profile_picture: user?.profile_picture ?? null,
    hue: hashHue(user?.username),
    streak: null,
    when: fmtRelDate(friendship.send_at ?? friendship.created_at),
  };
}

export function FriendRequests({
  onBack,
  received,
  sent,
  meId,
  onAccept,
  onDecline,
  onCancel,
  onOpenProfile,
}) {
  const [tab, setTab] = useState("received");
  const [enrichedRecv, setEnrichedRecv] = useState([]);
  const [enrichedSent, setEnrichedSent] = useState([]);

  useEffect(() => {
    if (!meId) return;
    Promise.all(received.map((f) => enrichRequest(f, meId))).then(
      setEnrichedRecv,
    );
  }, [received, meId]);

  useEffect(() => {
    if (!meId) return;
    Promise.all(sent.map((f) => enrichRequest(f, meId))).then(setEnrichedSent);
  }, [sent, meId]);

  const list = tab === "received" ? enrichedRecv : enrichedSent;

  return (
    <Screen geo="friends" padTop={56}>
      <Header title="Requests" onBack={onBack} />
      <div style={{ paddingTop: 8 }}>
        <SegTabs
          tabs={[
            { id: "received", label: "Received" },
            { id: "sent", label: "Sent" },
          ]}
          active={tab}
          onChange={setTab}
          counts={{ received: enrichedRecv.length }}
        />
      </div>
      <div style={{ padding: "16px 20px 0" }}>
        {list.length === 0 ? (
          <EmptyState
            icon={tab === "received" ? "bell" : "send"}
            pad="60px 24px"
            title={
              tab === "received" ? "No new requests" : "No pending requests"
            }
            sub={
              tab === "received"
                ? "You're all caught up."
                : "Requests you send will appear here."
            }
          />
        ) : (
          <Card pad={6}>
            {list.map((p, i) => (
              <Fragment key={p.friendshipId}>
                {i > 0 && <Divider />}
                <div style={{ padding: "0 8px" }}>
                  <PersonRow
                    person={p}
                    onClick={() => onOpenProfile(p.id)}
                    sub={p.when}
                    right={
                      tab === "received" ? (
                        <div style={{ display: "flex", gap: 7 }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDecline(p.friendshipId);
                            }}
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 12,
                              background: "var(--surface-2)",
                              border: "none",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                            }}
                          >
                            <Icon
                              name="close"
                              size={18}
                              color="var(--ink-2)"
                              sw={2.2}
                            />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAccept(p.friendshipId);
                            }}
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 12,
                              background: "var(--primary)",
                              border: "none",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                            }}
                          >
                            <Icon
                              name="check"
                              size={19}
                              color="var(--on-primary)"
                              sw={2.6}
                            />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCancel(p.friendshipId);
                          }}
                          style={{
                            padding: "8px 14px",
                            borderRadius: 11,
                            background: "var(--surface-2)",
                            border: "none",
                            color: "var(--ink-2)",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Cancel
                        </button>
                      )
                    }
                  />
                </div>
              </Fragment>
            ))}
          </Card>
        )}
      </div>
    </Screen>
  );
}
