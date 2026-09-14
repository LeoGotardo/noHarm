# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

NoHarm — addiction recovery tracker. Core loop: register → start streak → daily check-in → earn milestone badges → connect with friends for accountability → 1-on-1 chat. Tone must be warm and compassionate, never clinical.

This repo is the **front end only**. The API it talks to is
[`../noHarmBack`](../noHarmBack/) — FastAPI + PostgreSQL + Socket.IO, a sibling
repository that must sit next to this one on disk (the production image builds
both). Its `docs/README.md` is the architecture and auth reference, its
`CLAUDE.md` the domain rules (RLS, moderation, account lifecycle, rate limits),
and `docs/FRONTEND_DESIGN_BRIEF.md` the API shapes this app consumes.

## Commands

```bash
npm run dev        # Vite dev server (hot reload)
npm run build      # production build → dist/
npm run preview    # serve dist/ locally
npm run test:e2e   # Playwright suite (113 tests) — needs the backend on :8080

npm run build:mobile          # vite build --mode mobile (absolute API URLs from .env.mobile)
npx cap sync android          # copy dist/ into the native project
cd android && ./gradlew assembleDebug   # → android/app/build/outputs/apk/debug/app-debug.apk
```

No lint script. Open `http://localhost:5173` after `npm run dev`.

The full APK walkthrough — prerequisites, signing a release build, and the
failure modes — is in [`README.md`](README.md), "Building the Android APK".
Two things to know before touching it: `android/` and `ios/` are **gitignored
and generated** (`npx cap add android`), so nothing you edit in there is
versioned or survives a regeneration; and `applicationId` must stay
`com.no.harm`, matching a `package_name` in the (also gitignored)
`android/app/google-services.json`, or `:app:processDebugGoogleServices` fails
the build.

The e2e suite **cleans the database before and after every run** — every account
it makes and everything hanging off them (`tests/helpers/cleanup.js`, wired as
`globalSetup`/`globalTeardown`). It has to be SQL: `DELETE /users/me` is a soft
delete and the only hard delete in the backend refuses anything inside its
30-day grace window, so before this the suite left thousands of accounts behind.

`tests/` is a Playwright suite that automates most of `TESTING.md`; see
[`tests/README.md`](tests/README.md) for how it fakes the Google popup and what
it assumes about the backend. `TESTING.md` remains the manual QA checklist,
organised by domain in use-flow order — update it when adding/changing
user-facing flows, and mark 🤖 what the suite covers.

Playwright reuses a dev server already listening on the configured port
(`reuseExistingServer`), so if **another project** holds `:5173` the suite
silently tests that app instead. Point it elsewhere when that happens:
`E2E_WEB_URL=http://localhost:5180 npm run test:e2e`, with `npm run dev -- --port 5180`.

Env vars: `VITE_API_URL` (REST base URL) and `VITE_SOCKET_URL` (Socket.IO URL, falls back to `VITE_API_URL`). Both are **relative and empty** for the web build — see Deployment below. Every `VITE_*` is inlined by Vite at build time, so changing one needs a rebuild, not a restart.

`npm run dev`'s proxy in `vite.config.js` mirrors the nginx routes (`/api` stripped, `/ws` passed through), which is what lets the app use the same relative URLs in dev and in production.

## Architecture

**Main app**: Vite + React 19 SPA. Entry: `index.html` → `src/main.jsx` → `src/app.jsx`.

**Mobile**: Capacitor wraps the web build for iOS/Android. `@capacitor/push-notifications` for FCM/APNs, `@capacitor/local-notifications` for scheduled reminders.

**Import aliases** (`vite.config.js`): `@components` → `src/components`, `@ui` → `src/ui`. Note `tsconfig.json` also declares `@/*` → `src/*`, but vite does **not** resolve it — `@/…` imports build-break. Use only `@components`/`@ui` or relative paths.

**Expo leftovers**: the project was bootstrapped from an Expo template but is **not** Expo — it's Vite + React + Capacitor. `AGENTS.md` and `scripts/reset-project.js` have been removed; `README.md` was rewritten. What still lingers: `assets/` (Expo icon/splash art, unreferenced), `.vscode/extensions.json` (recommends `expo.vscode-expo-tools`) and `.claude/settings.json` (enables the Expo plugin).

### Layer diagram

