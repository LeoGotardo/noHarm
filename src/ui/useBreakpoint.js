import { useSyncExternalStore } from "react";

// Keep equal to the @media breakpoint in src/theme.css. Two declarations of
// the same number is the cost of driving metrics from CSS and structure from
// React; a mismatch shows up as a side rail over a 480px-wide column.
export const WIDE_MIN = 900;

const QUERY = `(min-width: ${WIDE_MIN}px)`;

// One MediaQueryList for the whole app: every caller subscribes to the same
// object, so N components cost one listener, not N.
const mql =
  typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia(QUERY)
    : null;

function subscribe(onChange) {
  if (!mql) return () => {};
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function isWide() {
  return mql ? mql.matches : false;
}

/**
 * True once the viewport is wide enough for the desktop shell.
 *
 * Use it only where the *markup* differs — the side rail replacing the tab
 * bar, a list and a detail side by side. Sizes, gutters and column widths are
 * CSS custom properties in theme.css (`--pad-x`, `--content-max`, …) so that
 * dragging a window edge repaints without re-rendering React.
 */
export function useWide() {
  return useSyncExternalStore(subscribe, isWide, () => false);
}
