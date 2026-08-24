/**
 * Node-side Socket.IO client, used to drive realtime events as "the other user"
 * without booting a second browser.
 */
import { io } from "socket.io-client";
import { API_URL } from "./api.js";

const SOCKET_URL = process.env.E2E_SOCKET_URL ?? API_URL;

/** Connect as `user` and resolve once the handshake succeeds. */
export function connectAs(user, timeoutMs = 10_000) {
  return new Promise((resolve, reject) => {
    const socket = io(SOCKET_URL, {
      path: "/ws/socket.io",
      auth: { token: user.accessToken },
      transports: ["websocket"],
      reconnection: false,
    });
    const timer = setTimeout(() => {
      socket.close();
      reject(new Error("socket handshake timed out"));
    }, timeoutMs);
    socket.on("connect", () => {
      clearTimeout(timer);
      resolve(socket);
    });
    socket.on("connect_error", (e) => {
      clearTimeout(timer);
      socket.close();
      reject(new Error(`socket connect_error: ${e.message}`));
    });
  });
}

export function joinChat(socket, chatId) {
  socket.emit("join_chat", { chatId });
}

export function emitTyping(socket, chatId, isTyping) {
  socket.emit("typing", { chatId, isTyping });
}

export function emitMessage(socket, chatId, content) {
  socket.emit("send_message", { chatId, content });
}
