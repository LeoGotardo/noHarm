import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? import.meta.env.VITE_API_URL ?? ''

let _socket = null

export function connect(accessToken) {
  if (_socket?.connected) return _socket

  _socket = io(SOCKET_URL, {
    auth: { token: accessToken },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  })

  return _socket
}

export function disconnect() {
  if (_socket) { _socket.disconnect(); _socket = null }
}

/** @returns {import('socket.io-client').Socket} */
export function getSocket() {
  if (!_socket) throw new Error('Socket not connected')
  return _socket
}

// Typed event emitters
export const chat = {
  join:      (chatId)            => getSocket().emit('chat:join',      { chatId }),
  leave:     (chatId)            => getSocket().emit('chat:leave',     { chatId }),
  send:      (chatId, text)      => getSocket().emit('chat:send',      { chatId, text }),
  markRead:  (chatId, messageId) => getSocket().emit('chat:mark_read', { chatId, messageId }),
  typing:    (chatId, isTyping)  => getSocket().emit('chat:typing',    { chatId, isTyping }),
}

export const presence = {
  getOnlineStatus: (userIds) => getSocket().emit('presence:get_online_status', { userIds }),
}
