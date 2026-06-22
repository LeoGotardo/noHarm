import { api } from "../../connectors/api.js";

/**
 * Fetch all friendships for the authenticated user.
 * @param {boolean} paginated
 * @param {number} page
 * @param {number} pageSize
 * @returns {Promise<object>}
 */
export async function getFriendships(
  paginated = true,
  page = 1,
  pageSize = 20,
) {
  const result = await api.get(`/friendships`, { paginated, page, pageSize });

  return result;
}

/**
 * Fetch received pending friend requests (status=4).
 * @param {boolean} paginated
 * @param {number} page
 * @param {number} pageSize
 * @returns {Promise<object>}
 */
export async function getPendingFriendships(
  paginated = true,
  page = 1,
  pageSize = 20,
) {
  const result = await api.get(`/friendships/pending`, {
    paginated,
    page,
    pageSize,
  });

  return result;
}

/**
 * Fetch sent pending friend requests.
 * @param {boolean} paginated
 * @param {number} page
 * @param {number} pageSize
 * @returns {Promise<object>}
 */
export async function getSentFriendships(
  paginated = true,
  page = 1,
  pageSize = 20,
) {
  const result = await api.get(`/friendships/sent`, {
    paginated,
    page,
    pageSize,
  });

  return result;
}

/**
 * Fetch a single friendship record by ID.
 * @param {string} friendshipId
 * @returns {Promise<object>}
 */
export async function getFriendship(friendshipId) {
  const result = await api.get(`/friendships`, { friendshipId });

  return result;
}

/**
 * Remove a friend or cancel a sent request (status → 2).
 * @param {string} friendshipId
 * @returns {Promise<object>}
 */
export async function removeFriendship(friendshipId) {
  const result = await api.delete(`/friendships`, { friendshipId });

  return result;
}

/**
 * Accept a received friend request (status → 5).
 * @param {string} friendshipId
 * @returns {Promise<object>}
 */
export async function acceptFriendship(friendshipId) {
  const result = await api.post(`/friendships/${friendshipId}/accept`, {
    friendshipId,
  });

  return result;
}

/**
 * Reject a received friend request (status → 6).
 * @param {string} friendshipId
 * @returns {Promise<object>}
 */
export async function rejectFriendship(friendshipId) {
  const result = await api.post(`/friendships/${friendshipId}/reject`, {
    friendshipId,
  });

  return result;
}

/**
 * Block a user (status → 3). Blocked users cannot view your profile or message you.
 * @param {string} friendshipId
 * @returns {Promise<object>}
 */
export async function blockFriendship(friendshipId) {
  const result = await api.post(`/friendships/${friendshipId}/block`, {
    friendshipId,
  });

  return result;
}

/**
 * Unblock a previously blocked user.
 * @param {string} friendshipId
 * @returns {Promise<object>}
 */
export async function unblockFriendship(friendshipId) {
  const result = await api.post(`/friendships/${friendshipId}/unblock`, {
    friendshipId,
  });

  return result;
}

/**
 * Fetch paginated list of blocked users.
 * @param {boolean} paginated
 * @param {number} page
 * @param {number} pageSize
 * @returns {Promise<object>}
 */
export async function getBlockedUsers(
  paginated = true,
  page = 1,
  pageSize = 20,
) {
  const result = await api.get(`/users/blocked`, {
    paginated,
    page,
    pageSize,
  });

  return result;
}
