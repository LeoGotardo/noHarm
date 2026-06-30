import { getSocket } from "../../connectors/socket.js";

// --- Listen ---

/**
 * Listen for an incoming friend request.
 * @param {(data: { fromUserId: string, username: string }) => void} handler
 * @returns {() => void} unsubscribe
 */
export function onFriendRequest(handler) {
  const socket = getSocket();
  socket.on("friend_request", handler);
  return () => socket.off("friend_request", handler);
}

/**
 * Listen for a friend request being accepted.
 * @param {(data: { userId: string }) => void} handler
 * @returns {() => void} unsubscribe
 */
export function onFriendAccept(handler) {
  const socket = getSocket();
  socket.on("friend_accept", handler);
  return () => socket.off("friend_accept", handler);
}

/**
 * Listen for a friend request being rejected.
 * @param {(data: { userId: string }) => void} handler
 * @returns {() => void} unsubscribe
 */
export function onFriendReject(handler) {
  const socket = getSocket();
  socket.on("friend_reject", handler);
  return () => socket.off("friend_reject", handler);
}

/**
 * Listen for a friend removal.
 * @param {(data: { userId: string }) => void} handler
 * @returns {() => void} unsubscribe
 */
export function onFriendRemove(handler) {
  const socket = getSocket();
  socket.on("friend_remove", handler);
  return () => socket.off("friend_remove", handler);
}

/**
 * Listen for being blocked by a user.
 * @param {(data: { userId: string }) => void} handler
 * @returns {() => void} unsubscribe
 */
export function onFriendBlock(handler) {
  const socket = getSocket();
  socket.on("friend_block", handler);
  return () => socket.off("friend_block", handler);
}

/**
 * Listen for being unblocked by a user.
 * @param {(data: { userId: string }) => void} handler
 * @returns {() => void} unsubscribe
 */
export function onFriendUnblock(handler) {
  const socket = getSocket();
  socket.on("friend_unblock", handler);
  return () => socket.off("friend_unblock", handler);
}
