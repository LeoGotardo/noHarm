import { useEffect } from 'react'
import { checkinReminder } from '../services/checkinReminder.js'

/**
 * Schedule or cancel the daily check-in reminder based on user prefs.
 * Re-runs whenever `enabled` changes (master toggle or checkinReminder pref).
 *
 * @param {boolean} enabled - true when master && checkinReminder prefs are both on
 */
export function useCheckinReminder(enabled) {
  useEffect(() => {
    if (enabled) {
      checkinReminder.schedule()
    } else {
      checkinReminder.cancel()
    }
  }, [enabled])
}
