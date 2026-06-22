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

**Standalone demo**: `NoHarm.html` / `NoHarm-standalone.html` — CDN-loaded React + Babel, no bundler. Not the active development target.

### Layer diagram

```
screens/          ← React UI, one folder per domain
  └─ import from ─→ ui/          ← shared primitives (Icon, Btn, Card, …)
                  → services/    ← domain logic
                      api/       ← REST calls
                      ws/        ← Socket.IO event handlers
                  → data/mock.js ← mock data (dev only)

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
| `src/data/mock.js` | Mock exports: `ME`, `BADGES`, `FRIENDS`, `CHATS`, `PEOPLE`, `STREAK_HISTORY`, etc. |
| `src/ui/index.js` | Re-exports all UI primitives (`Icon`, `Avatar`, `Btn`, `Card`, `Field`, `Banner`, `Toast`, `BottomSheet`, `StreakRing`, `BadgeMedallion`, `Header`, `TabBar`, `Skeleton`, `GeoBackground`, `Screen`, `cx`) |
| `src/connectors/` | Transport layer (see diagram above) |
| `src/services/api/` | `auth`, `badge`, `chat`, `friendship`, `message`, `streak`, `user` |
| `src/services/ws/` | `chat`, `friendship`, `presence` |
| `src/screens/auth/` | `SplashScreen`, `RegisterScreen`, `LoginScreen` |
| `src/screens/home/` | `Dashboard`, `StreakHistory` |
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

## Domain rules

See `uploads/FRONTEND_DESIGN_BRIEF.md` for full API shapes. Key invariants:

- **Streak**: one active at a time; expires without 24 h check-in; relapse resets to 0 and immediately starts a new streak.
- **Friendship status codes**: 2=deleted, 3=blocked, 4=pending, 5=accepted, 6=rejected.
- **Chat**: friends-only, 1-on-1. Lifecycle: pending → enabled → disabled.
- **Messages**: text only, max 2000 chars. Status 7=unread, 8=read.
- **Auth**: Firebase identity + app JWT. Access token 15 min, refresh 7 days. `connectors/api.js` handles the silent refresh automatically on 401.
- **WebSocket** (Socket.IO): JWT-authenticated at connect. Events: `chat` (join/leave/send/mark_read/typing), `presence` (get_online_status/online_status), friend notifications (friend_request/accept/reject/remove/block/unblock).
