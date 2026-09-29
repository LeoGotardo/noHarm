import { Capacitor } from "@capacitor/core";

/**
 * The public landing page, and when a visitor is sent to it.
 *
 * On the web, someone arriving at `/` without a session is a visitor, and the
 * first thing a visitor sees is `public/about.html` — what NoHarm is, not a
 * sign-in button. It is a static page nginx serves at `/about` (and
 * `vite.config.js` mirrors that in dev), so it is also what Google's OAuth
 * review and a shared link open.
 *
 * Never in the installed app: the Capacitor shell has no `/about` to go to —
 * the bundle is served from the device — and someone who installed NoHarm
 * does not need to be sold on it. An installed PWA (`display-mode:
 * standalone`) is treated the same way, for the same reason.
 *
 * The landing's buttons come back as `/?start=register` or `/?start=login`,
 * which `app.jsx` reads as the first screen to show. That query is also what
 * keeps them from bouncing straight back here.
 */
export const LANDING_PATH = "/about";

/** Whether this runtime has a landing page at all. */
export function landingApplies() {
  if (Capacitor.isNativePlatform()) return false;
  try {
    return !window.matchMedia("(display-mode: standalone)").matches;
  } catch {
    return true;
  }
}

/** The screen a `?start=` link asked for, or null. */
export function requestedStart() {
  const start = new URLSearchParams(window.location.search).get("start");
  return start === "register" || start === "login" ? start : null;
}

/** Leave the app for the landing page. */
export function goToLanding() {
  window.location.assign(LANDING_PATH);
}
