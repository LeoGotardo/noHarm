import {
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { api } from "../../connectors/api.js";
import { auth } from "../../connectors/firebase.js";
import { tokens } from "../../connectors/tokens.js";

/**
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ accessToken: string, refreshToken: string }>}
 */
export async function signIn(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await cred.user.getIdToken();
  const result = await api.post("/auth/login", { idToken });
  tokens.set(result);
  return result;
}

export async function signUp(email, password, username) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const idToken = await cred.user.getIdToken();
  const result = await api.post("/auth/register", { idToken, username });
  tokens.set(result);
  return result;
}

export async function signOut() {
  await fbSignOut(auth);
  tokens.clear();
}

/** @returns {string|null} */
export const getAccessToken = tokens.getAccess;
