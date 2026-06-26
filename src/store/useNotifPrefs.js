import { useState } from 'react'

const KEY = 'nh_notif_prefs'

const DEFAULTS = {
  master:          false, // overall on/off; turning on requests OS permission
  messages:        true,  // new chat messages
  friendRequests:  true,  // incoming friend requests
  friendAccepted:  true,  // friend request accepted
  checkinReminder: true,  // daily check-in reminder
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS }
  } catch {
    return { ...DEFAULTS }
  }
}

function save(prefs) {
  localStorage.setItem(KEY, JSON.stringify(prefs))
}

export function useNotifPrefs() {
  const [prefs, setPrefs] = useState(load)

  function set(key, value) {
    setPrefs(prev => {
      const next = { ...prev, [key]: value }
      save(next)
      return next
    })
  }

  function setMaster(value) {
    // Turning off master disables all; turning on restores individual prefs
    setPrefs(prev => {
      const next = { ...prev, master: value }
      save(next)
      return next
    })
  }

  return { prefs, set, setMaster }
}
