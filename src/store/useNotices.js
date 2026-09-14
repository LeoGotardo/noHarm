import { useCallback, useEffect, useState } from "react";
import { tokens } from "../connectors/tokens.js";
import { acknowledgeNotice, getMyNotices } from "../services/api/notice.js";

/**
 * The moderation notices waiting for this user.
 *
 * Fetched once when the app boots, because that is when they are shown: a
 * warning is a thing said once, and saying it in the middle of a check-in
 * would be worse than useless. Oldest first — two waiting notices are a
 * sequence, and the warning that came before a suspension explains it.
 */
export function useNotices(enabled) {
  const [pending, setPending] = useState([]);

  const load = useCallback(async () => {
    if (!tokens.getAccess()) return;
    try {
      const res = await getMyNotices(true);
      setPending(res.notices ?? []);
    } catch {
      // A notice that fails to load is shown next time. Never block the app on
      // it: this runs at boot, in front of everything else.
    }
  }, []);

  useEffect(() => {
    if (enabled) load();
  }, [enabled, load]);

  const acknowledge = useCallback(async (noticeId) => {
    // Dropped from the queue first: the sheet closes on tap, and a failed
    // acknowledgement simply means the notice comes back next time.
    setPending((prev) => prev.filter((n) => n.id !== noticeId));
    try {
      await acknowledgeNotice(noticeId);
    } catch {}
  }, []);

  return { notice: pending[0] ?? null, pending, acknowledge, refetch: load };
}
