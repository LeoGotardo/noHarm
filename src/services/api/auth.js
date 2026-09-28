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
  try {
    const result = await api.post("/auth/login", { idToken: userData.idToken });
    tokens.set(result);
  } catch (e) {
    throw withRestoreContext(e, userData.idToken);
  }
}

/**
 * Attach the Firebase ID token to a "this account is scheduled for deletion"
 * error, so the screen that catches it can offer the restore without sending
 * the user back through the Google popup a second time.
 *
 * The token is already in hand and stays valid for about an hour, which is far
 * longer than the two taps the restore takes.
 *
 * @param {unknown} err     the error thrown by the login/register call
 * @param {string} idToken  the Firebase ID token that produced it
 */
function withRestoreContext(err, idToken) {
  if (err?.body?.errorCode === "ACCOUNT_PENDING_DELETION") {
    err.idToken = idToken;
    err.deletionScheduledAt = err.body?.details?.deletionScheduledAt ?? null;
  }
  return err;
}

/**
 * Restore an account that was deleted and is still inside its grace window.
 * Stores the returned tokens, so the caller lands signed in.
 *
 * Separate from signIn on purpose: restoring puts the profile, the friend list
 * and the streak history back in front of other people, and that is not
 * something a sign-in should decide on the user's behalf.
 *
 * @param {string} idToken Firebase ID token for the account being restored
 */
export async function reactivate(idToken) {
  const result = await api.post("/auth/reactivate", { idToken });
  tokens.set(result);
  return result;
}

/**
 * Register via Google popup, then create the account from the verified token.
 * Stores access + refresh tokens in localStorage on success.
 *
 * Only the username, the declared birth date and the three consent answers
 * come from this app. Email, profile picture and the email-verified flag are
 * read from the token's claims server-side: sending them would let a patched
 * client mark itself verified.
 *
 * The consents are three separate answers rather than one. Terms and privacy
 * are a condition of holding an account and the backend refuses without both;
 * `healthDataConsent` covers the streak tracker alone — declining it creates a
 * working account with tracking off, and it can be given or withdrawn later.
 *
 * No version is sent. The backend stamps whichever revision is live when it
 * writes the record, so a client cannot claim agreement to a text it never
 * displayed.
 *
 * @param {string} username
 * @param {{ birthDate: string, acceptedTerms: boolean, acceptedPrivacy: boolean, healthDataConsent: boolean }} consent
 *        `birthDate` as `YYYY-MM-DD`.
 * @returns {Promise<object | { success: false, errorCode: string, errorMessage: string }>}
 */
export async function signUp(username, consent) {
  const userData = await fbLogin();
  if (!userData.success) return userData;

  let result;
  try {
    result = await api.post("/auth/register", {
      idToken: userData.idToken,
      username,
      birthDate: consent.birthDate,
      acceptedTerms: consent.acceptedTerms,
      acceptedPrivacy: consent.acceptedPrivacy,
      healthDataConsent: consent.healthDataConsent,
    });
  } catch (e) {
    // Signing up with an account that is mid-deletion is the same intent as
    // signing in with it, and gets the same offer to restore.
    throw withRestoreContext(e, userData.idToken);
  }

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
