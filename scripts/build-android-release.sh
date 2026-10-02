#!/usr/bin/env bash
# Build a signed release APK for one version.
#
#   VERSION=v1.2.3 \
#   ANDROID_KEYSTORE=path/to/release.jks ANDROID_KEYSTORE_PASSWORD=... \
#   ANDROID_KEY_ALIAS=noharm ANDROID_KEY_PASSWORD=... \
#     ./scripts/build-android-release.sh
#
# Prints the APK's path on the last line. Used by .github/workflows/release.yml
# on every release tag, and runnable by hand with the same variables.
#
# Needs, besides the variables above:
#   - .env.mobile.local with the real API and Firebase values (the committed
#     .env.mobile holds placeholders, and a bundle built from them installs
#     fine and connects to nothing — so that is refused here);
#   - android/app/google-services.json, or GOOGLE_SERVICES_JSON pointing at
#     one (without it push notifications silently do not work);
#   - a JDK 21 and the Android SDK (ANDROID_HOME, or ~/Android/Sdk).
#
# `android/` is generated and gitignored: when it is missing it is created with
# `npx cap add android`, otherwise the existing one is synced and reused.
set -euo pipefail
cd "$(dirname "$0")/.."

fail() { echo "build-android-release: $*" >&2; exit 1; }

[[ "${VERSION:-}" =~ ^v([0-9]+)\.([0-9]+)\.([0-9]+)$ ]] || fail "VERSION must look like v1.2.3 (got '${VERSION:-}')"
major="${BASH_REMATCH[1]}"; minor="${BASH_REMATCH[2]}"; patch="${BASH_REMATCH[3]}"
(( minor < 100 && patch < 100 )) || fail "minor and patch must stay below 100 (they are packed into versionCode)"
# Android refuses an update whose versionCode is not higher, so it is derived
# from the version itself: v1.2.3 → 10203. Monotonic as long as versions are.
versionCode=$(( major * 10000 + minor * 100 + patch ))

for v in ANDROID_KEYSTORE ANDROID_KEYSTORE_PASSWORD ANDROID_KEY_ALIAS ANDROID_KEY_PASSWORD; do
    [[ -n "${!v:-}" ]] || fail "$v is not set"
done
[[ -r "$ANDROID_KEYSTORE" ]] || fail "keystore not readable at $ANDROID_KEYSTORE"

[[ -r .env.mobile.local ]] || fail ".env.mobile.local is missing — the APK would point at the placeholders in .env.mobile"
if grep -q "CHANGE-ME" <(grep -E '^VITE_(API|SOCKET)_URL=' .env.mobile.local); then
    fail ".env.mobile.local still has CHANGE-ME URLs"
fi

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
[[ -d "$ANDROID_HOME/build-tools" ]] || fail "Android SDK not found at $ANDROID_HOME"
buildTools="$(ls -d "$ANDROID_HOME"/build-tools/* | sort -V | tail -1)"

echo "==> web bundle ($VERSION)" >&2
VITE_APP_VERSION="$VERSION" npm run build:mobile >&2

if [[ -d android ]]; then
    npx cap sync android >&2
else
    npx cap add android >&2
fi

if [[ -n "${GOOGLE_SERVICES_JSON:-}" ]]; then
    cp "$GOOGLE_SERVICES_JSON" android/app/google-services.json
fi
[[ -r android/app/google-services.json ]] || fail "android/app/google-services.json is missing — push would not work"

# The generated build.gradle always says versionCode 1 / "1.0".
sed -i -E \
    -e "s/versionCode [0-9]+/versionCode $versionCode/" \
    -e "s/versionName \"[^\"]*\"/versionName \"${VERSION#v}\"/" \
    android/app/build.gradle

echo "==> gradle assembleRelease (versionCode $versionCode)" >&2
(cd android && ./gradlew --quiet assembleRelease >&2)

unsigned="android/app/build/outputs/apk/release/app-release-unsigned.apk"
[[ -r "$unsigned" ]] || fail "gradle did not produce $unsigned"
out="noharm-$VERSION.apk"

"$buildTools/zipalign" -p -f 4 "$unsigned" "$out.aligned"
"$buildTools/apksigner" sign \
    --ks "$ANDROID_KEYSTORE" \
    --ks-pass env:ANDROID_KEYSTORE_PASSWORD \
    --ks-key-alias "$ANDROID_KEY_ALIAS" \
    --key-pass env:ANDROID_KEY_PASSWORD \
    --out "$out" "$out.aligned"
rm -f "$out.aligned" "$out.idsig"
"$buildTools/apksigner" verify "$out" >&2

echo "$out"
