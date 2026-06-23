import { useState, useEffect, useCallback } from 'react'
import { getCurrentStreak, getStreakRecord, checkinStreak, endStreak } from '../services/api/streak.js'
import { cacheRead, cacheWrite } from './cache.js'
import { tokens } from '../connectors/tokens.js'

const KEY_STREAK  = 'streak_current'
const KEY_RECORD  = 'streak_record'
const KEY_CHECKIN = 'streak_last_checkin' // stored as 'YYYY-MM-DD'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function daysBetween(isoA, isoB) {
  const a = new Date(isoA + 'T00:00:00')
  const b = new Date(isoB + 'T00:00:00')
  return Math.floor((b - a) / 86_400_000)
}

export function streakDays(streak) {
  if (!streak?.start) return 0
  const ref = streak.end ?? new Date().toISOString()
  return Math.max(0, Math.floor((new Date(ref) - new Date(streak.start)) / 86_400_000))
}

/**
 * Execute the correct sequence of checkin/endStreak API calls.
 * @param {Array<{date: string, time: string}>} relapses - sorted ascending by date
 * @param {string} lastCheckin - 'YYYY-MM-DD' of last recorded checkin
 * @param {string} today - 'YYYY-MM-DD'
 */
async function runCheckinSequence(relapses, lastCheckin, today) {
  const sorted = [...relapses].sort((a, b) => (a.date < b.date ? -1 : 1))
  let windowStart = lastCheckin

  for (const relapse of sorted) {
    // Days in the clean window before this relapse (exclusive of relapse day)
    const daysBefore = Math.max(0, daysBetween(windowStart, relapse.date) - 1)
    for (let i = 0; i < daysBefore; i++) await checkinStreak()

    // Relapse: ends current streak, API starts a new one immediately
    await endStreak()

    windowStart = relapse.date
  }

  // Checkin for remaining days from last relapse (or lastCheckin) through today
  const daysAfter = Math.max(0, daysBetween(windowStart, today))
  for (let i = 0; i < daysAfter; i++) await checkinStreak()
}

export function useStreak() {
  const [streak, setStreak]   = useState(() => cacheRead(KEY_STREAK)?.data  ?? null)
  const [record, setRecord]   = useState(() => cacheRead(KEY_RECORD)?.data  ?? null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const lastCheckinDate = cacheRead(KEY_CHECKIN)?.data ?? null
  const today           = todayISO()
  const needsCheckin    = !!streak && lastCheckinDate !== today
  const checkedIn       = lastCheckinDate === today
  const missedDays      = lastCheckinDate ? Math.max(1, daysBetween(lastCheckinDate, today)) : 1

  const saveStreak = (data) => { setStreak(data); cacheWrite(KEY_STREAK, data) }

  const fetchAll = useCallback(async () => {
    try {
      const [cur, rec] = await Promise.all([
        getCurrentStreak(),
        getStreakRecord().catch(() => null),
      ])
      console.log('[useStreak] current streak:', cur)
      console.log('[useStreak] record:', rec)
      saveStreak(cur)
      if (rec) { setRecord(rec); cacheWrite(KEY_RECORD, rec) }
      return cur
    } catch (e) {
      setError(e)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Perform the batch check-in after the user responds to the modal.
   * @param {Array<{date: string, time: string}>} relapses - empty = all clean
   */
  const performCheckin = useCallback(async (relapses = []) => {
    setLoading(true)
    setError(null)
    try {
      const last = lastCheckinDate ?? today
      await runCheckinSequence(relapses, last, today)
      cacheWrite(KEY_CHECKIN, today)
      const updated = await getCurrentStreak()
      saveStreak(updated)
      const rec = await getStreakRecord().catch(() => null)
      if (rec) { setRecord(rec); cacheWrite(KEY_RECORD, rec) }
      return updated
    } catch (e) {
      setError(e)
      throw e
    } finally {
      setLoading(false)
    }
  }, [lastCheckinDate, today])

  /** Manual single-day check-in (dashboard button, when already caught up). */
  const checkIn = useCallback(async () => {
    if (lastCheckinDate === today) return
    try {
      const updated = await checkinStreak()
      saveStreak(updated)
      cacheWrite(KEY_CHECKIN, today)
      return updated
    } catch (e) { setError(e) }
  }, [lastCheckinDate, today])

  /** Relapse button from dashboard (immediate, no batch). */
  const relapse = useCallback(async () => {
    try {
      const newStreak = await endStreak()
      saveStreak(newStreak)
      cacheWrite(KEY_CHECKIN, today)
      return newStreak
    } catch (e) { setError(e) }
  }, [today])

  useEffect(() => {
    if (tokens.getAccess()) fetchAll()
    else setLoading(false)
  }, [])

  return {
    streak,
    record,
    days: streakDays(streak),
    checkedIn,
    needsCheckin,
    missedDays,
    lastCheckinDate,
    loading,
    error,
    checkIn,
    relapse,
    performCheckin,
    refetch: fetchAll,
  }
}
