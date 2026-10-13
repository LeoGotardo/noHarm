import {
  clampText,
  EmojiButton,
  EmojiPicker,
  Header,
  insertAtCursor,
} from "@components";
import {
  Btn,
  GeoBackground,
  Icon,
  Skeleton,
  useBackHandler,
  useGuardedCallback,
} from "@ui";
import { useEffect, useRef, useState } from "react";
import { errorMessage } from "../../connectors/api.js";
import { COMMENT_MAX, getPost } from "../../services/api/post.js";
import { useComments } from "../../store/useComments.js";
import {
  dropPost,
  isGone,
  rememberPost,
  setLiked,
  usePost,
  usePosts,
} from "../../store/usePosts.js";
import { GONE_TEXT } from "./CommunityScreen.jsx";
import { CrisisLink } from "./ComposeSheet.jsx";
import { ItemMenu } from "./ItemMenu.jsx";
import { CommentRow, PostCard } from "./PostCard.jsx";

/**
 * One post, its comments, and a field to add one.
 *
 * Built like `ChatThread` — a bar, a scrolling middle, a composer pinned to the
 * bottom — because a comment thread is a conversation and reads best with the
 * reply box where the thumb already is.
 *
 * The post is read from the feed store (`usePost`), so a like here is the same
 * like on the card behind it. If the post goes away while open — deleted,
 * removed, or its author blocked — the screen closes itself with a toast
 * rather than leaving a page about nothing.
 */
