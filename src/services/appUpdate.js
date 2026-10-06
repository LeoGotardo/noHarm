import { Capacitor, registerPlugin } from "@capacitor/core";

/**
 * Updates the Android app from GitHub Releases.
 *
 * Every time the app opens (Android, release build) it asks GitHub for the
 * latest release; when that tag makes a higher versionCode than the installed
 * one, `UpdateSheet` offers to download and install it. The native half is the
 * local plugin in `plugins/app-updater/` (`AppUpdaterPlugin.java`), which
 * `npx cap sync` registers like any other.
 *
 * The repository is public, so the unauthenticated API is enough — 60 requests
 * an hour per IP, one per app open.
 */

const GITHUB_REPO = "LeoGotardo/noHarm";
const LATEST_RELEASE_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
const CHECK_TIMEOUT_MS = 8000;

export const AppUpdater = registerPlugin("AppUpdater");

const TAG_PATTERN = /^v(\d+)\.(\d+)\.(\d+)$/;

/**
 * The formula of scripts/build-android-release.sh: v1.2.3 → 10203. It is the
 * number Android compares, so deciding to update uses the same one — change
 * one, change both.
 *
 * @returns {number | null}
 */
export function versionCodeFromTag(tag) {
  const m = TAG_PATTERN.exec(String(tag).trim());
  if (!m) return null;
  const [major, minor, patch] = m.slice(1).map(Number);
  if (minor >= 100 || patch >= 100) return null;
  return major * 10000 + minor * 100 + patch;
}

/**
 * The update a release offers, or null when it is nothing newer.
 *
 * @returns {{ version: string, apkUrl: string, apkName: string } | null}
 */
export function pickUpdate(release, installedVersionCode) {
  if (!release?.tag_name || release.draft || release.prerelease) return null;
  const code = versionCodeFromTag(release.tag_name);
  if (code === null || code <= installedVersionCode) return null;
  const apk = release.assets?.find(
    (a) => a.name?.endsWith(".apk") && a.browser_download_url,
  );
  if (!apk) return null;
  return { version: release.tag_name, apkUrl: apk.browser_download_url, apkName: apk.name };
}

/**
 * Asks GitHub. Any failure — offline, timeout, the API's rate limit — is null:
 * without a connection the app simply opens, with nothing said.
 */
export async function checkForUpdate() {
  if (Capacitor.getPlatform() !== "android" || !navigator.onLine) return null;
  try {
    const info = await AppUpdater.getInfo();
    // A debug APK is signed with another key: the installer would refuse the release.
    if (info.debug) return null;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);
    try {
      const res = await fetch(LATEST_RELEASE_API_URL, {
        headers: { Accept: "application/vnd.github+json" },
        signal: controller.signal,
      });
      if (!res.ok) return null;
      return pickUpdate(await res.json(), info.versionCode);
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return null;
  }
}
