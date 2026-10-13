import { useEffect, useLayoutEffect, useRef } from "react";

/**
 * Android's back button.
 *
 * Left alone, Capacitor finishes the Activity on back and the whole app closes
 * at once — this app has no router and no browser history to step through.
 * Instead, everything that has a "back" registers it while it is on screen,
 * and the listener in `app.jsx` runs only the topmost one:
 *
 * - `overlay` — a sheet, the emoji picker, a dropdown — closes first. A sheet
 *   the user is not allowed to dismiss (the check-in, a moderation notice, an
 *   update mid-download) registers too, with nothing to run: back is swallowed
 *   rather than navigating away underneath it, the same way Escape is.
 * - `page` is the screen's own back arrow (`Header`, the chat thread's), so
 *   the button goes exactly where the arrow goes, guards and all.
 *
 * Within a layer the latest registration wins. With nothing registered,
 * `app.jsx` falls back to the stack: pop, then the Home tab, then minimise.
 */

const stack = [];

/** Registers what back does; returns the function that removes it. */
export function pushBackHandler(run, layer = "overlay") {
  const entry = { layer, run };
  stack.push(entry);
  return () => {
    const i = stack.indexOf(entry);
    if (i >= 0) stack.splice(i, 1);
  };
}

/**
 * Runs the topmost handler: overlays before pages, and the latest within
 * each. The layer cannot come from mount order — a child's effect runs before
 * its screen's, so a sheet open on mount would end up underneath the page.
 *
 * @returns {boolean} whether anything handled it
 */
export function runBackHandler() {
  for (const layer of ["overlay", "page"]) {
    for (let i = stack.length - 1; i >= 0; i--) {
      if (stack[i].layer === layer) {
        stack[i].run?.();
        return true;
      }
    }
  }
  return false;
}

/**
 * While `active`, Android's back button calls `handler` (may be empty: back is
 * then swallowed). The registration only changes with `active`: a new handler
 * every render must not lift a page above a sheet opened after it.
 */
export function useBackHandler(active, handler, layer = "overlay") {
  const latest = useRef(handler);
  useLayoutEffect(() => {
    latest.current = handler;
  });

  useEffect(() => {
    if (!active) return undefined;
    return pushBackHandler(() => latest.current?.(), layer);
  }, [active, layer]);
}
