import { api } from "../../connectors/api.js";

/**
 * Fetch paginated list of all badges.
 * @param {boolean} paginated
 * @param {number} page
 * @param {number} pageSize
 * @returns {Promise<object>}
 */
export async function getAllBedges(paginated = true, page = 1, pageSize = 20) {
  result = await api.get(`/badges`, { paginated, page, pageSize });

  return result;
}

/**
 * Fetch a badge definition by ID.
 * @param {string} badgeId
 * @returns {Promise<object>}
 */
export async function getBadge(badgeId) {
  result = await api.get(`/badges`, { badgeId });

  return result;
}

/**
 * Fetch paginated list of user-badge records.
 * @param {boolean} paginated
 * @param {number} page
 * @param {number} pageSize
 * @returns {Promise<object>}
 */
export async function getAllUserBadges(
  paginated = true,
  page = 1,
  pageSize = 20,
) {
  result = await api.get(`/user-badges`, { paginated, page, pageSize });

  return result;
}

/**
 * Fetch a user-badge record by its ID.
 * @param {string} userBadgeId
 * @returns {Promise<object>}
 */
export async function getUserBedge(userBadgeId) {
  result = await api.get(`/user-bedges`, { userBadgeId });

  return result;
}

/**
 * Delete a user-badge record.
 * @param {string} userBadgeId
 * @returns {Promise<object>}
 */
export async function deleteUserBedge(userBadgeId) {
  result = await api.delete(`/user-badges`, { userBadgeId });

  return result;
}

/**
 * Update a user-badge record, replacing its badge.
 * @param {string} userBadgeId
 * @param {string} badgeId
 * @returns {Promise<object>}
 */
export async function updateUserBedge(userBadgeId, badgeId) {
  result = await api.put(`/user-badges`, { userBadgeId, badgeId });

  return result;
}

/**
 * Grant a badge to a user.
 * @param {string} userId
 * @param {string} badgeId
 * @returns {Promise<object>}
 */
export async function grantBedge(userId, badgeId) {
  result = await api.post(`/user-badges`, { userId, badgeId });

  return result;
}

/**
 * Revoke a badge from a user.
 * @param {string} userId
 * @param {string} badgeId
 * @returns {Promise<object>}
 */
export async function revokeBedge(userId, badgeId) {
  result = await api.post(`/user-badges/revoke`, { userId, badgeId });

  return result;
}

/**
 * Update the status of a user-badge record.
 * @param {string} userBadgeId
 * @param {number} status
 * @returns {Promise<object>}
 */
export async function updateUserBedgeStatus(userBadgeId, status) {
  result = await api.put(`/user-badges`, { userBadgeId, status });

  return result;
}
