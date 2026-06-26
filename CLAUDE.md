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

No test runner, no lint script. Open `http://localhost:5173` after `npm run dev`.

Env vars: `VITE_API_URL` (REST base URL) and `VITE_SOCKET_URL` (Socket.IO URL, falls back to `VITE_API_URL`).

## Architecture

**Main app**: Vite + React 19 SPA. Entry: `index.html` → `src/main.jsx` → `src/app.jsx`.

**Mobile**: Capacitor wraps the web build for iOS/Android. `@capacitor/push-notifications` for FCM/APNs, `@capacitor/local-notifications` for scheduled reminders.

**Standalone demo**: `NoHarm.html` / `NoHarm-standalone.html` — CDN-loaded React + Babel, no bundler. Not the active development target.

### Layer diagram

```
screens/          ← React UI, one folder per domain
  └─ import from ─→ ui/          ← shared primitives (Icon, Btn, Card, …)
                  → store/       ← React hooks: data fetch + cache + WS subscriptions
                  → services/    ← domain logic (no React)
                      api/       ← REST calls
                      ws/        ← Socket.IO event handlers
                  → data/        ← split mock data files (badges, chats, friends, streak, user)

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
| `src/data/` | Split mock files: `user`, `badges`, `chats`, `friends`, `streak` |
| `src/ui/index.js` | Re-exports all UI primitives (`Icon`, `Avatar`, `Btn`, `Card`, `Field`, `Banner`, `Toast`, `BottomSheet`, `StreakRing`, `BadgeMedallion`, `Header`, `TabBar`, `Skeleton`, `GeoBackground`, `Screen`, `cx`) |
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

See `uploads/FRONTEND_DESIGN_BRIEF.md` for full API shapes. Key invariants:

- **Streak**: one active at a time; expires without 24 h check-in; relapse resets to 0 and immediately starts a new streak.
- **Friendship status codes**: 2=deleted, 3=blocked, 4=pending, 5=accepted, 6=rejected.
- **Chat**: friends-only, 1-on-1. Lifecycle: pending → enabled → disabled.
- **Messages**: text only, max 2000 chars. Status 7=unread, 8=read.
- **Auth**: Firebase identity + app JWT. Access token 15 min, refresh 7 days. `connectors/api.js` handles the silent refresh automatically on 401.
- **WebSocket** (Socket.IO): JWT-authenticated at connect. Events: `chat` (join/leave/send/mark_read/typing), `presence` (get_online_status/online_status), friend notifications (friend_request/accept/reject/remove/block/unblock).
