import { fmtAgo, hashHue, RoleBadge } from "@components";
import { Avatar, Icon, useGuardedCallback } from "@ui";

/**
 * Who wrote something, and when. Shared by a post and a comment so the two
 * read as the same kind of thing at two sizes.
 */
export function AuthorLine({ author, at, size = 40, onOpenProfile, extra }) {
  const name = author?.username ?? "…";
  const canOpen = !!(onOpenProfile && author?.id);
  const open = useGuardedCallback(
    canOpen ? () => onOpenProfile(author.id) : null,
  );
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          open();
        }}
        aria-label={`Open ${name}'s profile`}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: canOpen ? "pointer" : "default",
          flexShrink: 0,
          borderRadius: "50%",
        }}
      >
        <Avatar
          name={name}
          size={size}
          hue={hashHue(name)}
          src={author?.profile_picture ?? null}
        />
      </button>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: size > 36 ? 15 : 14,
            fontWeight: 700,
            color: "var(--ink)",
          }}
        >
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {name}
          </span>
          <RoleBadge role={author?.role} />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 12,
            color: "var(--ink-3)",
          }}
        >
          {fmtAgo(at)}
          {extra}
        </div>
      </div>
    </div>
  );
}

/** Round icon button for the corner menu, shared by posts and comments. */
export function MoreButton({ onClick, label = "More options", size = 34 }) {
  const run = useGuardedCallback(onClick);
  return (
    <button
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        run();
      }}
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        background: "none",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Icon name="more" size={20} color="var(--ink-3)" />
    </button>
  );
}

function Action({ icon, count, on, label, onClick, fillOn }) {
  return (
    <button
      aria-label={label}
      aria-pressed={on}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "7px 10px",
        marginLeft: -10,
        background: "none",
        border: "none",
        borderRadius: 10,
        cursor: "pointer",
        color: on ? "var(--accent-ink)" : "var(--ink-3)",
        fontSize: 13.5,
        fontWeight: 600,
        fontFamily: "var(--font-body)",
      }}
    >
      <Icon
        name={icon}
        size={19}
        color="currentColor"
        fill={on && fillOn ? "currentColor" : "none"}
      />
      {count > 0 ? count : null}
    </button>
  );
}

/**
 * One post, as the feed and the open post both draw it.
 *
 * `onOpen` makes the whole card tappable (the feed); without it the card is
 * the header of an open post and only its buttons act.
 */
export function PostCard({ post, onOpen, onLike, onComment, onMenu, onOpenProfile }) {
  // The heart is a raw button and taps land faster than a render; the verbs
  // are idempotent server-side, but two optimistic flips in one tick would
  // still flicker the count.
  const like = useGuardedCallback(onLike ? () => onLike(post) : null);
  const open = useGuardedCallback(onOpen ? () => onOpen(post) : null);
  const friendsOnly = post.visibility === "friends";

  return (
    <article
      className={onOpen ? "nh-tap nh-tap-card" : undefined}
      onClick={onOpen ? open : undefined}
      data-post-id={post.id}
      style={{
        background: "var(--surface)",
        borderRadius: 22,
        padding: "16px 16px 8px",
        border: "1px solid var(--border)",
        boxShadow:
          "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px -16px rgba(0,0,0,0.18)",
        cursor: onOpen ? "pointer" : undefined,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <AuthorLine
            author={post.author}
            at={post.created_at}
            onOpenProfile={onOpenProfile}
            extra={
              <>
                <span aria-hidden>·</span>
                <span
                  title={friendsOnly ? "Friends only" : "Everyone on NoHarm"}
                  style={{ display: "inline-flex", alignItems: "center", gap: 3 }}
                >
                  <Icon
                    name={friendsOnly ? "friends" : "globe"}
                    size={12}
                    color="var(--ink-3)"
                  />
                  {friendsOnly ? "Friends" : "Everyone"}
                </span>
              </>
            }
          />
        </div>
        {onMenu && <MoreButton onClick={() => onMenu(post)} />}
      </div>

      <div
        style={{
          marginTop: 12,
          fontSize: 15.5,
          lineHeight: 1.55,
          color: "var(--ink)",
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
        }}
      >
        {post.content}
      </div>

      <div style={{ display: "flex", gap: 14, marginTop: 8, paddingLeft: 10 }}>
        <Action
          icon="heart"
          count={post.like_count}
          on={!!post.liked_by_me}
          fillOn
          label={post.liked_by_me ? "Unlike" : "Like"}
          onClick={like}
        />
        <Action
          icon="chat"
          count={post.comment_count}
          label="Comments"
          onClick={onComment ? () => onComment(post) : open}
        />
      </div>
    </article>
  );
}

/** One comment under an open post. */
export function CommentRow({ comment, onMenu, onOpenProfile }) {
  return (
    <div
      data-comment-id={comment.id}
      style={{
        display: "flex",
        gap: 8,
        alignItems: "flex-start",
        padding: "12px 0",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <AuthorLine
          author={comment.author}
          at={comment.created_at}
          size={32}
          onOpenProfile={onOpenProfile}
        />
        <div
          style={{
            marginTop: 6,
            marginLeft: 42,
            fontSize: 14.5,
            lineHeight: 1.5,
            color: "var(--ink)",
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
          }}
        >
          {comment.content}
        </div>
      </div>
      {onMenu && <MoreButton size={30} onClick={() => onMenu(comment)} />}
    </div>
  );
}
