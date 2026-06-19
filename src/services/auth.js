/**
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ accessToken: string, refreshToken: string }>}
 */
export async function signIn(email, password) {
  throw new Error('not implemented')
}

export async function signUp(email, password, username) {
  throw new Error('not implemented')
}

export async function signOut() {
  throw new Error('not implemented')
}

/** Refresh app JWT using stored refresh token. Called automatically by api.js on 401. */
export async function refreshAccessToken() {
  throw new Error('not implemented')
}

/** @returns {string|null} */
export function getAccessToken() {
  throw new Error('not implemented')
}
