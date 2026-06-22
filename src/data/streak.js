/**
 * @typedef {Object} Streak
 * @property {string} id - UUID
 * @property {string} owner_id - UUID
 * @property {string} start - ISO datetime
 * @property {string|null} end - ISO datetime, null if active
 * @property {number} status - 1=active 0=expired/ended
 * @property {boolean|null} is_record - true if longest streak ever
 * @property {string|null} created_at - ISO datetime
 * @property {string|null} updated_at - ISO datetime
 */

/** @type {Streak|null} */
export let currentStreak = null;

/** @type {Streak|null} */
export let recordStreak = null;

/**
 * @typedef {Object} StreakListResponse
 * @property {Streak[]} streaks
 * @property {number} total
 */

/** @type {StreakListResponse} */
export let streakHistory = { streaks: [], total: 0 };
