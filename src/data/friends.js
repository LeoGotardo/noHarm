/**
 * @typedef {Object} Friendship
 * @property {string} id - UUID
 * @property {string} sender - UUID of who sent the request
 * @property {string} reciver - UUID of who received it (API typo preserved)
 * @property {string|null} send_at - ISO datetime
 * @property {string|null} recived_at - ISO datetime (API typo preserved)
 * @property {number} status - 2=deleted 3=blocked 4=pending 5=accepted 6=rejected
 * @property {string} created_at - ISO datetime
 * @property {string} updated_at - ISO datetime
 */

/**
 * @typedef {Object} FriendshipListResponse
 * @property {Friendship[]} friendships
 * @property {number} total
 */

/** @type {FriendshipListResponse} */
export let friends = { friendships: [], total: 0 };

/** @type {FriendshipListResponse} */
export let requestsReceived = { friendships: [], total: 0 };

/** @type {FriendshipListResponse} */
export let requestsSent = { friendships: [], total: 0 };
