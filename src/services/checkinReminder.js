import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'

const NOTIF_ID   = 1001
const REMIND_HOUR = 21 // 9 PM — fire if user hasn't checked in by then

function atHour(hour, daysFromNow = 0) {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  d.setHours(hour, 0, 0, 0)
  return d
}

const NOTIFICATION = {
  id:    NOTIF_ID,
  title: 'How are you doing today?',
  body:  'Take a moment to check in. Every day counts. 🌿',
}

export const checkinReminder = {
  async requestPermission() {
    if (!Capacitor.isNativePlatform()) return true
    const { display } = await LocalNotifications.requestPermissions()
    return display === 'granted'
  },

  /** Schedule reminder for today at REMIND_HOUR, or tomorrow if past that hour. */
  async schedule() {
    if (!Capacitor.isNativePlatform()) return
    await this.cancel()

    const target = atHour(REMIND_HOUR)
    const at = new Date() >= target ? atHour(REMIND_HOUR, 1) : target

    await LocalNotifications.schedule({
      notifications: [{ ...NOTIFICATION, schedule: { at } }],
    })
  },

  /** After a check-in — push reminder to tomorrow. */
  async reschedule() {
    if (!Capacitor.isNativePlatform()) return
    await this.cancel()
    await LocalNotifications.schedule({
      notifications: [{ ...NOTIFICATION, schedule: { at: atHour(REMIND_HOUR, 1) } }],
    })
  },

  async cancel() {
    if (!Capacitor.isNativePlatform()) return
    try { await LocalNotifications.cancel({ notifications: [{ id: NOTIF_ID }] }) } catch {}
  },
}
