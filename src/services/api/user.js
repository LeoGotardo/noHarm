import { api } from "../../connectors/api.js";

/**
 * Fetch the authenticated user's profile.
 * @returns {Promise<object>}
 */
export async function getMe() {
  const result = await api.get("/users/me");

  return result;
}

/**
 * Update the authenticated user's username and/or profile picture.
 * @param {string} username
 * @param {string} profile_picture - URL of the profile picture.
 * @returns {Promise<object>}
 */
export async function putMe(username, profile_picture) {
  // Only the fields actually being changed. The backend refuses a
  // `profile_picture` on an account whose picture moderation has blocked, so
  // re-sending the unchanged current value would turn a plain username edit
  // into a 403 — and the app has no upload UI, so there is nothing else this
  // field is ever for.
  const body = {};
  if (username != null) body.username = username;
  if (profile_picture !== undefined) body.profile_picture = profile_picture;

  const result = await api.put("/users/me", body);

  return result;
}

/**
 * Delete the authenticated user's account.
 * @returns {Promise<object>}
 */
export async function deleteMe() {
  const result = await api.delete("/users/me");

  return result;
}

/**
 * Download everything the backend holds about this account.
 *
 * One synchronous request returning the whole thing as JSON: an account's data
 * is small, and the alternative — a job writing a file somewhere and emailing a
 * link — needs an email service the backend does not have.
 *
 * A section the server could not build comes back `null` and is named in
 * `incomplete`, so a partial export is distinguishable from an empty one.
 *
 * @returns {Promise<object>}
 */
export async function exportMyData() {
  return api.get("/users/me/export");
}

/**
 * Fetch a user's public profile by ID.
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function getUser(id) {
  const result = await api.get(`/users/${id}`);

  return result;
}

/**
 * Fetch a user's public activity numbers (day streak + badges earned).
 *
 * Friends only: for anyone else the backend answers `{ visible: false }` with
 * null numbers rather than an error, so the screen can show its placeholder
 * without special-casing a status code.
 * @param {string} id
 * @returns {Promise<{visible: boolean, day_streak: number|null, badges_earned: number|null}>}
 */
export async function getUserStats(id) {
  return api.get(`/users/${id}/stats`);
}

/**
 * Fetch paginated list of users.
 * @param {boolean} paginated
 * @param {number} page
 * @param {number} pageSize
 * @returns {Promise<object>}
 */
export async function getUsers(paginated = true, page = 1, pageSize = 20) {
  return api.get("/users", { paginated, page, pageSize });
}

/**
 * Block someone who is not (or not yet) a friend.
 *
 * `POST /friendships/{id}/block` needs a friendship row, and a stranger who
 * commented on a post has none. This one works from the user id alone and is
 * what every "Block" goes through when there is no friendship to name.
 * @param {string} id
 */
export async function blockUser(id) {
  return api.post(`/users/${id}/block`);
}

/** Undo a block. Only the person who blocked may. */
export async function unblockUser(id) {
  return api.delete(`/users/${id}/block`);
}
