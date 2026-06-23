import { useState, useEffect, useCallback } from 'react'
import { getFriendships, getPendingFriendships, getSentFriendships } from '../services/api/friendship.js'
import { tokens } from '../connectors/tokens.js'
import { onFriendRequest, onFriendAccept, onFriendReject, onFriendRemove, onFriendBlock, onFriendUnblock } from '../services/ws/friendship.js'
import { cacheRead, cacheWrite } from './cache.js'

const empty = { friendships: [], total: 0 }

export function useFriends() {
  const [friends, setFriends]                 = useState(() => cacheRead('friends')?.data ?? empty)
  const [requestsReceived, setRequestsReceived] = useState(() => cacheRead('requests_received')?.data ?? empty)
  const [requestsSent, setRequestsSent]         = useState(() => cacheRead('requests_sent')?.data ?? empty)
  const [loading, setLoading]                 = useState(true)

  const fetchAll = useCallback(async () => {
    try {
      const [f, r, s] = await Promise.all([
        getFriendships(),
        getPendingFriendships(),
        getSentFriendships(),
      ])
      console.log('[useFriends] friends:', f)
      console.log('[useFriends] requests received:', r)
      console.log('[useFriends] requests sent:', s)
      setFriends(f);           cacheWrite('friends', f)
      setRequestsReceived(r);  cacheWrite('requests_received', r)
      setRequestsSent(s);      cacheWrite('requests_sent', s)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchReceived = useCallback(async () => {
    const r = await getPendingFriendships()
    setRequestsReceived(r)
    cacheWrite('requests_received', r)
  }, [])

  useEffect(() => {
    if (!tokens.getAccess()) { setLoading(false); return }
    fetchAll()

    try {
      const unsubs = [
        // New request received → refresh received list only
        onFriendRequest(() => fetchReceived()),
        // Everything else changes the accepted friends list
        onFriendAccept(()   => fetchAll()),
        onFriendReject(()   => fetchAll()),
        onFriendRemove(()   => fetchAll()),
        onFriendBlock(()    => fetchAll()),
        onFriendUnblock(()  => fetchAll()),
      ]
      return () => unsubs.forEach(u => u())
    } catch {
      // Socket not connected yet — WS will be wired once connected
    }
  }, [])

  return { friends, requestsReceived, requestsSent, loading, refetch: fetchAll }
}
