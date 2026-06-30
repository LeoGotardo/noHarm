import { api } from "../../connectors/api.js";

export async function getFriendships(
  paginated = false,
  page = 1,
  pageSize = 20,
) {
  return api.get(`/friendships`, { paginated, page, pageSize });
}

export async function getPendingFriendships(
  paginated = false,
  page = 1,
  pageSize = 20,
) {
  return api.get(`/friendships/pending`, { paginated, page, pageSize });
}

export async function getSentFriendships(
  paginated = false,
  page = 1,
  pageSize = 20,
) {
  return api.get(`/friendships/sent`, { paginated, page, pageSize });
}

export async function getFriendship(friendshipId) {
  return api.get(`/friendships/${friendshipId}`);
}

export async function sendFriendRequest(receiverId) {
  return api.post(`/friendships/${receiverId}`);
}

export async function removeFriendship(friendshipId) {
  return api.delete(`/friendships/${friendshipId}`);
}

export async function acceptFriendship(friendshipId) {
  return api.post(`/friendships/${friendshipId}/accept`);
}

export async function rejectFriendship(friendshipId) {
  return api.post(`/friendships/${friendshipId}/reject`);
}

export async function blockFriendship(friendshipId) {
  return api.post(`/friendships/${friendshipId}/block`);
}

export async function unblockFriendship(friendshipId) {
  return api.post(`/friendships/${friendshipId}/unblock`);
}
