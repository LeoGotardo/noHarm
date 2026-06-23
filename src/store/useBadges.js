import { useState, useEffect } from 'react'
import { getAllBedges } from '../services/api/badge.js'
import { cacheRead, cacheWrite, cacheValid } from './cache.js'
import { tokens } from '../connectors/tokens.js'

const ONE_HOUR = 3_600_000

export function useBadges() {
  const [badges, setBadges]   = useState(() => cacheRead('badges')?.data ?? { badges: [], total: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tokens.getAccess()) { setLoading(false); return }
    if (cacheValid('badges', ONE_HOUR)) { setLoading(false); return }

    getAllBedges()
      .then(data => { console.log('[useBadges] badges:', data); setBadges(data); cacheWrite('badges', data) })
      .finally(() => setLoading(false))
  }, [])

  return { badges, loading }
}
