import {
  EmptyState,
  fmtRelDate,
  hashHue,
  Header,
  PersonRow,
  Screen,
} from "@components";
import { Card, Divider, Icon, SectionLabel } from "@ui";
import { Fragment, useEffect, useRef, useState } from "react";
import { getUser } from "../../services/api/user.js";
import { cachedUser, cacheWrite } from "../../store/cache.js";
import { ChatRow } from "../chat/ChatRow.jsx";

/**
 * Everything waiting for this person, in one place.
 *
 * Not a history of notifications — the backend keeps none, and a list of
 * things already dealt with is a list nobody reads. It is what is *pending*
 * right now, built from state the app already holds: friend requests to
 * answer and conversations with unread messages. Answering one elsewhere
 * takes it off this list, and the count on the bell with it.
 *
 * Each row leads to where the thing is answered rather than answering it here:
 * declining a request asks for a confirmation on the Requests screen, and a
 * second, quicker way to do the same thing would skip it.
 */
export function NotificationsScreen({
  onBack,
  meId,
  requests,
  unreadChats,
  onOpenRequests,
  onOpenChat,
  onOpenProfile,
  onOpenSettings,
}) {
  const [users, setUsers] = useState({});
  const fetched = useRef(new Set());

  // Names for both lists, from the same cache every other screen fills.
  useEffect(() => {
    const ids = [
      ...requests.map((r) => r.sender),
      ...unreadChats.map((c) => (c.sender === meId ? c.reciver : c.sender)),
    ];
    for (const id of ids) {
      if (!id || fetched.current.has(id)) continue;
      fetched.current.add(id);
      const hit = cachedUser(id);
      if (hit) {
        setUsers((prev) => ({ ...prev, [id]: hit }));
        continue;
      }
      getUser(id)
        .then((u) => {
          cacheWrite(`user_${id}`, u);
          setUsers((prev) => ({ ...prev, [id]: u }));
        })
        .catch(() => {});
    }
  }, [requests, unreadChats, meId]);

  const empty = requests.length === 0 && unreadChats.length === 0;

  return (
    <Screen geo="friends" padTop={56}>
      <Header
        title="Notifications"
        onBack={onBack}
        right={
          onOpenSettings && (
            <button
              aria-label="Notification settings"
              onClick={onOpenSettings}
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
          )
        }
      />

      <div
        style={{
          padding: "14px var(--pad-x) 0",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {empty && (
          <EmptyState
            icon="bell"
            title="You're all caught up"
            sub="Friend requests and new messages show up here."
            pad="60px 24px"
          />
        )}

        {requests.length > 0 && (
          <div>
            <SectionLabel>Friend requests</SectionLabel>
            <Card pad={6}>
              {requests.map((r, i) => {
                const u = users[r.sender];
                const name = u?.username ?? "…";
                return (
                  <Fragment key={r.id}>
                    {i > 0 && <Divider />}
                    <div style={{ padding: "0 8px" }}>
                      <PersonRow
                        person={{
                          id: r.sender,
                          username: name,
                          profile_picture: u?.profile_picture ?? null,
                          role: u?.role ?? null,
                          hue: hashHue(u?.username ?? r.sender),
                        }}
                        sub={`Wants to be your friend · ${fmtRelDate(
                          r.send_at ?? r.created_at,
                        )}`}
                        onClick={onOpenRequests}
                        right={
                          <Icon name="chevR" size={18} color="var(--ink-3)" />
                        }
                      />
                    </div>
                  </Fragment>
                );
              })}
            </Card>
          </div>
        )}

        {unreadChats.length > 0 && (
          <div>
            <SectionLabel>New messages</SectionLabel>
            <Card pad={6}>
              {unreadChats.map((c, i) => (
                <Fragment key={c.id}>
                  {i > 0 && <Divider />}
                  <ChatRow
                    c={c}
                    meId={meId}
                    users={users}
                    onOpen={onOpenChat}
                    onOpenProfile={onOpenProfile}
                  />
                </Fragment>
              ))}
            </Card>
          </div>
        )}
      </div>
    </Screen>
  );
}
