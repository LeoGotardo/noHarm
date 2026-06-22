import { api } from "../../connectors/api.js";
import { auth, fbLogin } from "../../connectors/firebase.js";
import { tokens } from "../../connectors/tokens.js";

/**
 * Sign in via Google popup, then exchange Firebase UID for app JWT tokens.
 * Stores access + refresh tokens in localStorage on success.
 * @returns {Promise<void | { success: false, errorCode: string, errorMessage: string }>}
 */
export async function signIn() {
  // login
  const userData = await fbLogin();
  if (!userData.success) {
    return userData;
  }

  const { credential, token, user } = userData;
  const firebaseId = user.uid;
  const email = user.email;

  const result = await api.post("/auth/login", { uid, email });
  tokens.set(result);
}

/**
 * Register via Google popup, then create account on the API with Firebase user data.
 * Stores access + refresh tokens in localStorage on success.
 * @returns {Promise<object | { success: false, errorCode: string, errorMessage: string }>}
 */
export async function signUp() {
  // register
  const userData = await fbLogin();
  if (!userData.success) {
    return userData;
  }

  const { credential, token, user } = userData;
  const { uid, email, displayName, photoURL, emailVerified } = user;

  const username = displayName || email;

  const result = await api.post("/auth/register", {
    uid,
    username,
    email,
    photoURL,
    emailVerified,
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
  await fbSignOut(auth);

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
