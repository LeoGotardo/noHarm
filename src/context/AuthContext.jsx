import { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import axios from 'axios';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const firebaseApp = initializeApp(firebaseConfig);
const firebaseAuth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);   // { uid, email, displayName, photoURL }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session if tokens exist
    const token = localStorage.getItem('accessToken');
    const savedUser = localStorage.getItem('authUser');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }

    const unsub = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
      if (!firebaseUser) {
        setLoading(false);
      }
      // Don't auto-login on Firebase state change — require explicit login action
    });
    setLoading(false);
    return unsub;
  }, []);

  async function loginWithGoogle() {
    setLoading(true);
    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const { uid, email, displayName, photoURL } = result.user;
      await _exchangeWithBackend({ uid, email, displayName, photoURL });
    } finally {
      setLoading(false);
    }
  }

  async function _exchangeWithBackend({ uid, email, displayName, photoURL }) {
    // Try login first; if 404/403, register then login
    try {
      const { data } = await axios.post(`${BASE_URL}/auth/login`, { uid, email });
      _saveSession(data, { uid, email, displayName, photoURL });
    } catch (err) {
      if (err.response?.status === 404) {
        // User doesn't exist yet — register
        const username = (displayName || email.split('@')[0])
          .replace(/[^a-zA-Z0-9_-]/g, '_')
          .slice(0, 50);
        const { data } = await axios.post(`${BASE_URL}/auth/register`, {
          uid,
          email,
          username,
          photoURL,
          emailVerified: true,
        });
        _saveSession(data, { uid, email, displayName, photoURL });
      } else {
        throw err;
      }
    }
  }

  function _saveSession(tokens, profile) {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    localStorage.setItem('authUser', JSON.stringify(profile));
    setUser(profile);
  }

  async function logout() {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      if (accessToken && refreshToken) {
        await axios.post(
          `${BASE_URL}/auth/logout`,
          { refreshToken },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
      }
    } catch {
      // Best-effort logout
    } finally {
      await signOut(firebaseAuth);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('authUser');
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
