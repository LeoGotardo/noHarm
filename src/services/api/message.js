import { api } from "../../connectors/api.js";

export async function getMessages(
  chatId,
  paginated = false,
  page = 1,
  pageSize = 20,
) {
  return api.get(`/messages/chat/${chatId}`, { paginated, page, pageSize });
}

export async function getUnread(
  chatId,
  paginated = false,
  page = 1,
  pageSize = 20,
) {
  return api.get(`/messages/chat/${chatId}/unread`, {
    paginated,
    page,
    pageSize,
  });
}

export async function getMessage(messageId) {
  return api.get(`/messages/${messageId}`);
}

// Send a message either to an existing chat (chatId) or straight to a user
// (recipientId) — the backend creates the chat on first message. Pass exactly
// one of chatId / recipientId; the backend 422s on both or neither.
export async function sendMessage({ chatId, recipientId, content }) {
  const body = chatId ? { chatId, content } : { recipientId, content };
  return api.post("/messages", body);
}

export async function readMessage(messageId) {
  return api.put(`/messages/${messageId}/read`);
}

export async function readAllMessages(chatId) {
  return api.put(`/messages/chat/${chatId}/read`);
}
