import { api } from "../../connectors/api.js";
import { fbLogin, fbLogout } from "../../connectors/firebase.js";
import { tokens } from "../../connectors/tokens.js";

/**
 * Sign in via Google popup, then exchange the Firebase ID token for app JWTs.
 * Stores access + refresh tokens in localStorage on success.
 * @returns {Promise<void | { success: false, errorCode: string, errorMessage: string }>}
 */
export async function signIn() {
  // login
  const userData = await fbLogin();
  if (!userData.success) {
    return userData;
  }

  // Identity is whatever the backend reads out of the verified token — nothing
  // this side sends about who the user is would be believed anyway.
  const result = await api.post("/auth/login", { idToken: userData.idToken });
  tokens.set(result);
}

/**
 * Register via Google popup, then create the account from the verified token.
 * Stores access + refresh tokens in localStorage on success.
 *
 * Only the username comes from this app. Email, profile picture and the
 * email-verified flag are read from the token's claims server-side: sending
 * them would let a patched client mark itself verified.
 *
 * @returns {Promise<object | { success: false, errorCode: string, errorMessage: string }>}
 */
export async function signUp(username) {
  const userData = await fbLogin();
  if (!userData.success) return userData;

  const result = await api.post("/auth/register", {
    idToken: userData.idToken,
    username,
  });

  tokens.set(result);
  return result;
}

/**
 * Sign out from Firebase and invalidate the app JWT.
 * Clears tokens from localStorage.
 * @returns {Promise<object>}
 */
export async function signOut() {
  await fbLogout();

  const refreshToken = tokens.getRefresh();

  const result = await api.post("/auth/logout", { refreshToken });
  tokens.clear();
  return result;
}

/**
 * Exchange the stored refresh token for a new access token.
 * Called automatically by the API connector on 401.
 * @returns {Promise<{ accessToken: string, refreshToken: string, tokenType: string }>}
 */
export async function refreshToken() {
  const refreshToken = tokens.getRefresh();

  const result = await api.post("/auth/refresh", { refreshToken });
  tokens.set(result);
  return result;
}

/** @returns {string|null} */
export const getAccessToken = tokens.getAccess;
