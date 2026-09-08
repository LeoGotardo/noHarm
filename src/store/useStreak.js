import { useCallback, useEffect, useState } from "react";
import { tokens } from "../connectors/tokens.js";
import {
  checkinStreak,
  endStreak,
  getCurrentStreak,
  getStreakRecord,
  startStreak,
} from "../services/api/streak.js";
import { cacheRead, cacheWrite } from "./cache.js";

const KEY_STREAK = "streak_current";
const KEY_RECORD = "streak_record";
const KEY_CHECKIN = "streak_last_checkin"; // stored as 'YYYY-MM-DD'

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/** 'YYYY-MM-DD' of a server timestamp, or null. */
function isoDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

export function daysBetween(isoA, isoB) {
  const a = new Date(isoA + "T00:00:00");
  const b = new Date(isoB + "T00:00:00");
  return Math.floor((b - a) / 86_400_000);
}

export function streakDays(streak) {
  if (!streak?.start_at) return 0;
  const ref = streak.end_at ?? new Date().toISOString();
  return Math.max(
    0,
    Math.floor((new Date(ref) - new Date(streak.start_at)) / 86_400_000),
  );
}

/**
 * Execute the correct sequence of checkin/endStreak API calls.
 * @param {Array<{date: string, time: string}>} relapses - sorted ascending by date
 * @param {string} lastCheckin - 'YYYY-MM-DD' of last recorded checkin
 * @param {string} today - 'YYYY-MM-DD'
 */
async function runCheckinSequence(relapses, lastCheckin, today) {
  const sorted = [...relapses].sort((a, b) => (a.date < b.date ? -1 : 1));
  let windowStart = lastCheckin;

  for (const relapse of sorted) {
    // One check-in for the whole clean window, not one per day. The server does
    // not count check-ins: a streak's length is `end_at - start_at`
    // (streakService._durationDays) and `POST /streaks/checkin` is a plain
    // `last_checkin = now` assignment, so the second call through the tenth
    // change nothing the first did not. See startFrom for what the loop cost.
    const hasCleanDaysBefore = daysBetween(windowStart, relapse.date) - 1 > 0;
    if (hasCleanDaysBefore) await checkinStreak();

    // Relapse: ends current streak with the backdated timestamp
    await endStreak(`${relapse.date}T${relapse.time}:00`);

    windowStart = relapse.date;
  }

  // And one for the window that reaches today, same reasoning.
  if (daysBetween(windowStart, today) > 0) await checkinStreak();
}

