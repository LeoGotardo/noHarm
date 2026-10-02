#!/usr/bin/env bash
# One-time setup for .github/workflows/release.yml: the release keystore and
# the six repository secrets the workflow reads.
#
#   ./scripts/setup-release-secrets.sh [path/to/release.jks]
#
# Needs `gh` logged in with access to this repository, `keytool` (any JDK),
# and two files that never go into git:
#   - .env.mobile.local            real API and Firebase values for the APK
#   - android/app/google-services.json   (or GOOGLE_SERVICES_JSON=path)
#
# The keystore is created if the path does not exist yet. BACK IT UP, outside
# this machine: every future release must be signed with it, and Android
# refuses an update signed by any other key — users would have to uninstall
# (and lose local data) to upgrade.
set -euo pipefail
cd "$(dirname "$0")/.."

KEYSTORE="${1:-$HOME/noharm-release.jks}"
ALIAS="${ANDROID_KEY_ALIAS:-noharm}"
GSERVICES="${GOOGLE_SERVICES_JSON:-android/app/google-services.json}"

fail() { echo "setup-release-secrets: $*" >&2; exit 1; }

command -v gh >/dev/null || fail "the GitHub CLI (gh) is not installed"
gh auth status >/dev/null 2>&1 || fail "gh is not logged in — run: gh auth login"
command -v keytool >/dev/null || fail "keytool not found — install a JDK"
[[ -r .env.mobile.local ]] || fail ".env.mobile.local is missing (copy .env.mobile and fill in the real values)"
grep -q "CHANGE-ME" .env.mobile.local && fail ".env.mobile.local still has CHANGE-ME values"
[[ -r "$GSERVICES" ]] || fail "google-services.json not found at $GSERVICES"

read -rsp "keystore password: " STOREPASS; echo
[[ ${#STOREPASS} -ge 6 ]] || fail "use at least 6 characters"

if [[ -e "$KEYSTORE" ]]; then
    echo "using the existing keystore at $KEYSTORE"
    keytool -list -keystore "$KEYSTORE" -storepass "$STOREPASS" -alias "$ALIAS" >/dev/null \
        || fail "wrong password, or no key named '$ALIAS' in $KEYSTORE"
else
    echo "creating $KEYSTORE (alias '$ALIAS', valid ~27 years)"
    # PKCS12 keystores use one password for the store and the key.
    keytool -genkeypair -v -keystore "$KEYSTORE" -alias "$ALIAS" \
        -keyalg RSA -keysize 4096 -validity 10000 \
        -storepass "$STOREPASS" -keypass "$STOREPASS" \
        -dname "CN=NoHarm, O=NoHarm" >/dev/null
    chmod 600 "$KEYSTORE"
    echo
    echo "  !! Back up $KEYSTORE and its password now, somewhere off this machine."
    echo
fi

echo "==> setting repository secrets"
base64 -w0 "$KEYSTORE" | gh secret set ANDROID_KEYSTORE_BASE64
printf '%s' "$STOREPASS" | gh secret set ANDROID_KEYSTORE_PASSWORD
printf '%s' "$STOREPASS" | gh secret set ANDROID_KEY_PASSWORD
printf '%s' "$ALIAS"     | gh secret set ANDROID_KEY_ALIAS
gh secret set GOOGLE_SERVICES_JSON < "$GSERVICES"
gh secret set ENV_MOBILE_LOCAL < .env.mobile.local

echo "done — the next release tag builds and publishes the APK."
