import {
  EmptyState,
  hashHue,
  Header,
  PersonRow,
  Screen
} from "@components";
import { Btn, Card, Divider, Icon } from "@ui";
import { Fragment, useEffect, useState } from "react";
import { getUser } from "../../services/api/user.js";
import { cacheRead, cacheWrite } from "../../store/cache.js";

async function enrichFriendship(friendship, meId) {
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
    online: false,
    streak: null,
  };
}

export function FriendsScreen({
  friends,
  meId,
  requestCount,
  onOpenRequests,
  onOpenSearch,
  onOpenProfile,
  onMessage,
}) {
  const [enriched, setEnriched] = useState([]);

  useEffect(() => {
    if (!meId || !friends.length) {
      setEnriched([]);
      return;
    }
    Promise.all(friends.map((f) => enrichFriendship(f, meId))).then(
      setEnriched,
    );
  }, [friends, meId]);

  return (
    <Screen geo="friends" padTop={56}>
      <Header
        large
        title="Friends"
        sub={`${enriched.length} in your circle`}
        right={
          <button
            onClick={onOpenSearch}
            style={{
              width: 42,
              height: 42,
              borderRadius: 13,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <Icon name="plus" size={22} color="var(--ink)" />
          </button>
        }
      />

      <div style={{ padding: "16px 20px 0" }}>
        {requestCount > 0 && (
          <Card
            pad={0}
            onClick={onOpenRequests}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 13,
              padding: "13px 16px",
              marginBottom: 14,
              borderColor: "var(--primary)",
            }}
          >
            <div
              style={{
                position: "relative",
                width: 40,
                height: 40,
                borderRadius: 12,
                background: "var(--primary-soft)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="friends" size={21} color="var(--primary)" />
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink)" }}
              >
                {requestCount} friend request{requestCount > 1 ? "s" : ""}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>
                Tap to review
              </div>
            </div>
            <span
              style={{
                minWidth: 22,
                height: 22,
                padding: "0 6px",
                borderRadius: 99,
                background: "var(--accent)",
                color: "#fff",
                fontSize: 12,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {requestCount}
            </span>
          </Card>
        )}

        {enriched.length === 0 ? (
          <EmptyState
            icon="friends"
            round
            title="Recovery is easier together"
            sub="Add a friend to share milestones and check in on each other."
            action={
              <Btn kind="primary" onClick={onOpenSearch} icon="search">
                Find friends
              </Btn>
            }
          />
        ) : (
          <Card pad={6}>
            {enriched.map((f, i) => (
              <Fragment key={f.id}>
                {i > 0 && <Divider />}
                <div style={{ padding: "0 8px" }}>
                  <PersonRow
                    person={f}
                    onClick={() => onOpenProfile(f.id)}
                    right={
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMessage(f.id);
                        }}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          background: "var(--primary-soft)",
                          border: "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >
                        <Icon name="chat" size={19} color="var(--primary)" />
                      </button>
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
