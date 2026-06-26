import { api } from "../../connectors/api.js";

export async function getMessages(chatId, paginated = false, page = 1, pageSize = 20) {
  return api.get(`/messages/chat/${chatId}`, { paginated, page, pageSize });
}

export async function getUnread(chatId, paginated = false, page = 1, pageSize = 20) {
  return api.get(`/messages/chat/${chatId}/unread`, { paginated, page, pageSize });
}

export async function getMessage(messageId) {
  return api.get(`/messages/${messageId}`);
}

export async function sendMessage(chatId, content) {
  return api.post("/messages", { chatId, content });
}

export async function readMessage(messageId) {
  return api.put(`/messages/${messageId}/read`);
}

export async function readAllMessages(chatId) {
  return api.put(`/messages/chat/${chatId}/read`);
}
