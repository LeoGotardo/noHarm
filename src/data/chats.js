/**
 * @typedef {Object} Message
 * @property {string} id - UUID
 * @property {string} chat - UUID of parent chat
 * @property {string} sender - UUID of sender
 * @property {string} message - content, max 2000 chars
 * @property {number} status - 7=unread 8=read
 * @property {string|null} send_at - ISO datetime
 * @property {string|null} recived_at - ISO datetime (API typo preserved)
 * @property {string} created_at - ISO datetime
 * @property {string} updated_at - ISO datetime
 */

/**
 * @typedef {Object} MessageListResponse
 * @property {Message[]} messages
 * @property {number} total
 */

/**
 * @typedef {Object} Chat
 * @property {string} id - UUID
 * @property {string} sender - UUID of who initiated
 * @property {string} reciver - UUID of the other participant (API typo preserved)
 * @property {string} started_at - ISO datetime
 * @property {string|null} ended_at - ISO datetime, null if active
 * @property {number} status - 4=pending 1=enabled 0=disabled
 * @property {string} created_at - ISO datetime
 * @property {string} updated_at - ISO datetime
 * @property {MessageListResponse} messages
 */

/**
 * @typedef {Object} ChatListResponse
 * @property {Chat[]} chats
 * @property {number} total
 */

/** @type {ChatListResponse} */
export let chats = { chats: [], total: 0 };
