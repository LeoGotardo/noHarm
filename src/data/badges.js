/**
 * @typedef {Object} Badge
 * @property {string} id - UUID
 * @property {string} name - 3–50 chars
 * @property {string} description - 3–500 chars
 * @property {string} milestone - ISO datetime representing the streak milestone
 * @property {string} icon - URL
 * @property {number} status - 1=active 0=disabled
 * @property {string} created_at - ISO datetime
 * @property {string} updated_at - ISO datetime
 */

/**
 * @typedef {Object} UserBadge
 * @property {string} id - UUID
 * @property {string} user_id - UUID
 * @property {string} badge_id - UUID
 * @property {string|null} given_at - ISO datetime
 * @property {number} status - 1=active 0=revoked
 * @property {string} created_at - ISO datetime
 * @property {string} updated_at - ISO datetime
 */

/**
 * @typedef {Object} BadgeListResponse
 * @property {Badge[]} badges
 * @property {number} total
 */

/**
 * @typedef {Object} UserBadgeListResponse
 * @property {UserBadge[]} badges
 * @property {number} total
 */

/** @type {BadgeListResponse} */
export let badges = { badges: [], total: 0 };

/** @type {UserBadgeListResponse} */
export let userBadges = { badges: [], total: 0 };
