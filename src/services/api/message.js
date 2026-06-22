import { api } from "../../connectors/api.js";

/**
 * Fetch paginated messages for a chat.
 * @param {string} chatId
 * @param {boolean} paginated
 * @param {number} page
 * @param {number} pageSize
 * @returns {Promise<object>}
 */
export async function getMessages(
  chatId,
  paginated = true,
  page = 1,
  pageSize = 20,
) {
  const result = await api.get(`/messages/chat/${chatId}`, {
    paginated,
    page,
    pageSize,
  });

  return result;
}

/**
 * Fetch unread messages for a chat.
 * @param {string} chatId
 * @param {boolean} paginated
 * @param {number} page
 * @param {number} pageSize
 * @returns {Promise<object>}
 */
export async function getUnread(
  chatId,
  paginated = true,
  page = 1,
  pageSize = 20,
) {
  const result = await api.get(`/messages/chat/${chatId}/unread`, {
    paginated,
    page,
    pageSize,
  });

  return result;
}

/**
 * Fetch a single message by ID.
 * @param {string} messageId
 * @returns {Promise<object>}
 */
export async function getMessage(messageId) {
  const result = await api.get(`/messages/${messageId}`);

  return result;
}

/**
 * Send a text message to a chat.
 * @param {string} chatId
 * @param {string} message - Max 2000 chars.
 * @returns {Promise<object>}
 */
export async function sendMessage(chatId, content) {
  const result = await api.post("/messages", { chatId, content });

  return result;
}

/**
 * Mark a message as read (status → 8).
 * @param {string} messageId
 * @returns {Promise<object>}
 */
export async function readMessage(messageId) {
  const result = await api.put(`/messages/${messageId}/read`, { messageId });

  return result;
}
