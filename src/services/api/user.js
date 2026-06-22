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
  const result = await api.put("/users/me", { username, profile_picture });

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
 * Fetch a user's public profile by ID.
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function getUser(id) {
  const result = await api.get(`/users/${id}`);

  return result;
}

/**
 * Fetch paginated list of users.
 * @param {boolean} paginated
 * @param {number} page
 * @param {number} pageSize
 * @returns {Promise<object>}
 */
export async function getUsers(paginated = true, page = 1, pageSize = 20) {
  const resutlt = await api.get("users", { paginated, page, pageSize });

  return resutlt;
}
