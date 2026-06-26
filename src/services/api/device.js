import { api } from '../../connectors/api.js'

export async function registerDeviceToken(token) {
  return api.post('/notifications', { deviceFCM: token });
}

export async function updateDeviceToken(oldToken, newToken) {
  return api.put(`/notifications/${oldToken}`, { newFCM: newToken });
}

export async function unregisterDeviceToken(token) {
  return api.delete(`/notifications/${token}`);
}
