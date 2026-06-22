import { api } from "../../connectors/api.js";

/**
 * Fetch the user's current active streak.
 * @returns {Promise<object>}
 */
export async function getCurrentStreak() {
  const result = await api.get(`/streaks/current`);

  return result;
}

/**
 * Fetch the user's all-time streak record.
 * @returns {Promise<object>}
 */
export async function getStreakRecord() {
  const result = await api.get(`/streaks/record`);

  return result;
}

/**
 * Fetch paginated streak history.
 * @param {boolean} paginated
 * @param {number} page
 * @param {number} pageSize
 * @returns {Promise<object>}
 */
export async function getStreakHistory(
  paginated = true,
  page = 1,
  pageSize = 20,
) {
  const result = await api.get(`/streaks/history`, {
    paginated,
    page,
    pageSize,
  });

  return result;
}

/**
 * Start a new streak. Only one active streak allowed at a time.
 * @returns {Promise<object>}
 */
export async function startStreak() {
  const result = await api.post(`/streaks/start`);

  return result;
}

/**
 * End the current streak (relapse). Resets days to 0 and starts a new streak immediately.
 * @returns {Promise<object>}
 */
export async function endStreak() {
  const result = await api.post(`/streaks/end`);

  return result;
}

/**
 * Record the daily check-in. Must be called within 24 h to keep the streak alive.
 * @returns {Promise<object>}
 */
export async function checkinStreak() {
  const result = await api.post(`/streaks/checkin`);

  return result;
}
