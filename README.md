# NoHarm

NoHarm is an addiction recovery tracker. The core loop: register → start a streak → daily check-in → earn milestone badges → connect with friends for accountability → 1-on-1 chat.

## Contents

- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
  - [Environment variables](#environment-variables)
- [Project structure](#project-structure)
- [Backend](#backend)
- [Mobile](#mobile)
  - [Building the Android APK](#building-the-android-apk)
- [Other files](#other-files)
- [License](#license)

## Tech stack

- **Vite + React 19** SPA (no router library — custom stack-on-tabs navigation)
- **Capacitor** wraps the web build for iOS/Android (FCM push notifications, scheduled local reminders)
- **Firebase Auth** for identity, backed by an app-issued JWT (access + refresh tokens)
- **Socket.IO** for realtime chat, presence, and friend events

## Getting started

```bash
npm install
npm run dev      # Vite dev server with hot reload → http://localhost:5173
npm run build     # production build → dist/
npm run preview   # serve dist/ locally
```

There is no lint script configured. `npm run test:e2e` runs the Playwright suite in `tests/` (needs the backend on `:8080`); `TESTING.md` is the manual QA checklist for every user-facing flow, with 🤖 marking what the suite already covers.

### Environment variables

| Variable          | Purpose                                               |
| ----------------- | ----------------------------------------------------- |
| `VITE_API_URL`    | REST API base URL                                     |
| `VITE_SOCKET_URL` | Socket.IO URL (falls back to `VITE_API_URL` if unset) |

## Project structure

```
src/
  app.jsx          # Root component: nav state machine, theme wiring, routing
  main.jsx         # Mounts <App>, imports theme.css
  theme.css        # CSS custom properties for the four theme variants
  screens/         # React UI, one folder per domain (auth, home, friends, chat, badges, profile)
  ui/               # Low-level primitives (Icon, Avatar, Btn, Card, Field, ...)
  components/      # Composite widgets (Screen, Header, TabBar, StreakRing, ...)
  store/            # React hooks: data fetch + cache + WS subscriptions
  services/         # Domain logic (api/, ws/, notifications, push)
  connectors/       # Transport layer: REST client, Socket.IO singleton, Firebase, token storage
  dev/              # TweaksPanel dev overlay (theme direction/mode/motion)
```

See `CLAUDE.md` for the full architecture breakdown and domain rules (streaks, friendship states, chat lifecycle, notification IDs), and `../noHarmBack/docs/FRONTEND_DESIGN_BRIEF.md` for API shapes.

## Backend

This app talks to [`noHarmBack`](../noHarmBack/), a separate sibling repository — a FastAPI + PostgreSQL service exposing the REST API (`VITE_API_URL`) and Socket.IO server (`VITE_SOCKET_URL`) this frontend consumes. See its `docs/README.md` for architecture, auth flow, and API details.

## Mobile

The web build is wrapped with Capacitor for iOS/Android (`capacitor.config.json`, `appId` `com.no.harm`). Uses `@capacitor/push-notifications` for FCM/APNs and `@capacitor/local-notifications` for the scheduled daily check-in reminder.

The native app has **no origin of its own** — it loads from `capacitor://localhost` (iOS) or `http://localhost` (Android) — so the relative URLs the web build uses cannot resolve. `.env.mobile` must point at an absolute deployed URL, and the backend's `ALLOWED_ORIGINS` must list both localhost origins: the Capacitor app is the only cross-origin client the API has.

### Building the Android APK

**Prerequisites**

| Requirement | Version used to verify these steps |
| ----------- | ---------------------------------- |
| Node        | 20+                                |
| JDK         | OpenJDK 21 (AGP 8.7.2 needs 17+)   |
| Android SDK | platform `android-35`, build-tools `35.0.0` |
| Gradle      | supplied by the wrapper (8.11.1) — do not install it separately |

The SDK location has to be discoverable, either way works:

```bash
export ANDROID_HOME="$HOME/Android/Sdk"      # or
echo "sdk.dir=$HOME/Android/Sdk" > android/local.properties   # gitignored
```

**0. Make sure the native project exists**

`android/` and `ios/` are **generated, not versioned** — `.gitignore` excludes
both. On a fresh clone there is no native project at all:

```bash
npx cap add android
```

Capacitor derives `applicationId` from `appId` in `capacitor.config.json`
(`com.no.harm`). Then drop `google-services.json` — from the Firebase console,
for the Android app registered as `com.no.harm` — into `android/app/`. Without
it the build still succeeds, but the `com.google.gms.google-services` plugin is
skipped and push notifications do not work.

Because the folder is gitignored, **any hand-edit inside `android/` is local to
your machine and is lost when the project is regenerated** — the signing config
below included. Write it down or script it.

**1. Point the bundle at a real backend**

`.env.mobile` is committed with `CHANGE-ME` placeholders. Either edit it, or leave it alone and put the real values in `.env.mobile.local`, which is gitignored and takes precedence:

```ini
# .env.mobile.local
VITE_API_URL=https://noharm.site/api
VITE_SOCKET_URL=https://noharm.site
```

`VITE_*` values are inlined by Vite **at build time** — changing one needs a rebuild plus a re-sync, not a restart.

**2. Build the web bundle and copy it into the native project**

```bash
npm ci
npm run build:mobile        # vite build --mode mobile → dist/
npx cap sync android        # dist/ → android/app/src/main/assets/public + plugin wiring
```

`cap sync` is not optional: without it the APK ships whatever bundle was last copied.

**3. Debug APK** (self-signed with the Android debug key, installable immediately)

```bash
cd android
./gradlew assembleDebug
# → android/app/build/outputs/apk/debug/app-debug.apk
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

**4. Release APK**

`assembleRelease` works as configured but produces `app-release-unsigned.apk` — there is no `signingConfig` in `android/app/build.gradle`. Two ways to get a signed one.

Sign after the fact (nothing to commit):

```bash
keytool -genkeypair -v -keystore ~/noharm-release.jks \
  -alias noharm -keyalg RSA -keysize 2048 -validity 10000

cd android && ./gradlew assembleRelease
$ANDROID_HOME/build-tools/35.0.0/apksigner sign \
  --ks ~/noharm-release.jks \
  --out app-release.apk \
  app/build/outputs/apk/release/app-release-unsigned.apk
```

Or wire the keystore into Gradle, so `assembleRelease` emits a signed APK directly. Add to `android/app/build.gradle`, and keep `android/keystore.properties` out of git:

```groovy
def keystoreProps = new Properties()
def keystoreFile = rootProject.file("keystore.properties")
if (keystoreFile.exists()) keystoreProps.load(new FileInputStream(keystoreFile))

android {
    signingConfigs {
        release {
            storeFile file(keystoreProps['storeFile'])
            storePassword keystoreProps['storePassword']
            keyAlias keystoreProps['keyAlias']
            keyPassword keystoreProps['keyPassword']
        }
    }
    buildTypes {
        release { signingConfig signingConfigs.release }
    }
}
```

The same keystore has to sign every future update: Android refuses an upgrade signed by a different key. Back it up.

For Play Store uploads use `./gradlew bundleRelease` instead — an `.aab`, not an APK.

**What commonly breaks**

- **`No matching client found for package name '…'`** at `:app:processDebugGoogleServices` — the build stops there. `applicationId` in `android/app/build.gradle` must equal a `package_name` in `android/app/google-services.json` (`com.no.harm`). A project generated by `cap add android` gets this right on its own; a hand-edited `applicationId` is how it drifts. The Java `namespace` is a separate thing and does not have to match.
- **`SDK location not found`** — `ANDROID_HOME` unset and no `android/local.properties`.
- **A change that does not show up in the app** — `npm run build:mobile` without `npx cap sync android`.
- **REST calls fail while the socket works** — `ALLOWED_ORIGINS` on the backend is missing `capacitor://localhost` / `http://localhost`. Only the mobile build sends a preflight; the web build is same-origin.
- `@capacitor/cli` is pinned at 7.6.7 while the platforms and core are 8.4.1. `cap sync` works across that skew, but the CLI is a major version behind — align them before relying on newer `cap` flags.

## Other files

- This project was originally bootstrapped from an Expo template. Those leftovers (`AGENTS.md`, `scripts/reset-project.js`, the standalone CDN demo HTML) have been removed — the project is Vite + React + Capacitor, not Expo.

## License

MIT — see `LICENSE`.
