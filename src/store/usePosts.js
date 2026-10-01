import { useCallback, useSyncExternalStore } from "react";
import {
  createPost,
  deletePost,
  getFeed,
  likePost,
  unlikePost,
} from "../services/api/post.js";

/**
 * The Community feed, both scopes, held in memory for the session.
 *
 * One module-level store rather than state inside a hook, for two reasons:
 *
 * - The tab root unmounts every time the user switches tabs. A feed kept in
 *   component state would come back empty and reload from the top on every
 *   return; this one comes back as it was and refreshes behind the list.
 * - A post lives in both scopes at once (a friend's public post is in either
 *   feed), and a like or a deletion in one has to show in the other and in
 *   the open post. Every mutation here walks both lists by id.
 *
 * Not localStorage, unlike the other stores: this is other people's writing,
 * it changes by the minute, and a cached copy of a post its author has since
 * deleted is exactly the thing that should not outlive the session.
 *
 * Keyed by account, so a second account signing in on the same device never
 * sees the first one's feed.
 */

const SCOPES = ["friends", "community"];
const blank = () => ({
  posts: [],
  cursor: null,
  done: false,
  loaded: false,
  loading: false,
  loadingMore: false,
  error: null,
});

let owner = null;
let state = { friends: blank(), community: blank() };
// Posts opened from somewhere other than a feed. Held here so a like in the
// open post and the same post in a feed are one object, not two that drift.
let loose = new Map();
const listeners = new Set();

function emit() {
  for (const l of listeners) l();
}

function set(scope, patch) {
  state = { ...state, [scope]: { ...state[scope], ...patch } };
  emit();
}

/** Apply `fn` to every copy of a post, in both scopes. */
function mapPosts(fn) {
  const next = {};
  for (const s of SCOPES) {
    next[s] = { ...state[s], posts: state[s].posts.map(fn).filter(Boolean) };
  }
  state = next;
  const nextLoose = new Map();
  for (const [id, p] of loose) {
    const out = fn(p);
    if (out) nextLoose.set(id, out);
  }
  loose = nextLoose;
  emit();
}

function ensureOwner(meId) {
  if (owner === meId) return;
  owner = meId;
  state = { friends: blank(), community: blank() };
  loose = new Map();
}

const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** The post as the feed currently holds it, from whichever scope has it. */
export function findPost(postId) {
  for (const s of SCOPES) {
    const hit = state[s].posts.find((p) => p.id === postId);
    if (hit) return hit;
  }
  return loose.get(postId) ?? null;
}

/** Keep a post fetched outside the feeds in step with them. */
export function rememberPost(post) {
  if (!post?.id || findPost(post.id)) return;
  loose = new Map(loose).set(post.id, post);
  emit();
}

/** The live copy of one post, or null once it is gone. */
export function usePost(postId) {
  return useSyncExternalStore(subscribe, () => findPost(postId));
}

/** Merge fields into every copy of a post — a new comment count, say. */
export function patchPost(postId, patch) {
  mapPosts((p) => (p.id === postId ? { ...p, ...patch } : p));
}

/** Take a post out of every list: deleted, removed, or no longer visible. */
export function dropPost(postId) {
  mapPosts((p) => (p.id === postId ? null : p));
}

/** Take someone's posts out of every list — after blocking them. */
export function dropAuthor(userId) {
  mapPosts((p) => (p.author?.id === userId ? null : p));
}

/** A 404 on a post means it is gone for this viewer, whatever the reason. */
export const isGone = (err) => err?.status === 404;

async function load(scope, { more = false } = {}) {
  const cur = state[scope];
  if (more ? cur.loadingMore || cur.done || !cur.cursor : cur.loading) return;
  set(scope, more ? { loadingMore: true } : { loading: true, error: null });
  try {
    const res = await getFeed(scope, more ? cur.cursor : null);
    const page = res?.posts ?? [];
    const posts = more
      ? [...state[scope].posts, ...page.filter((p) => !findIn(scope, p.id))]
      : page;
    set(scope, {
      posts,
      cursor: res?.next_cursor ?? null,
      done: !res?.next_cursor,
      loaded: true,
      loading: false,
      loadingMore: false,
    });
  } catch (error) {
    // A failed refresh keeps what was already on screen; only an empty feed
    // shows the error state.
    set(scope, { loading: false, loadingMore: false, loaded: true, error });
  }
}

function findIn(scope, postId) {
  return state[scope].posts.some((p) => p.id === postId);
}

/**
 * @param {"friends"|"community"} scope
 * @param {string|undefined} meId
 */
export function usePosts(scope, meId) {
  ensureOwner(meId);
  const snap = useSyncExternalStore(subscribe, () => state[scope]);

  const refresh = useCallback(() => load(scope), [scope]);
  const loadMore = useCallback(() => load(scope, { more: true }), [scope]);

  // A new post goes to the top of both feeds: it is the author's own, and each
  // scope includes the viewer's own posts whatever their visibility.
  const create = useCallback(async (content, visibility) => {
    const post = await createPost(content, visibility);
    if (post?.id) {
      const next = {};
      for (const s of SCOPES) {
        next[s] = { ...state[s], posts: [post, ...state[s].posts] };
      }
      state = next;
      emit();
    }
    return post;
  }, []);

  const remove = useCallback(async (postId) => {
    try {
      await deletePost(postId);
    } catch (err) {
      if (!isGone(err)) throw err;
    }
    dropPost(postId);
  }, []);

  return { ...snap, refresh, loadMore, create, remove };
}

/**
 * Like or unlike, optimistically.
 *
 * The heart turns at once; the count the server answers with replaces the
 * guess, and a failure puts both back. A 404 means the post went away between
 * render and tap — it is dropped, and the error rethrown for the caller's toast.
 */
export async function setLiked(post, liked) {
  const before = { liked_by_me: post.liked_by_me, like_count: post.like_count };
  patchPost(post.id, {
    liked_by_me: liked,
    like_count: Math.max(0, (post.like_count ?? 0) + (liked ? 1 : -1)),
  });
  try {
    const res = liked ? await likePost(post.id) : await unlikePost(post.id);
    if (res && typeof res.like_count === "number") {
      patchPost(post.id, { liked_by_me: res.liked, like_count: res.like_count });
    }
  } catch (err) {
    if (isGone(err)) dropPost(post.id);
    else patchPost(post.id, before);
    throw err;
  }
}
