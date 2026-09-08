import { useCallback, useEffect, useState } from "react";
import { tokens } from "../connectors/tokens.js";
import { getAllBadges, getAllUserBadges } from "../services/api/badge.js";
import { cacheRead, cacheValid, cacheWrite } from "./cache.js";

const ONE_HOUR = 3_600_000;

export function useBadges() {
  // API returns { badges: [] } (or { items: [] }) — normalize for consumers
  const normBadges = (r) => ({ ...r, badges: r.items ?? r.badges ?? [] });
  const [badges, setBadges] = useState(
    () => cacheRead("badges")?.data ?? { badges: [], total: 0 },
  );
  // Which badges this user actually earned — the source of truth is
  // /user-badges/, not arithmetic over `milestone` (see services/badges.js).
  const [userBadges, setUserBadges] = useState(
    () => cacheRead("user_badges")?.data ?? [],
  );
  const [loading, setLoading] = useState(true);

  // `force` skips the cache. Badges are granted server-side during a check-in or
  // a streak start, so after one of those the 1 h cache is exactly wrong: it
  // holds the answer from before the grant, and nothing else would refresh it
  // until the hour ran out. The caller that mutates the streak refetches.
  const fetchAll = useCallback(async (force = false) => {
    if (!tokens.getAccess()) {
      setLoading(false);
      return;
    }
    if (
      !force &&
      cacheValid("badges", ONE_HOUR) &&
      cacheValid("user_badges", ONE_HOUR)
    ) {
      setLoading(false);
      return;
    }

    await Promise.all([
      getAllBadges()
        .then((data) => {
          const nd = normBadges(data);
          setBadges(nd);
          cacheWrite("badges", nd);
        })
        .catch(() => {}),
      getAllUserBadges()
        .then((data) => {
          const list = data.badges ?? data.items ?? [];
          setUserBadges(list);
          cacheWrite("user_badges", list);
        })
        .catch(() => {}),
    ]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const refetch = useCallback(() => fetchAll(true), [fetchAll]);

  return { badges, userBadges, loading, refetch };
}
