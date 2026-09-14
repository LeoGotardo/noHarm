import { useCallback, useEffect, useRef, useState } from "react";

/** Default window a handler stays locked after firing, in ms. */
export const GUARD_MS = 400;

/**
 * Collapse repeated fires of a handler into one.
 *
 * Taps land faster than React repaints, and nothing in this app is idempotent:
 * two taps on "Add friend" are two POSTs, two on Send are two messages, two on
 * a row push the same screen twice. The returned handler runs `fn` once, then
 * ignores further calls until it is safe again —
 *
 * - sync handler: for `gap` ms;
 * - async handler (returns a promise): for as long as the request is in
 *   flight, plus `gap` so the settled UI has painted before another tap lands.
 *
 * Refs only, so wrapping costs no re-render and an inline arrow can be passed
 * straight in. Rejections are observed here as well as by the caller, so a
 * failing handler does not log an unhandled rejection.
 */
export function useGuardedCallback(fn, gap = GUARD_MS) {
  const locked = useRef(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  return useCallback(
    (...args) => {
      if (!fn || locked.current) return undefined;
      locked.current = true;

      const unlock = () => {
        clearTimeout(timer.current);
        timer.current = setTimeout(() => {
          locked.current = false;
        }, gap);
      };

      let out;
      try {
        out = fn(...args);
      } catch (err) {
        unlock();
        throw err;
      }
      if (out && typeof out.then === "function") out.then(unlock, unlock);
      else unlock();
      return out;
    },
    [fn, gap],
  );
}

/**
 * A copy of `value` that trails it by `delay` ms of quiet.
 *
 * For work a keystroke triggers but should not run per keystroke — filtering a
 * list, or asking the backend for another page of the directory.
 */
export function useDebouncedValue(value, delay = 250) {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return settled;
}
