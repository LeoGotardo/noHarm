import { api } from "../../connectors/api.js";

/**
 * Fetch all chats for the authenticated user.
 * @returns {Promise<object[]>}
 */
export async function getChats() {
  result = await api.get(`/chats`);

  return result;
}

/**
 * Start a new chat with a friend.
 * @param {string} chatId
 * @returns {Promise<object>}
 */
export async function startChat(reciverId) {
  result = await api.post(`/chats`, { reciverId });

  return result;
}

/**
 * Fetch a single chat by ID.
 * @param {string} chatId
 * @returns {Promise<object>}
 */
export async function getChat(chatId) {
  result = await api.get(`/chats`, { chatId });

  return result;
}

/**
 * Delete a chat.
 * @param {string} chatId
 * @returns {Promise<object>}
 */
export async function deleteChat(chatId) {
  result = await api.delete(`/chats`, { chatId });

  return result;
}

/**
 * Accept a pending chat request (lifecycle: pending → enabled).
 * @param {string} chatId
 * @returns {Promise<object>}
 */
export async function acceptChat(chatId) {
  result = await api.post(`/chats/${chatId}/accept`, { chatId });

  return result;
}

/**
 * End an active chat (lifecycle: enabled → disabled).
 * @param {string} chatId
 * @returns {Promise<object>}
 */
export async function endChat(chatId) {
  result = await api.post(`/chats/${chatId}/end`, { chatId });

  return result;
}

/**
 * Fetch a chat by ID.
 * @param {string} chatId
 * @returns {Promise<object>}
 */
export async function rejectChat(chatId) {
  result = await api.post(`/chats/${chatId}/reject`, { chatId });

  return result;
}
