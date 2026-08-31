# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

NoHarm — addiction recovery tracker. Core loop: register → start streak → daily check-in → earn milestone badges → connect with friends for accountability → 1-on-1 chat. Tone must be warm and compassionate, never clinical.

## Commands

```bash
npm run dev      # Vite dev server (hot reload)
npm run build    # production build → dist/
npm run preview  # serve dist/ locally
```

No test runner, no lint script. Open `http://localhost:5173` after `npm run dev`. `TESTING.md` is a manual QA checklist (Portuguese) organised by domain in use-flow order — update it when adding/changing user-facing flows.

Env vars: `VITE_API_URL` (REST base URL) and `VITE_SOCKET_URL` (Socket.IO URL, falls back to `VITE_API_URL`). Both are **relative and empty** for the web build — see Deployment below. Every `VITE_*` is inlined by Vite at build time, so changing one needs a rebuild, not a restart.

`npm run dev`'s proxy in `vite.config.js` mirrors the nginx routes (`/api` stripped, `/ws` passed through), which is what lets the app use the same relative URLs in dev and in production.

## Architecture

**Main app**: Vite + React 19 SPA. Entry: `index.html` → `src/main.jsx` → `src/app.jsx`.

**Mobile**: Capacitor wraps the web build for iOS/Android. `@capacitor/push-notifications` for FCM/APNs, `@capacitor/local-notifications` for scheduled reminders.

**Import aliases** (`vite.config.js`): `@components` → `src/components`, `@ui` → `src/ui`. Note `tsconfig.json` also declares `@/*` → `src/*`, but vite does **not** resolve it — `@/…` imports build-break. Use only `@components`/`@ui` or relative paths.

**Stale docs warning**: `README.md` is leftover Expo boilerplate. This project is **not** Expo — it's Vite + React + Capacitor. Ignore its Expo instructions. (`AGENTS.md` and `scripts/reset-project.js`, the other two, have been removed.)

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
| `src/theme.css` | CSS custom properties for all four theme variants |
| `src/ui/index.js` | Low-level primitives: `Icon`, `Avatar`/`OnlineDot`, `Btn`, `Card`, `Field`, `Skeleton`, `GeoBackground`, `Divider`, `SectionLabel`, plus `cx` helper |
| `src/components/index.js` | Composite widgets: `Screen`, `Header`, `Banner`, `Toast`, `BottomSheet`, `TabBar`, `StreakRing`/`BadgeMedallion`, `EmptyState`, `Logo`, `GoogleButton`, `PersonRow`, `SegTabs`, plus format helpers from `utils.js` (`hashHue`, `fmtTime`, `fmtLongDate`, `fmtRelDate`, `fmtShortDay`) |
| `src/connectors/` | Transport layer (see diagram above) |
| `src/services/api/` | `auth`, `badge`, `chat`, `friendship`, `message`, `streak`, `user`, `device` |
| `src/services/ws/` | `chat`, `friendship`, `presence` |
| `src/services/notifications.js` | Browser Notification API wrapper (`notif.send/requestPermission/granted`) |
| `src/services/push.js` | Capacitor FCM wrapper (`push.register/onForeground/onTap`) |
| `src/services/checkinReminder.js` | Capacitor LocalNotifications — schedules daily 9 PM reminder (id 1001) |
| `src/store/cache.js` | localStorage cache helpers (`cacheRead/cacheWrite/cacheClear/cacheValid`), prefix `nh_cache_` |
| `src/store/useBadges.js` | Fetches badges; 1 h cache; normalises `items` → `badges` |
| `src/store/useChats.js` | Chat list + WS subscriptions |
| `src/store/useFriends.js` | Friend list + WS subscriptions |
| `src/store/useStreak.js` | Active streak data |
| `src/store/useUser.js` | Current user profile |
| `src/store/useNotifPrefs.js` | Persists notification prefs to `nh_notif_prefs` in localStorage; keys: `master`, `messages`, `friendRequests`, `friendAccepted`, `checkinReminder` |
| `src/store/useNotifications.js` | Wires WS events → browser/local notifs; registers FCM token on native |
| `src/store/useCheckinReminder.js` | Schedules/cancels `checkinReminder` based on combined master+pref flag |
| `src/screens/auth/` | `SplashScreen`, `RegisterScreen`, `LoginScreen` |
| `src/screens/home/` | `Dashboard`, `StreakHistory`, `CheckInModal` |
| `src/screens/friends/` | `FriendsScreen`, `FriendRequests`, `FriendSearch`, `PublicProfile` |
| `src/screens/chat/` | `ChatList`, `ChatThread` |
| `src/screens/badges/` | `BadgesScreen`, `BadgeDetail` |
| `src/screens/profile/` | `MyProfile`, `EditProfile`, `Settings` |
| `src/dev/TweaksPanel.jsx` | Dev overlay: `useTweaks`, `TweaksPanel`, `TweakSection`, `TweakRadio`, `TweakToggle` |