```
screens/          ← React UI, one folder per domain
  └─ import from ─→ ui/          ← low-level primitives (Icon, Avatar, Btn, Card, Field, …) + cx
                  → components/  ← composite widgets (Screen, Header, TabBar, BottomSheet, Toast, StreakRing, …) + format helpers
                  → store/       ← React hooks: data fetch + cache + WS subscriptions
                  → services/    ← domain logic (no React)
                      api/       ← REST calls
                      ws/        ← Socket.IO event handlers

store/ hooks call services/ which call connectors/
services/ import from connectors/
  connectors/api.js      ← fetch wrapper + auto JWT refresh (401 → /auth/refresh → retry)
  connectors/firebase.js ← Firebase Auth instance
  connectors/socket.js   ← Socket.IO singleton (connect/disconnect/getSocket + typed emitters)
  connectors/tokens.js   ← localStorage access/refresh token store (keys: nh_access, nh_refresh)
```

### src/ layout

| Path | Role |
|------|------|
| `src/app.jsx` | Root component: nav state machine, theme wiring, screen routing, global state |
| `src/main.jsx` | Mounts `<App>`, imports `theme.css` |
| `src/theme.css` | CSS custom properties for all four theme variants. Token blocks are attribute-only selectors so `<html>` resolves them too — see Theming |
| `src/ui/index.js` | Low-level primitives: `Icon`, `Avatar`/`OnlineDot`, `Btn`, `Card`, `Field`, `Skeleton`, `GeoBackground`, `Divider`, `SectionLabel`, plus `cx` helper and the tap guards from `guards.js` (`useGuardedCallback`, `useDebouncedValue`) |
| `src/components/index.js` | Composite widgets: `Screen`, `Header`, `Banner`, `Toast`, `BottomSheet`, `TabBar`, `StreakRing`/`BadgeMedallion`, `EmptyState`, `Logo`, `GoogleButton`, `PersonRow`, `SegTabs`, plus format helpers from `utils.js` (`hashHue`, `fmtTime`, `fmtLongDate`, `fmtRelDate`, `fmtShortDay`) |
| `src/connectors/` | Transport layer (see diagram above) |
| `src/services/api/` | `auth`, `badge`, `chat`, `friendship`, `message`, `moderation`, `notice`, `report`, `streak`, `user`, `device` |
| `src/services/ws/` | `chat`, `connection`, `friendship`, `presence` |
| `src/services/notifications.js` | Browser Notification API wrapper (`notif.send/requestPermission/granted`) |
| `src/services/push.js` | Capacitor FCM wrapper (`push.register/onForeground/onTap`) |
| `src/services/checkinReminder.js` | Capacitor LocalNotifications — schedules daily 9 PM reminder (id 1001) |
| `src/store/cache.js` | localStorage cache helpers (`cacheRead/cacheWrite/cacheClear/cacheValid`), prefix `nh_cache_` |
| `src/store/useBadges.js` | Fetches badges; 1 h cache; normalises `items` → `badges` |
| `src/store/useChats.js` | Chat list + WS subscriptions |
| `src/store/useFriends.js` | Friend list + WS subscriptions |
| `src/store/useStreak.js` | Active streak data |
| `src/store/useUser.js` | Current user profile |
| `src/store/useModeration.js` | `useModerator(enabled)` — probes `GET /reports` once per session to find out whether this account can moderate |
| `src/store/useNotices.js` | Moderation notices waiting for this user; `acknowledge` marks one read |
| `src/store/useNotifPrefs.js` | Persists notification prefs to `nh_notif_prefs` in localStorage; keys: `master`, `messages`, `friendRequests`, `friendAccepted`, `checkinReminder` |
| `src/store/useNotifications.js` | Wires WS events → browser/local notifs; registers FCM token on native |
| `src/store/useCheckinReminder.js` | Schedules/cancels `checkinReminder` based on combined master+pref flag |
| `src/screens/auth/` | `SplashScreen`, `RegisterScreen`, `LoginScreen` |
| `src/screens/home/` | `Dashboard`, `StreakHistory`, `CheckInModal` |
| `src/screens/friends/` | `FriendsScreen`, `FriendRequests`, `FriendSearch`, `PublicProfile`, `ReportSheet` |
| `src/screens/chat/` | `ChatList`, `ChatThread` |
| `src/screens/badges/` | `BadgesScreen`, `BadgeDetail` |
| `src/screens/profile/` | `MyProfile`, `EditProfile`, `Settings` |
| `src/screens/moderation/` | `ModerationQueue`, `ReportReview`, `SuspendSheet`, `WarnSheet` — admin only; the Settings row that opens them is absent for everyone else |
| `src/dev/TweaksPanel.jsx` | Dev overlay: `useTweaks`, `TweaksPanel`, `TweakSection`, `TweakRadio`, `TweakToggle` |

