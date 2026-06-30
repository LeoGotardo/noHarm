import { chat as chatSocket, getSocket } from "../../connectors/socket.js";

// --- Emit ---

/** Join a chat room to start receiving its events. */
export const joinChat = (chatId) => chatSocket.join(chatId);

/** Leave a chat room. */
export const leaveChat = (chatId) => chatSocket.leave(chatId);

/**
 * Send a message to a chat.
 * @param {string} chatId
 * @param {string} content - Max 2000 chars.
 */
export const sendMessage = (chatId, content) =>
  chatSocket.send(chatId, content);

/**
 * Mark all unread messages in a chat as read (bulk).
 * @param {string} chatId
 */
export const markRead = (chatId) => chatSocket.markRead(chatId);

/**
 * Emit typing indicator.
 * @param {string} chatId
 * @param {boolean} isTyping
 */
export const setTyping = (chatId, isTyping) =>
  chatSocket.typing(chatId, isTyping);

// --- Listen ---

/**
 * Listen for new incoming messages.
 * @param {(data: { message: object }) => void} handler
 * @returns {() => void} unsubscribe
 */
export function onMessage(handler) {
  const socket = getSocket();
  socket.on("new_message", handler);
  return () => socket.off("new_message", handler);
}

/**
 * Listen for bulk read receipt (all messages in chat marked read by the other user).
 * @param {(data: { chatId: string }) => void} handler
 * @returns {() => void} unsubscribe
 */
export function onMessagesRead(handler) {
  const socket = getSocket();
  socket.on("messages_read", handler);
  return () => socket.off("messages_read", handler);
}

/**
 * Listen for typing indicator updates from the other participant.
 * @param {(data: { chatId: string, userId: string, isTyping: boolean }) => void} handler
 * @returns {() => void} unsubscribe
 */
export function onTypingIndicator(handler) {
  const socket = getSocket();
  socket.on("typing_indicator", handler);
  return () => socket.off("typing_indicator", handler);
}

/**
 * Listen for chat errors from the server.
 * @param {(data: { code: string, message: string }) => void} handler
 * @returns {() => void} unsubscribe
 */
export function onChatError(handler) {
  const socket = getSocket();
  socket.on("chat_error", handler);
  return () => socket.off("chat_error", handler);
}
