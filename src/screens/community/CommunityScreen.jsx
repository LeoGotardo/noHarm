import { EmptyState, hashHue, Header, Screen, SegTabs } from "@components";
import { Avatar, Btn, Icon, Skeleton } from "@ui";
import { useEffect, useState } from "react";
import { errorMessage } from "../../connectors/api.js";
import { isGone, setLiked, usePosts } from "../../store/usePosts.js";
import { ComposeSheet } from "./ComposeSheet.jsx";
import { ItemMenu } from "./ItemMenu.jsx";
import { PostCard } from "./PostCard.jsx";

const SCOPE_TABS = [
  { id: "community", label: "Everyone" },
  { id: "friends", label: "Friends" },
];

// Which feed was open, for the session. The tab root unmounts on every tab
// switch, and coming back to the other feed than the one you left is the kind
// of small wrongness that makes a list feel unreliable.
let lastScope = "community";

export const GONE_TEXT = "This post isn't available anymore";

export function CommunityScreen({
  me,
  onOpenPost,
  onOpenProfile,
  onOpenCrisis,
  onReport,
  onBlock,
  showToast,
}) {
  const [scope, setScopeState] = useState(lastScope);
  const setScope = (s) => {
    lastScope = s;
    setScopeState(s);
  };
  const feed = usePosts(scope, me?.id);
  const [composing, setComposing] = useState(false);
  const [menu, setMenu] = useState(null);

  // Every visit refreshes behind whatever is already on screen: the feed is
  // not live, and arriving at the tab is when someone expects it to be current.
  useEffect(() => {
    feed.refresh();
  }, [scope, feed.refresh]);

  const like = async (post) => {
    try {
      await setLiked(post, !post.liked_by_me);
    } catch (e) {
      showToast(
        isGone(e) ? GONE_TEXT : errorMessage(e, "Couldn't save that like"),
        "bell",
      );
    }
  };

  const del = async ({ item }) => {
    try {
      await feed.remove(item.id);
      showToast("Post deleted", "trash");
      return true;
    } catch (e) {
      showToast(errorMessage(e, "Couldn't delete that post"), "bell");
      return false;
    }
  };

  const name = me?.username ?? "";
  const empty = feed.loaded && !feed.loading && feed.posts.length === 0;

  return (
    <Screen geo="friends" padTop={56}>
      <Header
        large
        title="Community"
        sub="Share how it's going. Cheer each other on."
        right={
          <button
            aria-label="New post"
            onClick={() => setComposing(true)}
            style={{
              width: 42,
              height: 42,
              borderRadius: 13,
              background: "var(--primary)",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <Icon name="plus" size={22} color="var(--on-primary)" sw={2.2} />
          </button>
        }
      />

      <div style={{ paddingTop: 14 }}>
        <SegTabs tabs={SCOPE_TABS} active={scope} onChange={setScope} />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          padding: "16px var(--pad-x) 0",
        }}
      >
        {/* The prompt reads as the start of a post, not as a button: the
            easiest way in is the one that looks like writing. */}
        <button
          onClick={() => setComposing(true)}
          className="nh-tap nh-tap-card"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 14px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 18,
            cursor: "pointer",
            textAlign: "left",
            fontFamily: "var(--font-body)",
          }}
        >
          <Avatar
            name={name}
            size={34}
            hue={hashHue(name)}
            src={me?.profile_picture ?? null}
          />
          <span style={{ fontSize: 15, color: "var(--ink-3)" }}>
            What's on your mind today?
          </span>
        </button>

        {!feed.loaded && feed.loading && <FeedSkeleton />}

        {empty && !feed.error && (
          <EmptyState
            icon="community"
            title={
              scope === "friends"
                ? "Nothing from your circle yet"
                : "It's quiet in here"
            }
            sub={
              scope === "friends"
                ? "Posts you and your friends share land here. Add friends, or say something first."
                : "Be the first to share how today is going."
            }
            action={
              <Btn kind="soft" icon="edit" onClick={() => setComposing(true)}>
                Write a post
              </Btn>
            }
            pad="30px 24px"
          />
        )}

        {empty && feed.error && (
          <EmptyState
            icon="bell"
            title="Couldn't load posts"
            sub={errorMessage(feed.error)}
            action={
              <Btn kind="soft" onClick={feed.refresh}>
                Try again
              </Btn>
            }
            pad="30px 24px"
          />
        )}

        {feed.posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onOpen={onOpenPost}
            onComment={(p) => onOpenPost(p, { focusComment: true })}
            onLike={like}
            onMenu={(p) => setMenu({ kind: "post", item: p })}
            onOpenProfile={onOpenProfile}
          />
        ))}

        {feed.posts.length > 0 && !feed.done && (
          <Btn
            kind="quiet"
            full
            loading={feed.loadingMore}
            onClick={feed.loadMore}
          >
            Show older posts
          </Btn>
        )}
      </div>

      <ComposeSheet
        open={composing}
        onClose={() => setComposing(false)}
        onSubmit={async (content, visibility) => {
          await feed.create(content, visibility);
          showToast("Posted", "check");
        }}
        onOpenCrisis={() => {
          setComposing(false);
          onOpenCrisis();
        }}
      />

      <ItemMenu
        target={menu}
        onClose={() => setMenu(null)}
        onDelete={del}
        onReport={onReport}
        onBlock={onBlock}
      />
    </Screen>
  );
}

function FeedSkeleton() {
  return [0, 1, 2].map((i) => (
    <div
      key={i}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 22,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <Skeleton w={40} h={40} r={20} />
        <Skeleton w="40%" h={14} />
      </div>
      <Skeleton h={14} />
      <Skeleton w="70%" h={14} />
    </div>
  ));
}