## Tap guards

Nothing in this app is idempotent — two taps on Add friend are two POSTs, two
on Send are two messages, two on a row push the same screen twice — and taps
land faster than React re-renders, so a `sending` state flag set inside the
handler does not stop the second one: both taps read the same state in the same
tick.

`useGuardedCallback(fn, gap)` in `src/ui/guards.js` is the fix, and it is
already wired into the primitives every screen goes through: `Btn`, `Card`
(when tappable), `GoogleButton`, `PersonRow`, `Header`'s back arrow, `LinkRow`,
`SheetAction`, `ToggleRow`. A handler passed to any of those needs nothing
extra. Raw `<button>`s inside a screen do — `ChatThread`'s send, the request
rows, the search result's Add, `StreakHistory`'s pagination, `EditProfile`'s
Save each wrap their own.

It runs `fn` once and ignores further calls until it is safe: `gap` ms for a
sync handler (default `GUARD_MS`, 400), and for an async one the whole time the
request is in flight plus `gap`. It holds refs only, so wrapping an inline
arrow costs no re-render. Two places want a different gap: `ToggleRow` passes
`0`, because flipping a switch back is a real thing to do and only same-tick
taps should collapse — `tests/profile.spec.js` toggles dark mode twice in a row
and a 400 ms gap swallows the second one.

For work a **keystroke** triggers, `useDebouncedValue(value, delay)` is the
other half: the field stays instantly controlled and the expensive part trails
it. `FriendSearch` filters and widens the directory on the settled term, so a
typed word is one search, not one per letter.

`tests/chat.spec.js` fires two clicks in a single tick and asserts one
`POST /messages`.

## Deployment

The app is served by nginx from inside a single container that also runs the
FastAPI backend — config in `noHarmBack/docker/`. nginx serves the bundle,
proxies `/api/*` to the backend with the prefix stripped, and passes `/ws/*`
through for the Socket.IO upgrade. The bundle is therefore **same-origin with
the API**, which is why `VITE_API_URL` is `/api` and `VITE_SOCKET_URL` is empty.

**Live at `https://noharm.site`**: a single EC2 t3.micro running
`noHarmBack/docker/compose.host.yaml`, where nginx itself holds a Let's Encrypt
certificate (`TLS_MODE=container`). The runbook is
`noHarmBack/docs/operations.md`. The ECS/ALB stack in `noHarmBack/infra/` is
written but **not provisioned**; `TLS_MODE=alb` is its shape, where TLS ends at
the load balancer and the container serves plain `:80`. Neither changes anything
the bundle sees — the browser's leg is https either way, and the routes are the
same file in both.

Two consequences worth knowing before debugging:

- **CORS does not apply to the web build.** Same origin, no preflight. The
  Capacitor app is the only cross-origin client (`capacitor://localhost` on iOS,
  `http://localhost` on Android) and the one that needs `ALLOWED_ORIGINS` on the
  backend to include it. A restrictive value breaks mobile REST and leaves the
  socket working — an asymmetric failure that is confusing without this note.
- **CSP lives in nginx**, not in the app: `noHarmBack/docker/security_headers.conf`.
  Anything the app loads cross-origin (Google Fonts, Firebase sign-in) has to be
  listed there or it is blocked with no symptom but a console error.

The image builds the bundle itself (stage 1 of `noHarmBack/docker/Dockerfile`),
so `VITE_*` values arrive as `--build-arg`. Its build context is the **parent of
both repos** — `noHarm/` and `noHarmBack/` must sit side by side. The deploy
workflow (`noHarmBack/.github/workflows/deploy.yml`) therefore checks out this
repo alongside the backend and passes every `VITE_*` as a build arg; a value
added here has to be added there too, or it compiles to `undefined` and shows up
as a feature that quietly does nothing.

**A change here only ships on a backend deploy.** There is no separate
front-end pipeline: pushing to this repo builds nothing, and nothing deploys on
push at all today. Shipping a change to this repo means running
`./noHarmBack/docker/deploy-host.sh` from the directory holding both repos: it
builds the image on your machine — `vite build` needs more RAM than the
instance has — and ships it over SSH.

## Navigation model

Custom stack-on-tabs — no router library:

- `phase`: `'splash' | 'register' | 'login' | 'app' | 'deleted'`
- `tab`: `'home' | 'friends' | 'chat' | 'badges' | 'profile'`
- `stack`: `{ screen, props }[]` pushed over the active tab

