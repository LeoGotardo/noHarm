import { api } from "../../connectors/api.js";

export async function getCurrentStreak() {
  return api.get(`/streaks/current`);
}

export async function getStreakRecord() {
  return api.get(`/streaks/record`);
}

export async function getStreakHistory(
  paginated = false,
  page = 1,
  pageSize = 20,
) {
  return api.get(`/streaks/history`, { paginated, page, pageSize });
}

export async function startStreak(start_at = null) {
  return api.post(`/streaks/start`, { start_at });
}

export async function endStreak(end_at = null) {
  return api.post(`/streaks/end`, { end_at });
}

export async function checkinStreak() {
  return api.post(`/streaks/checkin`);
}
