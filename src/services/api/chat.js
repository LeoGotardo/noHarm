import { api } from "../../connectors/api.js";

export async function getChats() {
  return api.get(`/chats`);
}

export async function startChat(receiverId) {
  return api.post(`/chats`, { receiverId });
}

export async function getChat(chatId) {
  return api.get(`/chats/${chatId}`);
}

export async function deleteChat(chatId) {
  return api.delete(`/chats/${chatId}`);
}

export async function acceptChat(chatId) {
  return api.post(`/chats/${chatId}/accept`);
}

export async function endChat(chatId) {
  return api.post(`/chats/${chatId}/end`);
}

export async function rejectChat(chatId) {
  return api.post(`/chats/${chatId}/reject`);
}