Only three navigation primitives: `push(screen, props)` / `pop()` / `resetTo(tab)`.

**Adding a screen**: add a `case` to the `switch (top.screen)` block (overlay screens) or `switch (tab)` block (tab roots) in `src/app.jsx`, implement the component in the appropriate `src/screens/*/` folder.

Overlay screens today: `streakHistory`, `friendRequests`, `friendSearch`,
`publicProfile`, `chatThread`, `badgeDetail`, `editProfile`, `settings`,
`moderation`, `reportReview`.

## Theming

Two visual directions × two modes = four combinations:

- **sage** light/dark — Figtree (humanist sans), muted green
- **dawn** light/dark — Spectral (soft serif), warm clay

Switched at runtime via `data-dir` and `data-mode` attributes, set on **both
`<html>` and `.nh-root`**. The `TweaksPanel` bottom-right overlay and the Dark
mode row in Settings both toggle direction/mode/motion live.

CSS tokens live in `src/theme.css` under attribute-only selectors —
`[data-dir="sage"][data-mode="light"]`, not `.nh-root[…]`. That is deliberate
and load-bearing:

- **The document has to resolve `--bg` too.** Screens fade in (`nhScreenIn`
  animates `opacity: 0 → 1`), and during that fade whatever is behind them is
  visible. If the tokens are scoped to `.nh-root`, `body` cannot see them —
  custom properties inherit downward, and `.nh-root` is a *descendant* of body —
  so `body { background: var(--bg, <light fallback>) }` paints the fallback and
  every screen change in dark mode flashes white. A transparent background is
  the same bug: the browser paints its own white canvas underneath.
- Prefixing a token block with `.nh-root` again reintroduces exactly that.
  `tests/profile.spec.js` guards it by asserting `--bg` resolves on `<html>` and
  that `body`'s computed background is neither transparent nor different from
  the token.

**Persistence**: `direction`, `mode` and `motion` are stored in `localStorage`
under `nh_tweaks`. `loadTweaks()` in `src/app.jsx` validates every stored value
against an allowlist before it reaches the DOM, and an inline script at the top
of `<body>` in `index.html` applies `data-dir`/`data-mode` **before first
paint** so a reload does not flash light. That script and `loadTweaks()` read
the same key and must stay in sync. `accentName` is in `TWEAK_DEFAULTS` but
nothing consumes it, so it is not persisted.

Only in `npm run dev` does the very first frame still flash: `theme.css` is
injected by the module script there, while the production build emits a
render-blocking `<link>` in `<head>`.

## Notifications architecture

Two notification paths coexist:

- **Web** (`services/notifications.js`): Browser Notification API. Skips when tab is visible (in-app toast handles it).
- **Native** (`services/push.js` + `services/checkinReminder.js`): Capacitor. `push` → FCM for real-time events (backend sends via FCM). `checkinReminder` → LocalNotifications for the scheduled 9 PM daily prompt.

`useNotifications(meId, prefs)` in `src/store/` unifies both: listens to the same WS events, dispatches to the right platform. FCM token is registered via `services/api/device.js` → `POST /devices/token`.

Notification IDs must not collide: checkinReminder uses 1001; message notifs use 2000–2999; friend events use 3001–3002.

## Domain rules

See `noHarmBack/docs/FRONTEND_DESIGN_BRIEF.md` for full API shapes. Key invariants:

- **Streak**: one active at a time; expires without 24 h check-in; relapse resets to 0 and immediately starts a new streak.
- **Check-ins are not counted.** Duration comes from `start_at`/`end_at`, and
  `updateLastCheckin` is a plain assignment of "now" — so N check-ins do exactly
  what one does. Never loop one request per elapsed day to backfill a
  backdated streak: `POST /streaks/checkin` is capped at 10/minute, so anything
  past ten days 429s partway through, *after* the streak was already created,
  and the retry then fails with 409 `STREAK_ALREADY_ACTIVE`. Badges are granted
  server-side by `startStreak` from `start_at`, so backfilling earns nothing
  either. `src/store/useStreak.js` sends **one** conditional check-in;
  `tests/streak.spec.js` covers a 30-day backdate to keep it that way.
