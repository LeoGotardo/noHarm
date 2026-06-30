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
 * @returns {Promise<{ success: true, credential: import('firebase/auth').OAuthCredential, token: string, user: import('firebase/auth').User } | { success: false, errorCode: string, errorMessage: string, email: string, credential: import('firebase/auth').OAuthCredential }>}
 */
export async function fbLogin() {
  return signInWithPopup(auth, provider)
    .then((result) => {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      const user = result.user;
      return { success: true, credential, token, user };
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
