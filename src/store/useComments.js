import { useCallback, useEffect, useRef, useState } from "react";
import {
  createComment,
  deleteComment,
  getComments,
} from "../services/api/post.js";
import { findPost, patchPost } from "./usePosts.js";

/**
 * The comments under one post, oldest first.
 *
 * Local to the open post rather than kept for the session: a thread is read
 * when it is opened, and one left from an hour ago would be the wrong thing to
 * show first. Each change that alters the count is written back to the feed
 * store, so the number on the card agrees when the user goes back.
 */
export function useComments(postId) {
  const [comments, setComments] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  // The post being read can change under the hook (a second post pushed over
  // the first); a response for the old one must not land in the new list.
  const current = useRef(postId);

  const load = useCallback(async () => {
    current.current = postId;
    setLoading(true);
    setError(null);
    try {
      const res = await getComments(postId);
      if (current.current !== postId) return;
      setComments(res?.comments ?? []);
      setCursor(res?.next_cursor ?? null);
    } catch (err) {
      if (current.current === postId) setError(err);
    } finally {
      if (current.current === postId) setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    load();
  }, [load]);

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await getComments(postId, cursor);
      if (current.current !== postId) return;
      setComments((prev) => {
        const seen = new Set(prev.map((c) => c.id));
        return [...prev, ...(res?.comments ?? []).filter((c) => !seen.has(c.id))];
      });
      setCursor(res?.next_cursor ?? null);
    } finally {
      setLoadingMore(false);
    }
  }, [postId, cursor, loadingMore]);

  const bump = (by) => {
    const post = findPost(postId);
    if (post) {
      patchPost(postId, {
        comment_count: Math.max(0, (post.comment_count ?? 0) + by),
      });
    }
  };

  const add = useCallback(
    async (content) => {
      const comment = await createComment(postId, content);
      if (comment?.id) {
        setComments((prev) => [...prev, comment]);
        bump(1);
      }
      return comment;
    },
    [postId],
  );

  const remove = useCallback(
    async (commentId) => {
      try {
        await deleteComment(postId, commentId);
      } catch (err) {
        if (err?.status !== 404) throw err;
      }
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      bump(-1);
    },
    [postId],
  );

  /** Hide one person's comments locally — after blocking them. */
  const dropAuthor = useCallback((userId) => {
    setComments((prev) => prev.filter((c) => c.author?.id !== userId));
  }, []);

  return {
    comments,
    loading,
    loadingMore,
    error,
    hasMore: !!cursor,
    refresh: load,
    loadMore,
    add,
    remove,
    dropAuthor,
  };
}
