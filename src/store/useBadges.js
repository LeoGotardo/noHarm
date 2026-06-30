import { useEffect, useState } from "react";
import { tokens } from "../connectors/tokens.js";
import { getAllBadges } from "../services/api/badge.js";
import { cacheRead, cacheValid, cacheWrite } from "./cache.js";

const ONE_HOUR = 3_600_000;

export function useBadges() {
  // API returns { items: [] } — normalize to { badges: [] } for consumers
  const normBadges = (r) => ({ ...r, badges: r.items ?? r.badges ?? [] });
  const [badges, setBadges] = useState(
    () => cacheRead("badges")?.data ?? { badges: [], total: 0 },
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tokens.getAccess()) {
      setLoading(false);
      return;
    }
    if (cacheValid("badges", ONE_HOUR)) {
      setLoading(false);
      return;
    }

    getAllBadges()
      .then((data) => {
        const nd = normBadges(data);
        console.log("[useBadges] badges:", nd);
        setBadges(nd);
        cacheWrite("badges", nd);
      })
      .finally(() => setLoading(false));
  }, []);

  return { badges, loading };
}