export function PostDetail({
  postId,
  initialPost,
  focusComment,
  me,
  onBack,
  onOpenProfile,
  onOpenCrisis,
  onReport,
  onBlock,
  showToast,
}) {
  const live = usePost(postId);
  const { remove: removePost } = usePosts("friends", me?.id);
  const thread = useComments(postId);
  const [input, setInput] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [menu, setMenu] = useState(null);
  // Android's back folds the picker away before it leaves the post.
  useBackHandler(emojiOpen, () => setEmojiOpen(false));
  const seen = useRef(false);
  const field = useRef(null);
  const scrollRef = useRef(null);

  // Adopt the post handed over by the feed, or fetch it when there was none.
  useEffect(() => {
    if (live) return;
    if (initialPost) {
      rememberPost(initialPost);
      return;
    }
    getPost(postId)
      .then(rememberPost)
      .catch((e) => {
        showToast(isGone(e) ? GONE_TEXT : errorMessage(e), "bell");
        onBack();
      });
  }, [postId]);

  // Once it has been on screen, its disappearing means it is gone.
  useEffect(() => {
    if (live) seen.current = true;
    else if (seen.current) onBack();
  }, [live]);

  useEffect(() => {
    if (!focusComment) return;
    const t = setTimeout(() => field.current?.focus(), 350);
    return () => clearTimeout(t);
  }, [focusComment]);

  const post = live ?? initialPost;

  const gone = (e, fallback) => {
    if (isGone(e)) {
      dropPost(postId);
      showToast(GONE_TEXT, "bell");
    } else {
      showToast(errorMessage(e, fallback), "bell");
    }
  };

  const like = async (p) => {
    try {
      await setLiked(p, !p.liked_by_me);
    } catch (e) {
      gone(e, "Couldn't save that like");
    }
  };

  const send = useGuardedCallback(async () => {
    const content = input.trim();
    if (!content) return;
    setInput("");
    setEmojiOpen(false);
    try {
      await thread.add(content);
      // New comments land at the bottom; follow them there.
      requestAnimationFrame(() => {
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
      });
    } catch (e) {
      setInput(content);
      gone(e, "Couldn't post that comment");
    }
  });

  const del = async ({ kind, item }) => {
    try {
      if (kind === "post") {
        await removePost(item.id);
        showToast("Post deleted", "trash");
      } else {
        await thread.remove(item.id);
        showToast("Comment deleted", "trash");
      }
      return true;
    } catch (e) {
      gone(e, `Couldn't delete that ${kind}`);
      return false;
    }
  };

  const block = async (target) => {
    const blocked = await onBlock(target);
    if (blocked) thread.dropAuthor(target.item.author?.id);
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <GeoBackground screen="friends" />
      <div
        style={{
          position: "relative",
          zIndex: 2,
          paddingTop: 44,
          background: "var(--banner-bg)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ maxWidth: "var(--content-max)", margin: "0 auto" }}>
          <Header title="Post" onBack={onBack} />
        </div>
      </div>

      <div
        ref={scrollRef}
        className="nh-scroll"
        style={{
          position: "relative",
          zIndex: 1,
          flex: 1,
          overflowY: "auto",
          padding: "16px var(--pad-x) 12px",
          width: "100%",
          maxWidth: "var(--content-max)",
          margin: "0 auto",
        }}
      >
        {post ? (
          <PostCard
            post={post}
            onLike={like}
            onComment={() => field.current?.focus()}
            onMenu={(p) => setMenu({ kind: "post", item: p })}
            onOpenProfile={onOpenProfile}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Skeleton w="45%" h={16} />
            <Skeleton h={14} />
            <Skeleton w="70%" h={14} />
          </div>
        )}

        <div style={{ padding: "18px 4px 0" }}>
          {thread.loading && (
            <div style={{ padding: "16px 0", fontSize: 13, color: "var(--ink-3)" }}>
              Loading comments…
            </div>
          )}
          {!thread.loading && thread.error && (
            <div style={{ padding: "16px 0", fontSize: 13.5, color: "var(--ink-3)" }}>
              Couldn't load comments.{" "}
              <button
                onClick={thread.refresh}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  color: "var(--primary)",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                  fontSize: 13.5,
                }}
              >
                Try again
              </button>
            </div>
          )}
          {!thread.loading && !thread.error && thread.comments.length === 0 && (
            <div
              style={{
                padding: "16px 0",
                fontSize: 13.5,
                color: "var(--ink-3)",
                lineHeight: 1.5,
              }}
            >
              No comments yet. A kind word goes a long way.
            </div>
          )}
          {thread.comments.map((c) => (
            <CommentRow
              key={c.id}
              comment={c}
              onOpenProfile={onOpenProfile}
              onMenu={(item) => setMenu({ kind: "comment", item })}
            />
          ))}
          {thread.hasMore && (
            <div style={{ paddingTop: 8 }}>
              <Btn
                kind="quiet"
                full
                size="sm"
                loading={thread.loadingMore}
                onClick={thread.loadMore}
              >
                Show more comments
              </Btn>
            </div>
          )}
          {onOpenCrisis && (
            <div style={{ paddingTop: 18 }}>
              <CrisisLink onClick={onOpenCrisis} />
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 2,
          background: "var(--surface)",
          borderTop: "1px solid var(--border)",
          padding: "10px 14px 26px",
        }}
      >
        {emojiOpen && (
          <EmojiPicker
            style={{
              margin: "0 auto 10px",
              maxWidth: "var(--content-max)",
            }}
            onPick={(emoji) =>
              insertAtCursor(field.current, input, emoji, setInput, COMMENT_MAX)
            }
          />
        )}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 9,
            width: "100%",
            maxWidth: "var(--content-max)",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              flex: 1,
              background: "var(--surface-2)",
              borderRadius: 22,
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              paddingLeft: 6,
            }}
          >
            <EmojiButton
              open={emojiOpen}
              onToggle={() => setEmojiOpen((o) => !o)}
            />
            <input
              ref={field}
              value={input}
              onChange={(e) => setInput(clampText(e.target.value, COMMENT_MAX))}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Write a comment…"
              aria-label="Comment"
              disabled={!post}
              style={{
                flex: 1,
                minWidth: 0,
                border: "none",
                background: "none",
                outline: "none",
                padding: "12px 16px 12px 4px",
                fontSize: 15,
                color: "var(--ink)",
                fontFamily: "var(--font-body)",
              }}
            />
          </div>
          <button
            onClick={send}
            aria-label="Send comment"
            disabled={!input.trim()}
            style={{
              width: 46,
              height: 46,
              borderRadius: "50%",
              background: input.trim() ? "var(--primary)" : "var(--surface-2)",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: input.trim() ? "pointer" : "default",
              flexShrink: 0,
              transition: "background .2s",
            }}
          >
            <Icon
              name="send"
              size={20}
              color={input.trim() ? "var(--on-primary)" : "var(--ink-3)"}
              fill={input.trim() ? "var(--on-primary)" : "none"}
            />
          </button>
        </div>
      </div>

      <ItemMenu
        target={menu}
        onClose={() => setMenu(null)}
        onDelete={del}
        onReport={onReport}
        onBlock={block}
      />
    </div>
  );
}