export function useStreak() {
  const [streak, setStreak] = useState(
    () => cacheRead(KEY_STREAK)?.data ?? null,
  );
  const [record, setRecord] = useState(
    () => cacheRead(KEY_RECORD)?.data ?? null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // The device cache is only a fast path — `streak.last_checkin` from the API is
  // authoritative, so a fresh device (or a cleared cache) doesn't look like a
  // missed day.
  const today = todayISO();
  const lastCheckinDate =
    cacheRead(KEY_CHECKIN)?.data ?? isoDate(streak?.last_checkin) ?? null;
  const checkedIn = lastCheckinDate === today;
  // Only prompt when there is a real gap to fill in. A streak that has never
  // been checked into has nothing to reconcile, so the dashboard's own check-in
  // button handles it instead of the modal covering the screen.
  const needsCheckin =
    !!streak && lastCheckinDate != null && lastCheckinDate !== today;
  const missedDays = lastCheckinDate
    ? Math.max(1, daysBetween(lastCheckinDate, today))
    : 1;

  const saveStreak = (data) => {
    setStreak(data);
    cacheWrite(KEY_STREAK, data);
  };

  // The personal best is derived from CLOSED streaks, so it changes exactly when
  // one ends — a relapse — and can also move on a check-in that carries the
  // current streak past the old record. Every path that mutates the streak has
  // to re-read it, or the dashboard keeps showing the previous best until the
  // app is restarted.
  const refreshRecord = async () => {
    const rec = await getStreakRecord().catch(() => null);
    if (rec) {
      setRecord(rec);
      cacheWrite(KEY_RECORD, rec);
    }
    return rec;
  };

  const fetchAll = useCallback(async () => {
    try {
      const [cur, rec] = await Promise.all([
        getCurrentStreak().catch((e) =>
          e.status === 404 ? null : Promise.reject(e),
        ),
        getStreakRecord().catch(() => null),
      ]);
      console.log("[useStreak] current streak:", cur);
      console.log("[useStreak] record:", rec);
      saveStreak(cur);
      if (rec) {
        setRecord(rec);
        cacheWrite(KEY_RECORD, rec);
      }
      return cur;
    } catch (e) {
      setError(e);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Perform the batch check-in after the user responds to the modal.
   * @param {Array<{date: string, time: string}>} relapses - empty = all clean
   */
  const performCheckin = useCallback(
    async (relapses = []) => {
      setLoading(true);
      setError(null);
      try {
        const last = lastCheckinDate ?? today;
        await runCheckinSequence(relapses, last, today);
        cacheWrite(KEY_CHECKIN, today);
        const updated = await getCurrentStreak();
        saveStreak(updated);
        const rec = await getStreakRecord().catch(() => null);
        if (rec) {
          setRecord(rec);
          cacheWrite(KEY_RECORD, rec);
        }
        return updated;
      } catch (e) {
        setError(e);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [lastCheckinDate, today],
  );

  /** Manual single-day check-in (dashboard button, when already caught up). */
  const checkIn = useCallback(async () => {
    if (lastCheckinDate === today) return;
    try {
      const updated = await checkinStreak();
      saveStreak(updated);
      cacheWrite(KEY_CHECKIN, today);
      await refreshRecord();
      return updated;
    } catch (e) {
      // Rethrow: the caller shows the celebration toast, and it must not fire
      // when the check-in never reached the server.
      setError(e);
      throw e;
    }
  }, [lastCheckinDate, today]);

  /**
   * Start a brand-new streak, optionally backdated.
   * Calls startStreak() then checkins for every day between startDate and today.
   * @param {string} startDate - 'YYYY-MM-DD'
   */
  const startFrom = useCallback(
    async (startDate) => {
      setLoading(true);
      setError(null);
      try {
        await startStreak(`${startDate}T00:00:00`);

        // One check-in, never one per elapsed day.
        //
        // The loop that used to be here sent a request for every day between
        // the chosen date and today, and `POST /streaks/checkin` allows
        // 10/minute. Backdating by eleven days or more therefore died on 429 —
        // *after* `startStreak` had already succeeded, so the streak existed on
        // the server while the error aborted this function before
        // `saveStreak()` ever ran. The screen showed no streak, retrying
        // answered 409 STREAK_ALREADY_ACTIVE, and the badges looked missing
        // even though the server had granted them: `startStreak` calls
        // `_checkAndGrantBadges` itself, and clean days come from `start_at`,
        // not from how many times anyone checked in.
        if (daysBetween(startDate, today) > 0) await checkinStreak();
        cacheWrite(KEY_CHECKIN, today);
        const [cur, rec] = await Promise.all([
          getCurrentStreak(),
          getStreakRecord().catch(() => null),
        ]);
        saveStreak(cur);
        if (rec) {
          setRecord(rec);
          cacheWrite(KEY_RECORD, rec);
        }
        return cur;
      } catch (e) {
        setError(e);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [today],
  );

  /** Relapse button from dashboard (immediate, no batch). */
  const relapse = useCallback(async () => {
    try {
      const newStreak = await endStreak();
      saveStreak(newStreak);
      cacheWrite(KEY_CHECKIN, today);
      // The streak that just ended is a candidate for the record.
      await refreshRecord();
      return newStreak;
    } catch (e) {
      // Rethrow so a failed reset never shows the compassionate success toast.
      setError(e);
      throw e;
    }
  }, [today]);

  useEffect(() => {
    if (tokens.getAccess()) fetchAll();
    else setLoading(false);
  }, []);

  return {
    streak,
    record,
    days: streakDays(streak),
    checkedIn,
    needsCheckin,
    missedDays,
    lastCheckinDate,
    loading,
    error,
    checkIn,
    relapse,
    performCheckin,
    startFrom,
    refetch: fetchAll,
  };
}
