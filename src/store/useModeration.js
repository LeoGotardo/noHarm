import { useEffect, useState } from "react";
import { getQueue } from "../services/api/moderation.js";

/**
 * Whether this account can moderate, and the queue when it can.
 *
 * There is no "am I an admin" endpoint, on purpose: authorisation is the
 * backend's admin gate (`ADMIN_USER_IDS`, official accounts and the accounts
 * they promoted), and every moderation route answers
 * **404** to everyone else rather than 403 — whether an admin surface exists
 * is not something an ordinary caller gets confirmed. So the probe *is* the
 * answer: ask for the queue, and a 404 means "not you".
 *
 * The result is remembered for the session (module-level, not localStorage:
 * the backend decides this on every call anyway, and a cached `true` in
 * storage would be a lie worth nothing to an attacker but confusing to debug).
 * One request per session, made when Settings opens rather than at boot —
 * every user pays it otherwise, for a screen almost none of them can reach.
 */
let probed = null;

export function useModerator(enabled = true) {
  const [isModerator, setIsModerator] = useState(probed ?? false);
  const [checking, setChecking] = useState(enabled && probed === null);

  useEffect(() => {
    if (!enabled || probed !== null) return;

    let cancelled = false;
    getQueue(4)
      .then(() => {
        probed = true;
        if (!cancelled) setIsModerator(true);
      })
      .catch(() => {
        // 404 (not a moderator) and a network failure look the same here, and
        // should: the row stays hidden, and the next session asks again.
        probed = false;
        if (!cancelled) setIsModerator(false);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { isModerator, checking };
}

/** Forget the probe — used when the session changes (logout, delete). */
export function resetModeratorProbe() {
  probed = null;
}
