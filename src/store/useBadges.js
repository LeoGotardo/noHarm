import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (!tokens.getAccess()) {
      setLoading(false);
      return;
    }
    if (cacheValid("badges", ONE_HOUR) && cacheValid("user_badges", ONE_HOUR)) {
      setLoading(false);
      return;
    }

    Promise.all([
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
    ]).finally(() => setLoading(false));
  }, []);

  return { badges, userBadges, loading };
}
