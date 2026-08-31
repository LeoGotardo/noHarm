// Firebase app init. Import auth from here rather than initialising elsewhere.
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const provider = new GoogleAuthProvider();

export const auth = getAuth(app);
export { provider };

/**
 * Open Google sign-in popup.
 *
 * `idToken` is the only field the API accepts as proof of identity: a JWT
 * signed by Google and scoped to this Firebase project. The UID travels inside
 * it — sending the UID on its own would be sending a public value and asking
 * the backend to take our word for it.
 *
 * @returns {Promise<{ success: true, credential: import('firebase/auth').OAuthCredential, token: string, idToken: string, user: import('firebase/auth').User } | { success: false, errorCode: string, errorMessage: string, email: string, credential: import('firebase/auth').OAuthCredential }>}
 */
export async function fbLogin() {
  return signInWithPopup(auth, provider)
    .then(async (result) => {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      const user = result.user;
      // Fresh from the SDK's cache, refreshed automatically when close to
      // expiry — the backend allows only a few seconds of clock skew.
      const idToken = await user.getIdToken();
      return { success: true, credential, token, idToken, user };
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      const email = error.customData?.email ?? null;
      const credential = GoogleAuthProvider.credentialFromError(error);
      return { success: false, errorCode, errorMessage, email, credential };
    });
}

/**
 * Sign out the current Firebase user.
 * @returns {Promise<true | Error>}
 */
export async function fbLogout() {
  return signOut(auth)
    .then(() => true)
    .catch((error) => error);
}
