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
  - [Building for iOS](#building-for-ios)
  - [Releases (versions, notes and the APK)](#releases-versions-notes-and-the-apk)
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

`.env.example` lists every one. All are inlined at build time, so a change needs a rebuild.

| Variable | Purpose |
| -------- | ------- |
| `VITE_API_URL` | REST API base URL — `/api` for the web build (same origin as the page) |
| `VITE_SOCKET_URL` | Socket.IO URL — empty for the web build (the page's origin); unset falls back to `VITE_API_URL` |
| `VITE_DEV_BACKEND_ORIGIN` | Where `npm run dev` proxies `/api` and `/ws` (default `http://localhost:8080`) |
| `VITE_FIREBASE_*` | The six Firebase web-config values (API key, auth domain, project, storage bucket, sender id, app id) |
| `VITE_STATUS_CONSTANTS` | The backend's `STATUS_CODES`, as JSON |
| `VITE_SUPPORT_EMAIL` | Where appeals go — shown on notices and refused sign-ins |
| `VITE_APP_VERSION` | The release tag shown in Settings — set by `deploy-host.sh` and the release workflow; unset reads `dev` |
| `VITE_DELETION_GRACE_DAYS` | Copy only; must match the backend's `ACCOUNT_DELETION_GRACE_DAYS` |
| `VITE_MINIMUM_AGE` | Copy only; must match the backend's `MINIMUM_AGE_YEARS` |

The mobile build reads `.env.mobile` instead (absolute URLs — see Mobile).

## Project structure

```
src/
  app.jsx          # Root component: nav state machine, theme wiring, routing
  main.jsx         # Mounts <App>, imports theme.css (or sends a web visitor to the landing page)
  landing.js       # When the landing page applies, and the ?start= links back from it
  theme.css        # CSS custom properties for the four theme variants
  screens/         # React UI, one folder per domain (auth, home, friends, chat, community,
                   # notifications, badges, profile, legal, moderation, admin)
  ui/               # Low-level primitives (Icon, Avatar, Btn, Card, Field, ...)
  components/      # Composite widgets (Screen, Header, TabBar, StreakRing, ...)
  store/            # React hooks: data fetch + cache + WS subscriptions
  services/         # Domain logic (api/, ws/, notifications, push)
  connectors/       # Transport layer: REST client, Socket.IO singleton, Firebase, token storage
scripts/
  build-legal.mjs              # regenerates public/terms.html and privacy.html (npm run legal)
  build-android-release.sh     # signed release APK for one version (used by the release workflow)
  build-app-icons.mjs          # rasterises the logo into assets/ (icon + splash sources)
  setup-release-secrets.sh     # one-time: release keystore + repository secrets
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

### Building for iOS

There is no APK equivalent you can just hand someone. An iOS build is an `.ipa`,
and an iPhone installs one only when Apple's signing chain accepts it. Two
things cannot be worked around:

- **macOS with Xcode.** The native build only runs there. From Linux the options
  are a borrowed Mac or a cloud macOS runner (see the end of this section).
- **An Apple account.** A free Apple ID can run the app on *your own* device,
  and the install expires after 7 days. Anything else — TestFlight, the App
  Store, someone else's phone — needs the Apple Developer Program (US$ 99/year).

| Route | Needs | Gets you |
|-------|-------|----------|
| Xcode → Run on a cabled iPhone | Mac, free Apple ID | Your device only, re-install every 7 days |
| TestFlight | Mac, paid account | Testers install from the TestFlight app (up to 10 000); each build lasts 90 days |
| App Store | Mac, paid account, App Review | Public release |
| Cloud macOS (GitHub Actions `macos-latest`, Codemagic, Appflow) | Paid account, no Mac | Signed `.ipa` uploaded to TestFlight from CI |

**Prerequisites (on the Mac)**

| Requirement | Notes |
| ----------- | ----- |
| Xcode       | Current release from the App Store, then `xcode-select --install` |
| CocoaPods   | `brew install cocoapods` — `cap sync ios` runs `pod install` |
| Node        | 20+ |

**0. Regenerate the native project**

`ios/` is gitignored like `android/`, and the copy that exists on some machines
predates the current setup. Two problems with it:

- its deployment target is **iOS 14**, while `@capacitor/ios` 8 requires **15**,
  so `pod install` fails;
- its bundle id is `com.noharm.app`, not the `appId` (`com.no.harm`) the
  Firebase apps are registered under.

Start clean:

```bash
rm -rf ios
npx cap add ios           # bundle id = appId from capacitor.config.json
```

**1. Point the bundle at a real backend and sync**

The same `.env.mobile` / `.env.mobile.local` as Android (step 1 above), then:

```bash
npm ci
npm run build:mobile
npx cap sync ios          # dist/ → ios/App/App/public, plus pod install
npx cap open ios          # opens ios/App/App.xcworkspace in Xcode
```

Always open the **`.xcworkspace`**, never the `.xcodeproj` — the latter does not
see the pods and fails to link Capacitor.

**2. Signing**

In Xcode: target **App** → *Signing & Capabilities* → tick *Automatically manage
signing* and pick your **Team** (sign in under Xcode → Settings → Accounts).
Bump *Version* (`MARKETING_VERSION`) for each release and *Build*
(`CURRENT_PROJECT_VERSION`) for each upload — TestFlight rejects a build number
it has already seen.

**3a. Run on your own iPhone**

Plug it in, trust the Mac, enable *Developer Mode* on the phone (Settings →
Privacy & Security), select it as the run destination and press ▶. With a free
Apple ID, also trust the developer certificate on the phone under Settings →
General → VPN & Device Management.

**3b. TestFlight**

1. Create the app in [App Store Connect](https://appstoreconnect.apple.com) with
   bundle id `com.no.harm`.
2. In Xcode, set the destination to *Any iOS Device (arm64)*, then
   **Product → Archive**.
3. In the Organizer that opens: **Distribute App → TestFlight & App Store →
   Upload**.
4. Once processing finishes (minutes to an hour), add testers in App Store
   Connect → TestFlight. Internal testers (your team) get it right away;
   external ones go through a short Beta App Review first.

**4. Push notifications (FCM)**

The app still runs without this — the daily check-in reminder is a *local*
notification — but no server push reaches it. Three pieces:

- **Capabilities** in Xcode: *+ Capability* → **Push Notifications**, and
  **Background Modes** → tick *Remote notifications*.
- **APNs key**: Apple Developer → Certificates, IDs & Profiles → Keys → new key
  with *Apple Push Notifications service*. Download the `.p8` (only once), and
  upload it in the Firebase console → Project settings → Cloud Messaging →
  Apple app configuration, with its Key ID and your Team ID.
- **Firebase in the native app**: register an iOS app with bundle id
  `com.no.harm` in the Firebase console and drag `GoogleService-Info.plist`
  into `ios/App/App/` in Xcode (tick *Copy items if needed* and the *App*
  target).

Then the token. On iOS, `@capacitor/push-notifications` reports the raw **APNs**
token, and the backend sends through **FCM**, which does not accept one. The
app has to ask Firebase Messaging for an FCM token and hand *that* to the
plugin. In `ios/App/Podfile`, inside `target 'App'`:

```ruby
pod 'FirebaseMessaging'
```

and in `ios/App/App/AppDelegate.swift`:

```swift
import UIKit
import Capacitor
import FirebaseCore
import FirebaseMessaging

// in application(_:didFinishLaunchingWithOptions:), before `return true`:
FirebaseApp.configure()

// new methods in AppDelegate:
func application(_ application: UIApplication,
                 didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    Messaging.messaging().apnsToken = deviceToken
    Messaging.messaging().token { token, error in
        if let error = error {
            NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
        } else if let token = token {
            NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: token)
        }
    }
}

func application(_ application: UIApplication,
                 didFailToRegisterForRemoteNotificationsWithError error: Error) {
    NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
}
```

`npx cap sync ios` again afterwards (it runs `pod install`). Like everything
under `ios/`, these edits are lost when the project is regenerated — keep this
section as the script.

Push does not arrive on the Simulator from FCM; test on a device.

**Building from Linux (cloud macOS)**

A CI job on a macOS runner does steps 1–3b without a Mac: `npm ci` →
`npm run build:mobile` → `npx cap add ios` (the folder is not in git) → apply
the push edits → `xcodebuild archive` + `-exportArchive` → upload with
`xcrun altool` or fastlane `pilot`. Signing in CI needs an App Store Connect
API key (`.p8`, Key ID, Issuer ID) stored as repository secrets, with
`-allowProvisioningUpdates` letting Xcode fetch the certificate and profile.
Codemagic and Ionic Appflow package the same steps behind a UI.

**What commonly breaks**

- **`pod install` fails with a deployment target error** — the old `ios/`
  folder (iOS 14). Regenerate it (step 0).
- **`No such module 'Capacitor'`** — the `.xcodeproj` was opened instead of the
  `.xcworkspace`, or `cap sync ios` never ran `pod install`.
- **`Signing for "App" requires a development team`** — step 2.
- **The app shows an old bundle** — `npm run build:mobile` without
  `npx cap sync ios`.
- **Push registers but nothing arrives** — the backend received an APNs token
  (step 4's AppDelegate change missing), or the APNs key is not uploaded to
  Firebase.
- **REST calls fail while the socket works** — `ALLOWED_ORIGINS` is missing
  `capacitor://localhost`, the iOS origin.

### Releases (versions, notes and the APK)

A release is a deploy with a version. `noHarmBack/docker/deploy-host.sh` asks
for both before building:

```
release tag [v1.2.4] (last: v1.2.3):        ← Enter accepts the suggestion
(your git editor opens for the release notes — # lines are ignored)
```

Then it deploys as always, and **only if the server comes up healthy** it
tags both repos with an annotated `vX.Y.Z` carrying the notes and pushes the
tags. The tag on this repo starts `.github/workflows/release.yml`, which builds
the signed APK (`scripts/build-android-release.sh`) and publishes a GitHub
Release named after the tag, with the notes and `noharm-vX.Y.Z.apk`.

- Both repos must be committed and pushed, or the script stops before
  building — the tag has to name the code that was deployed. A hotfix that
  should not be a release: `deploy-host.sh --no-release`.
- `versionName` is the tag; `versionCode` is derived from it
  (`v1.2.3` → `10203`), so Android accepts each release as an upgrade.
- Settings shows the version (`VITE_APP_VERSION`); a build outside a release
  reads `dev`, or the commit when deployed with `--no-release`.
- A failed build: Actions → release → *Run workflow* with the tag rebuilds it
  and replaces the APK on the existing Release.

**Icon and splash:** the APK's launcher icon (adaptive and legacy) and splash
screens are generated from `assets/` during the build. Regenerate those PNGs
with `node scripts/build-app-icons.mjs` only when the logo or the brand colours
change, and commit them.

**Google sign-in in the app** uses the native account picker, which only works
once the release key is registered with Firebase — do this once, after
`setup-release-secrets.sh` has created the keystore:

```bash
keytool -list -v -keystore ~/noharm-release.jks -alias noharm | grep -E "SHA1|SHA256"
```

Add both fingerprints in the Firebase console → Project settings → *Your apps* →
the Android app `com.no.harm` → *Add fingerprint*. Then download the new
`google-services.json` over `android/app/google-services.json` and refresh the
secret: `gh secret set GOOGLE_SERVICES_JSON < android/app/google-services.json`.
Without the fingerprint the picker fails with a configuration error.

**One-time setup:** `./scripts/setup-release-secrets.sh`. It creates the
release keystore (`~/noharm-release.jks`) if there is none and stores six
repository secrets from it, `.env.mobile.local` and
`android/app/google-services.json`. **Back the keystore up** — every future
release has to be signed with it, and Android refuses an update signed by any
other key.

To build the same APK by hand, without a release:

```bash
VERSION=v1.2.3 ANDROID_KEYSTORE=~/noharm-release.jks \
ANDROID_KEYSTORE_PASSWORD=... ANDROID_KEY_ALIAS=noharm ANDROID_KEY_PASSWORD=... \
  ./scripts/build-android-release.sh
```

iOS is not part of this: an `.ipa` attached to a GitHub Release cannot be
installed on an iPhone. See *Building for iOS* for TestFlight.

## Other files

- This project was originally bootstrapped from an Expo template. Those leftovers (`AGENTS.md`, `scripts/reset-project.js`, the standalone CDN demo HTML) have been removed — the project is Vite + React + Capacitor, not Expo.

## License

MIT — see `LICENSE`.
