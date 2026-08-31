import { io } from "socket.io-client";

// Server origin for the socket. The socket.io mount path is passed separately
// as `path` below — putting "/ws" in the URL would make it a namespace and 404.
//
// Empty means "this origin", which is what the web build wants: nginx serves
// the bundle and proxies the socket from the same host. The VITE_API_URL
// fallback is guarded: that value is a relative path (`/api`), and socket.io
// reads a leading slash as a namespace, so it would silently connect to the
// wrong place.
const RAW_SOCKET_ORIGIN =
  import.meta.env.VITE_SOCKET_URL ?? import.meta.env.VITE_API_URL ?? "";
const SOCKET_ORIGIN = RAW_SOCKET_ORIGIN.startsWith("/")
  ? ""
  : RAW_SOCKET_ORIGIN;

// Server mounts socket.io at "/ws" + socketio_path "socket.io".
const SOCKET_PATH = "/ws/socket.io";

// `too_many_connections` clears when one of the user's other sockets closes.
// Well past the handshake window, so the retry is not just the sixth failure.
const CROWDED_RETRY_DELAY = 30_000;

let _socket = null;
// Supplied by connect(). Module-level because a refusal can arrive long after
// the caller's frame is gone — including on a socket.io-driven reconnect.
let _handlers = {};
let _crowdedTimer = null;
// One silent refresh per connected session; cleared on the next `connect`.
let _refreshing = false;

export function connect(accessToken, handlers = {}) {
  // Reuse the existing socket even while it is still handshaking — guarding on
  // `.connected` would spawn a duplicate socket during that window.
  if (_socket) return _socket;

  _handlers = handlers;

  _socket = io(SOCKET_ORIGIN, {
    path: SOCKET_PATH,
    auth: { token: accessToken },
    // Server only serves the websocket transport — polling 404s.
    transports: ["websocket"],
    reconnection: true,
    // Five was sized for a serverless relay that tore every socket down when
    // the function hit its max duration, making reconnects routine. nginx holds
    // the upgrade for as long as the socket lives (proxy_read_timeout 3600s),
    // so a disconnect now means the backend or the network actually went away.
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  _socket.on("connect", () => {
    _refreshing = false;
  });
  _socket.on("connect_error", onConnectError);
  // Handler-level errors: { code, message }
  _socket.on("error", (e) => console.warn("[socket] error:", e));

  return _socket;
}

// The server names the reason for every handshake refusal. Three of the four
// are permanent for this attempt, so socket.io's five automatic retries are
// noise at best: on `too_many_connections` they extend the very condition they
// are waiting out, and on `account_unavailable` they hammer a dead account.
// `disconnect()` on the socket is what stops that retry loop.
function onConnectError(e) {
  switch (e.message) {
    case "invalid_token":
      // Expired or bad signature — a refresh may fix it. The guard means a
      // refresh that does not fix it fails once instead of looping: the flag
      // only clears on a successful `connect`.
      if (_refreshing || !_handlers.onAuthExpired) {
        _socket.disconnect();
        return;
      }
      _refreshing = true;
      _socket.disconnect();
      // reauth() reopens the socket with the new token; nothing to do here.
      Promise.resolve(_handlers.onAuthExpired()).catch(() =>
        _handlers.onSessionEnd?.(),
      );
      return;

    case "account_unavailable":
      // Deleted, banned or blocked. No retry can succeed.
      _socket.disconnect();
      _handlers.onSessionEnd?.();
      return;

    case "too_many_connections":
      // More than 3 sockets for this user.
      _socket.disconnect();
      if (!_crowdedTimer) {
        _crowdedTimer = setTimeout(() => {
          _crowdedTimer = null;
          _socket?.connect();
        }, CROWDED_RETRY_DELAY);
      }
      return;

    case "missing_token":
      // Client bug — retrying sends the same nothing five times over.
      _socket.disconnect();
      console.error("[socket] handshake with no token");
      return;

    default:
      // Network or server-side failure: socket.io's retries are the right
      // answer, so leave them running.
      console.warn("[socket] connect_error:", e.message);
  }
}

// Access token expires every 15 min. After a silent refresh, swap the auth
// token and bounce the connection so the new JWT is used on the next handshake.
export function reauth(accessToken) {
  if (!_socket) return;
  _socket.auth = { token: accessToken };
  _socket.disconnect().connect();
}

export function disconnect() {
  if (_crowdedTimer) {
    clearTimeout(_crowdedTimer);
    _crowdedTimer = null;
  }
  _refreshing = false;
  _handlers = {};
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