## Deployment

The app is served by nginx from inside a single container that also runs the
FastAPI backend — config in `noHarmBack/docker/`, and the AWS stack that runs
it in `noHarmBack/infra/` (ECS Fargate behind an ALB). nginx serves the bundle,
proxies `/api/*` to the backend with the prefix stripped, and passes `/ws/*`
through for the Socket.IO upgrade. The bundle is therefore **same-origin with
the API**, which is why `VITE_API_URL` is `/api` and `VITE_SOCKET_URL` is empty.

Deployed, TLS ends at the load balancer and the container serves plain `:80`
(`TLS_MODE=alb`); `compose.prod.yaml` keeps the other shape, where nginx holds
the certificate. Neither changes anything the bundle sees — the browser's leg is
https either way, and the routes are the same file in both.

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
front-end pipeline: pushing to this repo builds nothing. The image is rebuilt by
the backend's workflow, which checks out this repo's `main`.

## Navigation model

Custom stack-on-tabs — no router library:

- `phase`: `'splash' | 'register' | 'login' | 'app' | 'deleted'`
- `tab`: `'home' | 'friends' | 'chat' | 'badges' | 'profile'`
- `stack`: `{ screen, props }[]` pushed over the active tab

Only three navigation primitives: `push(screen, props)` / `pop()` / `resetTo(tab)`.

**Adding a screen**: add a `case` to the `switch (top.screen)` block (overlay screens) or `switch (tab)` block (tab roots) in `src/app.jsx`, implement the component in the appropriate `src/screens/*/` folder.

## Theming

Two visual directions × two modes = four combinations:

- **sage** light/dark — Figtree (humanist sans), muted green
- **dawn** light/dark — Spectral (soft serif), warm clay

Switched at runtime via `data-dir` and `data-mode` attributes on `.nh-root`. `TWEAK_DEFAULTS` in `src/app.jsx` sets initial values. The `TweaksPanel` bottom-right overlay toggles direction/mode/motion/accent live.

CSS tokens live in `src/theme.css` under selectors like `.nh-root[data-dir="sage"][data-mode="light"]`.

## Notifications architecture

Two notification paths coexist:

- **Web** (`services/notifications.js`): Browser Notification API. Skips when tab is visible (in-app toast handles it).
- **Native** (`services/push.js` + `services/checkinReminder.js`): Capacitor. `push` → FCM for real-time events (backend sends via FCM). `checkinReminder` → LocalNotifications for the scheduled 9 PM daily prompt.

`useNotifications(meId, prefs)` in `src/store/` unifies both: listens to the same WS events, dispatches to the right platform. FCM token is registered via `services/api/device.js` → `POST /devices/token`.

Notification IDs must not collide: checkinReminder uses 1001; message notifs use 2000–2999; friend events use 3001–3002.

## Domain rules

See `noHarmBack/docs/FRONTEND_DESIGN_BRIEF.md` for full API shapes. Key invariants:

- **Streak**: one active at a time; expires without 24 h check-in; relapse resets to 0 and immediately starts a new streak.
- **Friendship status codes**: 2=deleted, 3=blocked, 4=pending, 5=accepted, 6=rejected.
- **Chat**: friends-only, 1-on-1. Lifecycle: pending → enabled → disabled.
- **Messages**: text only, max 2000 chars. Status 7=unread, 8=read.
- **Auth**: Firebase identity + app JWT. Access token 15 min, refresh 7 days. `connectors/api.js` handles the silent refresh automatically on 401.
- **WebSocket** (Socket.IO): JWT-authenticated at connect. Events: `chat` (join/leave/send/mark_read/typing), `presence` (get_online_status/online_status), friend notifications (friend_request/accept/reject/remove/block/unblock).
