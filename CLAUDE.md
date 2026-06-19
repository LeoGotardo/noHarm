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

## Architecture

**Main app**: Vite + React 19 SPA. Entry: `index.html` → `src/main.jsx` → `src/app.jsx`.

**Standalone demo**: `NoHarm.html` / `NoHarm-standalone.html` — CDN-loaded React + Babel, no bundler. Not the active development target. The CDN version still uses `window.X` globals; the Vite version uses ES module imports.

### src/ layout

| File | Role |
|------|------|
| `src/data.jsx` | Mock data exports: `ME`, `BADGES`, `FRIENDS`, `CHATS`, `PEOPLE`, `STREAK_HISTORY`, etc. |
| `src/ui.jsx` | Shared primitives: `Icon`, `Avatar`, `Btn`, `Card`, `Field`, `BottomSheet`, `Toast`, `StreakRing`, `TabBar`, `Screen`, `cx` |
| `src/geo.jsx` | Animated geometric SVG backgrounds |
| `src/app.jsx` | Root component: navigation state machine, theme wiring, screen routing, global state (days, checkedIn, friends, toasts) |
| `src/screens_auth.jsx` | `SplashScreen`, `RegisterScreen`, `LoginScreen` |
| `src/screens_home.jsx` | `Dashboard`, `StreakHistory` |
| `src/screens_friends.jsx` | `FriendsScreen`, `FriendRequests`, `FriendSearch`, `PublicProfile` |
| `src/screens_chat.jsx` | `ChatList`, `ChatThread` |
| `src/screens_badges.jsx` | `BadgesScreen`, `BadgeDetail` |
| `src/screens_profile.jsx` | `MyProfile`, `EditProfile`, `Settings` |
| `src/tweaks-panel.jsx` | Dev overlay: `useTweaks`, `TweaksPanel`, `TweakRadio`, `TweakToggle` |
| `src/theme.css` | CSS custom properties for all theme variants; imported by `main.jsx` |

## Navigation model

Custom stack-on-tabs — no router library:

- `phase`: `'splash' | 'register' | 'login' | 'app' | 'deleted'`
- `tab`: `'home' | 'friends' | 'chat' | 'badges' | 'profile'`
- `stack`: `{ screen, props }[]` pushed over the active tab

Only three navigation primitives: `push(screen, props)` / `pop()` / `resetTo(tab)`.

**Adding a screen**: add a `case` to the `switch (top.screen)` block (overlay screens) or `switch (tab)` block (tab roots) in `src/app.jsx`, implement the component in the appropriate `src/screens_*.jsx`.

## Theming

Two visual directions × two modes = four combinations:

- **sage** light/dark — Figtree (humanist sans), muted green
- **dawn** light/dark — Spectral (soft serif), warm clay

Switched at runtime via `data-dir` and `data-mode` attributes on `.nh-root`. `TWEAK_DEFAULTS` in `src/app.jsx` sets the initial values. The `TweaksPanel` bottom-right overlay toggles direction/mode/motion/accent live.

CSS tokens live in `src/theme.css` under selectors like `.nh-root[data-dir="sage"][data-mode="light"]`.

## Domain rules

See `uploads/FRONTEND_DESIGN_BRIEF.md` for full API shapes. Key invariants:

- **Streak**: one active at a time; expires without 24 h check-in; relapse resets to 0 and immediately starts a new streak.
- **Friendship status codes**: 2=deleted, 3=blocked, 4=pending, 5=accepted, 6=rejected.
- **Chat**: friends-only, 1-on-1. Lifecycle: pending → enabled → disabled.
- **Messages**: text only, max 2000 chars. Status 7=unread, 8=read.
- **Auth**: Firebase identity + app JWT. Access token 15 min, refresh 7 days.
- **WebSocket** (Socket.IO): JWT-authenticated at connect. Events: `chat` (join/leave/send/mark_read/typing), `presence` (get_online_status/online_status), friend notifications (friend_request/accept/reject/remove/block/unblock).
