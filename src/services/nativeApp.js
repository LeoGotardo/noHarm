import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

/**
 * `@capacitor/app` events the Android app reacts to. Android only: iOS has no
 * back button and the web has the browser's own; resuming matters only where
 * the app updates itself.
 *
 * Each returns the function that removes its listener.
 */

function listen(event, handler) {
  if (Capacitor.getPlatform() !== "android") return () => {};
  let handle = null;
  let removed = false;
  App.addListener(event, handler).then((h) => {
    if (removed) h.remove();
    else handle = h;
  });
  return () => {
    removed = true;
    handle?.remove();
  };
}

/**
 * The native half of the back button (the registry is `src/ui/backButton.js`).
 * With a `backButton` listener registered, `@capacitor/app` stops finishing
 * the Activity and the decision is the app's.
 *
 * @param {() => void} handler
 */
export function onHardwareBack(handler) {
  return listen("backButton", handler);
}

/**
 * The app came back to the foreground. Back minimises rather than closes, so
 * the WebView can live for days without a fresh launch.
 *
 * @param {() => void} handler
 */
export function onAppResume(handler) {
  return listen("appStateChange", ({ isActive }) => {
    if (isActive) handler();
  });
}

/**
 * What Android does with a root Activity on back: to the background, process
 * and state kept — not killed, which would drop the socket and the screen.
 */
export function minimizeApp() {
  App.minimizeApp().catch(() => {});
}
