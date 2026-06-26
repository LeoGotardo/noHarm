import { useState, useEffect, useCallback } from 'react'
import { getFriendships, getPendingFriendships, getSentFriendships } from '../services/api/friendship.js'
import { tokens } from '../connectors/tokens.js'
import { onFriendRequest, onFriendAccept, onFriendReject, onFriendRemove, onFriendBlock, onFriendUnblock } from '../services/ws/friendship.js'
import { cacheRead, cacheWrite } from './cache.js'

const empty = { friendships: [], total: 0 }

// API returns { items: [] } — normalize to { friendships: [] } for consumers
const norm = (r) => ({ ...r, friendships: r.items ?? r.friendships ?? [] })

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
      const nf = norm(f), nr = norm(r), ns = norm(s)
      setFriends(nf);           cacheWrite('friends', nf)
      setRequestsReceived(nr);  cacheWrite('requests_received', nr)
      setRequestsSent(ns);      cacheWrite('requests_sent', ns)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchReceived = useCallback(async () => {
    const nr = norm(await getPendingFriendships())
    setRequestsReceived(nr)
    cacheWrite('requests_received', nr)
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
