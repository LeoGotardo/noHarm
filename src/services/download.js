/**
 * Hand the user a file.
 *
 * The web build can do this properly: a Blob, an object URL and an `<a
 * download>` click. The native builds cannot — a Capacitor WebView has no
 * download manager, so the same anchor does nothing at all, silently, which is
 * the worst possible outcome for a button labelled "Download my data".
 *
 * Saving to the device on native needs `@capacitor/filesystem` and
 * `@capacitor/share`, two plugins this project does not have. Adding them is a
 * native dependency and a `cap sync` and a rebuild of the Android and iOS
 * projects, which is a larger change than the button is worth today. So this
 * reports honestly instead: `{ ok: false, reason: "unsupported" }`, and the
 * caller shows the data on screen to copy.
 *
 * @param {string} filename
 * @param {unknown} data       serialised with two-space indentation
 * @returns {{ ok: boolean, reason?: string }}
 */
export function downloadJson(filename, data) {
  const json = JSON.stringify(data, null, 2);

  if (isNativeApp()) return { ok: false, reason: "unsupported", json };

  try {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Revoked on the next tick: revoking synchronously races the click in
    // Safari, which reads the URL after the handler returns.
    setTimeout(() => URL.revokeObjectURL(url), 0);
    return { ok: true, json };
  } catch {
    return { ok: false, reason: "failed", json };
  }
}

/** True inside the Capacitor shell, false in a browser. */
export function isNativeApp() {
  try {
    return Boolean(window.Capacitor?.isNativePlatform?.());
  } catch {
    return false;
  }
}

/**
 * Put text on the clipboard.
 *
 * `navigator.clipboard` is unavailable on an insecure origin and can be
 * refused by permission policy, so a false here is expected rather than
 * exceptional — the caller keeps the text on screen to select by hand.
 *
 * @returns {Promise<boolean>}
 */
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
