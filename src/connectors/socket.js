// Socket.IO singleton. Call connect() after auth, disconnect() on sign-out.
let _socket = null

export function connect(accessToken) {
  throw new Error('not implemented')
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
  join:      (chatId)              => getSocket().emit('chat:join',       { chatId }),
  leave:     (chatId)              => getSocket().emit('chat:leave',      { chatId }),
  send:      (chatId, text)        => getSocket().emit('chat:send',       { chatId, text }),
  markRead:  (chatId, messageId)   => getSocket().emit('chat:mark_read',  { chatId, messageId }),
  typing:    (chatId, isTyping)    => getSocket().emit('chat:typing',     { chatId, isTyping }),
}

export const presence = {
  getOnlineStatus: (userIds) => getSocket().emit('presence:get_online_status', { userIds }),
}
