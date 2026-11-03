#!/usr/bin/env bash
# Build here, ship the image, restart there.
#
# Run from anywhere in the repository; the script moves to its root, which is
# the context the Dockerfile needs, because stage 1 compiles the front-end:
#
#   ./backend/docker/deploy-host.sh              # deploy + release
#   ./backend/docker/deploy-host.sh --no-release # deploy only (hotfix)
#
# A release is a version number and its notes. The script asks for both
# before building, deploys, and only once the server is healthy tags the
# repository `vX.Y.Z` (an annotated tag carrying the notes) and pushes the tag.
# The tag push is what starts the `release` workflow, which builds the signed
# Android APK and publishes the GitHub Release with it, and `release tests`,
# which runs both test suites against it — see .github/workflows/. A deploy
# that fails tags nothing.
#
# Why the build does not happen on the server: the instance is a t3.micro with
# 913 MB of RAM, and `vite build` needs more than that. Node gets OOM-killed
# partway through and the error names a heap limit, not the machine.
#
# The image travels over SSH rather than through a registry — no ECR, no
# credentials on the box, nothing to pay for. It is ~600 MB compressed on the
# wire, so this is minutes, not seconds.
#
# NOTE: .github/workflows/deploy.yml does NOT drive this deployment. It targets
# the ECS stack in backend/infra/, which is provisioned by nothing right now.
# This script is the deploy.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# The Elastic IP, not the ec2-*.compute-1.amazonaws.com name: that hostname
# encodes the address it was issued for, so it dies the moment the instance
# gets a different one. An Elastic IP is the thing that does not move.
HOST="${NOHARM_HOST:-ec2-user@34.225.81.236}"
# Beside the repository, never inside it: the key must not be one `git add`
# away from being committed. A relative NOHARM_SSH_KEY is read from where the
# script was started, as it always was.
KEY="${NOHARM_SSH_KEY:-$ROOT/../noharm-ssh.pem}"
[[ "$KEY" == /* ]] || KEY="$PWD/$KEY"
# The server's own layout, which predates the single repository: the stack
# there still lives in a directory named after the old backend repo. Nothing
# on the host is a git checkout, so the name is only a path.
REMOTE_DIR="~/noHarmBack/docker"

cd "$ROOT"
[[ -f package.json && -f backend/docker/Dockerfile ]] || {
    echo "$ROOT does not look like the noHarm repository (package.json, backend/docker/Dockerfile)" >&2
    exit 1
}
[[ -r "$KEY" ]] || { echo "ssh key not readable at $KEY" >&2; exit 1; }

ssh_() { ssh -i "$KEY" -o BatchMode=yes -o ConnectTimeout=20 "$HOST" "$@"; }

# ── Release: version and notes, asked for before anything is built ─────────
RELEASE=1
[[ "${1:-}" == "--no-release" ]] && RELEASE=0
VERSION=""
NOTES_FILE=""
BRANCH=master

# No `| head` anywhere below: under `set -o pipefail` a reader that stops early
# kills the writer with SIGPIPE (exit 141) and the whole script exits without a
# word. Each command limits its own output instead.
#
# `v*` only: the backend's tags from before the merge are `backend-vX.Y.Z`,
# and they must never be read as the last release.
latestTag() {
    git for-each-ref --count=1 --sort=-v:refname --format='%(refname:short)' \
        'refs/tags/v[0-9]*.[0-9]*.[0-9]*'
}

# What the tag's `release` workflow reads from the repository secrets.
APK_SECRETS=(ANDROID_KEYSTORE_BASE64 ANDROID_KEYSTORE_PASSWORD ANDROID_KEY_ALIAS
             ANDROID_KEY_PASSWORD GOOGLE_SERVICES_JSON ENV_MOBILE_LOCAL)

if (( RELEASE )); then
    # A tag has to name a commit the workflow can check out, and the code it
    # names has to be the code that was deployed: no uncommitted work, and
    # exactly the tip of the release branch on origin. "Pushed somewhere" is
    # not enough — a merged feature branch, or a master that is behind, is
    # pushed too, and a release cut from either ships without everything
    # merged since.
    if [[ -n "$(git status --porcelain)" ]]; then
        echo "uncommitted changes — commit them, or deploy with --no-release" >&2
        exit 1
    fi
    current="$(git rev-parse --abbrev-ref HEAD)"
    if [[ "$current" != "$BRANCH" ]]; then
        echo "on $current, not $BRANCH — check out $BRANCH, or deploy with --no-release" >&2
        exit 1
    fi
    git fetch --quiet --tags origin
    if [[ "$(git rev-parse HEAD)" != "$(git rev-parse "origin/$BRANCH")" ]]; then
        echo "$BRANCH differs from origin/$BRANCH — pull or push first, or deploy with --no-release" >&2
        exit 1
    fi

    # A missing secret fails the APK build only after the deploy and the tag —
    # the most expensive moment to find out. Checked when gh can list them.
    if command -v gh >/dev/null \
        && secrets="$(gh secret list --json name -q '.[].name' 2>/dev/null)"; then
        for s in "${APK_SECRETS[@]}"; do
            if ! grep -qx "$s" <<<"$secrets"; then
                echo "no repository secret $s — run scripts/setup-release-secrets.sh, or deploy with --no-release" >&2
                exit 1
            fi
        done
    else
        echo "warning: could not list the repository secrets (gh missing or signed out) — the APK build may fail after the deploy" >&2
    fi

    last="$(latestTag)"
    if [[ -n "$last" ]]; then
        IFS=. read -r major minor patch <<<"${last#v}"
        suggestion="v$major.$minor.$((patch + 1))"
    else
        suggestion="v1.0.0"
    fi

    while :; do
        read -rp "release tag [${suggestion}] (last: ${last:-none}): " VERSION
        VERSION="${VERSION:-$suggestion}"
        [[ "$VERSION" == v* ]] || VERSION="v$VERSION"
        if [[ ! "$VERSION" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            echo "  use vMAJOR.MINOR.PATCH, e.g. v1.2.3"; continue
        fi
        if git rev-parse -q --verify "refs/tags/$VERSION" >/dev/null; then
            echo "  $VERSION already exists"; continue
        fi
        if [[ -n "$last" && "$(printf '%s\n%s\n' "$last" "$VERSION" | sort -V | tail -1)" != "$VERSION" ]]; then
            echo "  $VERSION is not newer than $last"; continue
        fi
        break
    done

    # Where the backend's side of the list starts. Up to v1.0.2 the backend was
    # its own repository, and its commit for that release is backend-<tag>;
    # measured from the app's tag instead, the list would be the backend's
    # whole history, which only joined this one later.
    backendBase="$last"
    if [[ -n "$last" ]] && git rev-parse -q --verify "refs/tags/backend-$last" >/dev/null; then
        backendBase="backend-$last"
    fi

    # Notes in the editor git already uses, like a commit message: lines
    # starting with # are dropped, and an empty result aborts.
    NOTES_FILE="$(mktemp)"
    trap 'rm -f "$NOTES_FILE"' EXIT
    {
        echo
        echo "# Release notes for $VERSION — what changed, for the people using the app."
        echo "# Lines starting with # are ignored. Leave it empty to abort."
        echo "#"
        echo "# app since ${last:-the beginning} (30 most recent):"
        git log -n 30 --format='#   %s' ${last:+"$last"..HEAD} -- . ':(exclude)backend'
        echo "# backend since ${backendBase:-the beginning} (30 most recent):"
        git log -n 30 --format='#   %s' ${backendBase:+"$backendBase"..HEAD} -- backend
    } >"$NOTES_FILE"
    editor="$(git var GIT_EDITOR)"
    eval "$editor \"\$NOTES_FILE\""
    sed -i '/^#/d' "$NOTES_FILE"
    if [[ -z "$(tr -d '[:space:]' <"$NOTES_FILE")" ]]; then
        echo "empty release notes — aborted, nothing was deployed" >&2
        exit 1
    fi
    echo "==> releasing $VERSION after the deploy"
fi

# Every VITE_* is inlined at build time, so they have to arrive as build args.
# A missing one does not fail the build — it compiles to `undefined` and
# surfaces later as a login that never completes.
buildArgs=(--build-arg VITE_API_URL=/api --build-arg VITE_SOCKET_URL=)
# Shown in Settings. A deploy without a release is still told apart from one.
# --match: without it the nearest tag can be a backend-vX.Y.Z from before the
# merge, and Settings would show that.
buildArgs+=(--build-arg "VITE_APP_VERSION=${VERSION:-$(git describe --tags --match 'v[0-9]*' --always --dirty)}")
while IFS='=' read -r name value; do
    case "$name" in
        VITE_FIREBASE_*|VITE_STATUS_CONSTANTS) ;;
        VITE_DELETION_GRACE_DAYS|VITE_MINIMUM_AGE|VITE_SUPPORT_EMAIL) ;;
        *) continue ;;
    esac
    buildArgs+=(--build-arg "$name=$value")
done < <(grep -E '^VITE_' .env.local)

echo "==> building"
docker build -q -f backend/docker/Dockerfile -t noharm:latest "${buildArgs[@]}" . >/dev/null

echo "==> shipping $(docker images noharm:latest --format '{{.Size}}')"
docker save noharm:latest | gzip -1 | ssh_ 'gunzip | sudo docker load' | tail -1

echo "==> restarting"
# `up -d` alone would not replace a container whose image tag is unchanged.
ssh_ "cd $REMOTE_DIR && sudo docker compose --env-file prod.env -f compose.host.yaml up -d --force-recreate app"

echo "==> waiting for health"
for _ in $(seq 1 40); do
    if ssh_ 'curl -fs http://127.0.0.1/health' 2>/dev/null; then
        echo
        echo "deployed"
        if (( RELEASE )); then
            # One tag for the whole tree: the version names the app and the
            # server that were deployed together, now a single commit.
            git tag -a "$VERSION" -F "$NOTES_FILE"
            git push --quiet origin "refs/tags/$VERSION"
            echo "==> tagged $VERSION"
            echo "    the APK and the Release: https://github.com/LeoGotardo/noHarm/actions/workflows/release.yml"
        fi
        exit 0
    fi
    sleep 3
done

echo "the app did not become healthy; last 40 log lines:" >&2
ssh_ "cd $REMOTE_DIR && sudo docker compose --env-file prod.env -f compose.host.yaml logs --tail 40 app" >&2
exit 1
