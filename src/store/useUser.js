import { useEffect, useState } from "react";
import { tokens } from "../connectors/tokens.js";
import { getMe } from "../services/api/user.js";
import { cacheRead, cacheWrite } from "./cache.js";

const KEY = "me";

export function useUser() {
  const [me, setMe] = useState(() => cacheRead(KEY)?.data ?? null);
  const [loading, setLoading] = useState(!me);
  const [error, setError] = useState(null);

  async function fetch() {
    try {
      const data = await getMe();
      console.log("[useUser] me:", data);
      setMe(data);
      cacheWrite(KEY, data);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tokens.getAccess()) {
      fetch();
    } else {
      setLoading(false);
    }
  }, []);

  return { me, loading, error, refetch: fetch };
}
