import { presence as presenceSocket, getSocket } from '../../connectors/socket.js'

// --- Emit ---

/**
 * Request online status for a list of users.
 * Response arrives via {@link onOnlineStatus}.
 * @param {string[]} userIds
 */
export const getOnlineStatus = (userIds) => presenceSocket.getOnlineStatus(userIds)

// --- Listen ---

/**
 * Listen for online status updates.
 * The server may push this in response to {@link getOnlineStatus} or when a user's status changes.
 * @param {(data: { userId: string, online: boolean }) => void} handler
 * @returns {() => void} unsubscribe
 */
export function onOnlineStatus(handler) {
  const socket = getSocket()
  socket.on('online_status', handler)
  return () => socket.off('online_status', handler)
}

/**
 * Format a last-seen ISO timestamp into a human-readable relative string.
 * @param {string} lastSeenIso
 * @returns {string} e.g. "2h ago"
 */
export function formatLastSeen(lastSeenIso) {
  const diff = Date.now() - new Date(lastSeenIso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}
