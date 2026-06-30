import { api } from "../../connectors/api.js";

export async function getAllBadges(paginated = false, page = 1, pageSize = 20) {
  return api.get(`/badges`, { paginated, page, pageSize });
}

export async function getBadge(badgeId) {
  return api.get(`/badges/${badgeId}`);
}

export async function getAllUserBadges(
  paginated = false,
  page = 1,
  pageSize = 20,
) {
  return api.get(`/user-badges/`, { paginated, page, pageSize });
}

export async function getUserBadge(userBadgeId) {
  return api.get(`/user-badges/${userBadgeId}`);
}

export async function deleteUserBadge(userBadgeId) {
  return api.delete(`/user-badges/${userBadgeId}`);
}

export async function updateUserBadge(userBadgeId, update) {
  return api.put(`/user-badges/update/${userBadgeId}`, update);
}

export async function grantBadge(userId, badgeId) {
  return api.post(`/user-badges/${userId}/${badgeId}`);
}

export async function revokeBadge(userId, badgeId) {
  return api.post(`/user-badges/revoke/${userId}/${badgeId}`);
}

export async function updateUserBadgeStatus(userBadgeId, status) {
  return api.post(`/user-badges/update/${userBadgeId}/status/${status}`);
}
