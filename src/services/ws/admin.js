import { getSocket } from "../../connectors/socket.js";

/**
 * Alerts about the system itself, for accounts on the backend's allowlist.
 *
 * The backend emits to each administrator's personal room, so this needs no
 * check of its own: an ordinary account is never in one, and subscribing does
 * nothing for them.
 *
 * **It only reaches an open tab.** `notif.send` already skips while the tab is
 * focused — the in-app view is enough then — so in practice this fires when
 * the window is behind something else or minimised. A closed browser receives
 * nothing: there is no Web Push subscription, and the FCM path needs the
 * installed native app. For an SSH login at 3am that is a real gap, and the
 * admin board is where these are guaranteed to be found.
 *
 * @param {(data: { kind: string, title: string, body: string }) => void} handler
 * @returns {() => void} unsubscribe
 */
export function onAdminAlert(handler) {
  const socket = getSocket();
  socket.on("admin_alert", handler);
  return () => socket.off("admin_alert", handler);
}
