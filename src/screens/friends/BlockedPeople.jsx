import {
  CONFIRM_COPY,
  ConfirmSheet,
  EmptyState,
  hashHue,
  Header,
  PersonRow,
  Screen,
} from "@components";
import { Card, Divider } from "@ui";
import { Fragment, useState } from "react";

/**
 * The people this account has blocked, and the only way back for each.
 *
 * A list and not just a button on the profile, because a blocked person is
 * hard to reach any other way: they drop out of the feed, and their comments
 * and posts with them. Without this screen a block placed by mistake could
 * only be undone by remembering an exact username.
 *
 * `blocked` are friendship rows with status blocked that this account placed;
 * the other person comes from the enrichment `GET /friendships` already
 * carries (`sender_user` / `reciver_user`), because their own profile is
 * exactly what a block hides.
 */
export function BlockedPeople({ onBack, blocked, meId, onUnblock, onOpenProfile }) {
  const [confirm, setConfirm] = useState(null);

  const people = blocked.map((f) => {
    const mine = f.sender === meId;
    const u = (mine ? f.reciver_user : f.sender_user) ?? {};
    const id = mine ? f.reciver : f.sender;
    return {
      id,
      username: u.username ?? id.slice(0, 8),
      profile_picture: u.profile_picture ?? null,
      role: u.role ?? null,
      hue: hashHue(u.username ?? id),
    };
  });

  return (
    <Screen geo="friends" padTop={56}>
      <Header title="Blocked people" onBack={onBack} />
      <div style={{ padding: "14px var(--pad-x) 0" }}>
        {people.length === 0 ? (
          <EmptyState
            icon="block"
            title="Nobody blocked"
            sub="When you block someone they show up here, and this is where you can unblock them."
            pad="50px 24px"
          />
        ) : (
          <>
            <div
              style={{
                fontSize: 13,
                color: "var(--ink-3)",
                padding: "0 4px 12px",
                lineHeight: 1.5,
              }}
            >
              They can't see your profile, posts or comments, or message you.
              They were never told.
            </div>
            <Card pad={6}>
              {people.map((p, i) => (
                <Fragment key={p.id}>
                  {i > 0 && <Divider />}
                  <div style={{ padding: "0 8px" }}>
                    <PersonRow
                      person={p}
                      onClick={() => onOpenProfile?.(p.id)}
                      sub="Blocked"
                      right={
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirm(p);
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
                            fontFamily: "var(--font-body)",
                          }}
                        >
                          Unblock
                        </button>
                      }
                    />
                  </div>
                </Fragment>
              ))}
            </Card>
          </>
        )}
      </div>

      <ConfirmSheet
        open={!!confirm}
        onClose={() => setConfirm(null)}
        {...(confirm ? CONFIRM_COPY.unblock(confirm.username) : {})}
        onConfirm={() => onUnblock(confirm.id)}
      />
    </Screen>
  );
}
