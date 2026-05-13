import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { useEffect, useState } from "react";
import { signInWithGoogle } from "../../firebase";

WebBrowser.maybeCompleteAuthSession();

/**
 * Hook for Google Sign-In with Firebase
 * @returns {Object} { promptAsync, user, loading, error }
 *
 * Usage:
 * const { promptAsync, user, loading, error } = useGoogleAuth();
 *
 * <Button onPress={promptAsync} title="Sign in with Google" />
 */
export function useGoogleAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    scopes: ["profile", "email"],
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      if (authentication?.idToken) {
        handleGoogleSignIn(authentication.idToken, authentication.accessToken);
      }
    } else if (response?.type === "error") {
      setError(new Error("Google Sign-In failed"));
    }
  }, [response]);

  const handleGoogleSignIn = async (idToken, accessToken) => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithGoogle(idToken, accessToken);
      setUser(result.user);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    promptAsync,
    user,
    loading,
    error,
    request,
  };
}
