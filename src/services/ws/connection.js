import { onConnected } from "../../connectors/socket.js";

/**
 * Run `handler` whenever the socket finishes a handshake — at boot and on
 * every reconnect.
 *
 * Socket.IO does not replay what it missed. A message, a friend request or a
 * read receipt emitted while the connection was down simply never arrives, and
 * the screen keeps showing the state from before — an unread badge that never
 * appears, a friend request that shows up tomorrow. The fix is not on the
 * socket at all: it is to re-read over REST at the moment the socket comes
 * back, which is the one instant the client knows it has a gap.
 *
 * @param {() => void} handler
 * @returns {() => void} unsubscribe
 */
export function onSocketReady(handler) {
  return onConnected(handler);
}
