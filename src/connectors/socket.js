import { io } from "socket.io-client";

// Server origin for the socket. The socket.io mount path is passed separately
// as `path` below — putting "/ws" in the URL would make it a namespace and 404.
const SOCKET_ORIGIN =
  import.meta.env.VITE_SOCKET_URL ?? import.meta.env.VITE_API_URL ?? "";

// Server mounts socket.io at "/ws" + socketio_path "socket.io".
const SOCKET_PATH = "/ws/socket.io";

let _socket = null;

export function connect(accessToken) {
  // Reuse the existing socket even while it is still handshaking — guarding on
  // `.connected` would spawn a duplicate socket during that window.
  if (_socket) return _socket;

  _socket = io(SOCKET_ORIGIN, {
    path: SOCKET_PATH,
    auth: { token: accessToken },
    // Server only serves the websocket transport — polling 404s.
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  // Handshake / auth failures: missing_token, invalid_token, too_many_connections
  _socket.on("connect_error", (e) =>
    console.warn("[socket] connect_error:", e.message),
  );
  // Handler-level errors: { code, message }
  _socket.on("error", (e) => console.warn("[socket] error:", e));

  return _socket;
}

// Access token expires every 15 min. After a silent refresh, swap the auth
// token and bounce the connection so the new JWT is used on the next handshake.
export function reauth(accessToken) {
  if (!_socket) return;
  _socket.auth = { token: accessToken };
  _socket.disconnect().connect();
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
