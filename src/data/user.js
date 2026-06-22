/**
 * @typedef {Object} User
 * @property {string} id - UUID
 * @property {string} username - 3–50 chars, unique
 * @property {string} email
 * @property {number} status - 0=disabled 1=enabled 2=deleted 3=blocked 9=banned
 * @property {string|null} profile_picture - URL
 * @property {string} created_at - ISO datetime
 * @property {string} updated_at - ISO datetime
 */

/** @type {User|null} */
export let ME = null;