- **Friendship status codes**: 2=deleted, 3=blocked, 4=pending, 5=accepted, 6=rejected.
- **Reporting is private and inert.** `POST /reports/{userId}` takes one of six
  reasons (`services/api/report.js` holds the list and its copy) plus up to 1000
  optional characters. The reported user is never notified and can never read a
  report about them, so the sheet says so — that promise is what makes people
  file one. A report changes nothing else: it does not block, unfriend or notify,
  and blocking stays the separate action offered beside it in the profile sheet.
  A second report about the same person while the first is unreviewed comes back
  409, which `ReportSheet` shows inline rather than as a failure.
- **A report carries the conversation, as an id.** When the reporter and the
  reported user have a chat, `app.jsx` finds it in `chatList` and passes its id
  as the fourth argument to `reportUser`; the backend copies that chat's last 20
  messages into the evidence attached to the report. Only the id travels —
  there is no parameter for message text and the backend refuses a body field
  carrying any, because a reporter must never be able to attribute invented
  lines to someone. Nothing in the app reads that copy back: it is a
  moderator's, and `GET /reports/{id}/evidence` answers 404 to everyone else,
  the reporter included.
- **Chat**: friends-only, 1-on-1. Lifecycle: pending → enabled → disabled.
- **Messages**: text only, max 2000 chars. Status 7=unread, 8=read.
- **Auth**: Firebase identity + app JWT. Access token 15 min, refresh 7 days. `connectors/api.js` handles the silent refresh automatically on 401.
- **Moderation is a screen in the app, not a separate tool.** Settings shows a
  "Reports" row only for an account on the backend's `ADMIN_USER_IDS`
  allowlist, and `src/screens/moderation/` is what it opens: the queue (open /
  actioned / dismissed), then one report with the evidence captured when it was
  filed — the profile snapshot and the conversation, both sides, as a
  transcript. **There is no "am I an admin" endpoint on purpose**: every
  moderation route answers 404 rather than 403, so `useModerator` probes the
  queue once per session and hides the row on failure. Opening a report
  *claims* it and leaving without deciding releases it, so a second moderator
  is never reading the same conversation; reading the evidence is logged
  against the moderator. Suspending and closing are two buttons because they
  are two decisions — closing a report never touches an account.
- **Moderation talks back.** `useNotices` fetches what moderation has said to
  this account and `NoticeSheet` shows it over everything on open — **before
  the check-in modal**, because being asked "all clean today?" with an unread
  warning waiting is the wrong order. A warning changes nothing about the
  account and the copy says so; a suspension notice waits until the account
  comes back, which is the only moment it can be read at all. The sheet never
  names who reported them (the API does not carry it) and always says where to
  appeal — `VITE_SUPPORT_EMAIL`, also on a refused sign-in.
- **A suspended account is paused, not gone.** Moderation can ban for a fixed
  window: signing in then answers 403 `ACCOUNT_SUSPENDED` with
  `details.suspendedUntil`, where a permanent ban is still `ACCOUNT_BANNED`.
  `LoginScreen` reads the date and says "paused until <date>" — telling someone
  serving three days that their account is gone is a different message than the
  truth, and this app's accounts hold a streak and a friend list. The ban lifts
  itself on the first sign-in past the date, so nothing here has to poll.
- **Account deletion is reversible for 30 days.** `deleteMe()` soft-deletes; the
  backend keeps the row for `ACCOUNT_DELETION_GRACE_DAYS` and a cron purges it
  after. Signing in during the window returns 403 `ACCOUNT_PENDING_DELETION`
  with `details.deletionScheduledAt`; `signIn`/`signUp` re-throw that error with
  the Firebase `idToken` attached, and `LoginScreen` offers the restore sheet
  that calls `reactivate(idToken)`. The window is stated to the user on the
  delete confirmation and on the farewell screen — `VITE_DELETION_GRACE_DAYS`
  feeds that copy and must match the backend. Never present deletion as
  immediate: the copy said "Delete forever" while the backend kept everything,
  and that mismatch is the thing being fixed, not a detail to restore.
- **Socket.IO replays nothing it missed.** A `new_message` or `friend_*` event
  emitted while the socket was down — or before the first handshake finished,
  which is every cold start — is simply gone, and the screen keeps the state
  from before: an unread badge that never appears. `services/ws/connection.js`
  → `onSocketReady` fires on every successful handshake, and `useChats` /
  `useFriends` refetch over REST there. Connecting is the one instant the
  client knows it has a gap. Cost: one extra fetch per connect, including the
  silent token refresh every 15 minutes.
- **WebSocket** (Socket.IO): JWT-authenticated at connect. Events: `chat` (join/leave/send/mark_read/typing), `presence` (get_online_status/online_status), friend notifications (friend_request/accept/reject/remove/block/unblock).
