import { api } from "../../connectors/api.js";

// The contract is `noHarmBack/docs/POSTS_PLAN.md`, section 3. Lengths mirror
// the backend's validation, which is the authority: these only stop the field
// before the server has to say no.
export const POST_MAX = 1000;
export const COMMENT_MAX = 500;

/** Who a post goes to. The composer defaults to the narrower one. */
export const VISIBILITY = {
  friends: {
    value: "friends",
    label: "Friends",
    hint: "Only your friends can see this.",
  },
  community: {
    value: "community",
    label: "Everyone",
    hint: "Everyone on NoHarm can read this. Avoid details that identify you.",
  },
};

/**
 * One page of the feed, newest first.
 *
 * Paged by an opaque cursor rather than page numbers: the feed grows at the
 * top while someone scrolls, and with `page=2` every new post shifts the
 * window down and repeats the last post of page 1.
 *
 * @param {"friends"|"community"} scope
 * @param {string|null} cursor  `next_cursor` from the previous page
 * @returns {Promise<{posts: object[], next_cursor: string|null}>}
 */
export async function getFeed(scope, cursor = null, limit = 20) {
  return api.get("/posts", { scope, cursor, limit });
}

export async function getPost(postId) {
  return api.get(`/posts/${postId}`);
}

/** A person's own posts, as the viewer is allowed to see them. */
export async function getUserPosts(userId, cursor = null, limit = 20) {
  return api.get(`/users/${userId}/posts`, { cursor, limit });
}

export async function createPost(content, visibility) {
  return api.post("/posts", { content: content.trim(), visibility });
}

export async function deletePost(postId) {
  return api.delete(`/posts/${postId}`);
}

/**
 * Like and unlike are two idempotent verbs, not a toggle: two PUTs are one
 * like. A toggle sent twice by a double tap would undo itself.
 * @returns {Promise<{liked: boolean, like_count: number}>}
 */
export async function likePost(postId) {
  return api.put(`/posts/${postId}/like`);
}

export async function unlikePost(postId) {
  return api.delete(`/posts/${postId}/like`);
}

/** Comments on a post, oldest first — they read as a conversation. */
export async function getComments(postId, cursor = null, limit = 30) {
  return api.get(`/posts/${postId}/comments`, { cursor, limit });
}

export async function createComment(postId, content) {
  return api.post(`/posts/${postId}/comments`, { content: content.trim() });
}

export async function deleteComment(postId, commentId) {
  return api.delete(`/posts/${postId}/comments/${commentId}`);
}
