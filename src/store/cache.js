const PREFIX = 'nh_cache_'

/** @returns {{ data: any, at: number } | null} */
export function cacheRead(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

/** @param {string} key @param {any} data */
export function cacheWrite(key, data) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ data, at: Date.now() }))
  } catch {}
}

export function cacheClear(key) {
  localStorage.removeItem(PREFIX + key)
}

/** Returns true if cache exists and is younger than maxAgeMs. */
export function cacheValid(key, maxAgeMs) {
  const c = cacheRead(key)
  return !!c && Date.now() - c.at < maxAgeMs
}
