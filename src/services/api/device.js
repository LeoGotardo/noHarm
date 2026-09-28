import { api } from "../../connectors/api.js";

/**
 * Register this device's FCM token, with the push categories it wants.
 *
 * Idempotent on the server — registering the same token again updates its
 * preferences — which is how a change to a switch in Settings reaches a push
 * sent while the app is closed. `friends` covers both a request received and
 * a request accepted, the same as the one switch in Settings.
 *
 * @param {string} token
 * @param {{ messages: boolean, friends: boolean }} categories
 */
export async function registerDeviceToken(token, { messages, friends }) {
  return api.post("/notifications", { deviceFCM: token, messages, friends });
}

export async function updateDeviceToken(oldToken, newToken) {
  return api.put(`/notifications/${oldToken}`, { newFCM: newToken });
}

export async function unregisterDeviceToken(token) {
  return api.delete(`/notifications/${token}`);
}
