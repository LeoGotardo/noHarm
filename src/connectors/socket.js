import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ?? import.meta.env.VITE_API_URL ?? "";

let _socket = null;

export function connect(accessToken) {
  if (_socket?.connected) return _socket;

  _socket = io(SOCKET_URL, {
    auth: { token: accessToken },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  return _socket;
}

export function disconnect() {
  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }
}

/** @returns {import('socket.io-client').Socket} */
export function getSocket() {
  if (!_socket) throw new Error("Socket not connected");
  return _socket;
}

export const chat = {
  join: (chatId) => getSocket().emit("join_chat", { chatId }),
  leave: (chatId) => getSocket().emit("leave_chat", { chatId }),
  send: (chatId, content) =>
    getSocket().emit("send_message", { chatId, content }),
  markRead: (chatId) => getSocket().emit("mark_read", { chatId }),
  typing: (chatId, isTyping) =>
    getSocket().emit("typing", { chatId, isTyping }),
};

export const presence = {
  getOnlineStatus: (userIds) =>
    getSocket().emit("get_online_status", { userIds }),
};
