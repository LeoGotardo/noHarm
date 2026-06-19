# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this project is

NoHarm — addiction recovery tracker. Core loop: register → start streak → daily check-in → earn milestone badges → connect with friends for accountability → 1-on-1 chat. Tone must be warm and compassionate, never clinical.

## Two tracks

### 1. HTML prototype (`NoHarm.html`)
No bundler. React + Babel loaded from CDN. The `src/*.jsx` files are script tags compiled in-browser by Babel. Open `NoHarm.html` directly in a browser — no build step. `NoHarm-standalone.html` is a single-file version with all scripts inlined.

File layout:
- `src/data.jsx` — mock data exposed on `window` (ME, BADGES, FRIENDS, CHATS, PEOPLE, …)
- `src/ui.jsx` — shared primitives exposed on `window` (Icon, Avatar, Btn, Card, Field, BottomSheet, Toast, StreakRing, TabBar, …)
- `src/geo.jsx` — animated geometric backgrounds
- `src/app.jsx` — App orchestrator: theme tweaks, navigation state machine, all screen routing
- `src/screens_auth.jsx`, `src/screens_home.jsx`, `src/screens_friends.jsx`, `src/screens_chat.jsx`, `src/screens_badges.jsx`, `src/screens_profile.jsx` — screen components per feature area
- `tweaks-panel.jsx` — dev-only panel (useTweaks, TweaksPanel, TweakRadio, TweakToggle, …)

All globals are set via `window.X = X` or bare `const` in script scope so Babel passes them between script tags.

### 2. Root Expo project (Expo 54, TypeScript)
The root `package.json` runs Expo 54 with expo-router and React 19. `app/index.tsx` is currently a placeholder — the active UI work is in the HTML prototype. The old expo-router pages that lived under `src/` were removed on the `ref/new-ui` branch.

```bash
npm install
npx expo start          # or npm start
npm run android
npm run ios
npm run web
npm run lint            # expo lint
```

## Navigation model (both tracks)

Custom stack-on-tabs pattern — no React Navigation or expo-router involved:
- `phase`: `'splash' | 'register' | 'login' | 'app' | 'deleted'`
- `tab`: `'home' | 'friends' | 'chat' | 'badges' | 'profile'`
- `stack`: array of `{ screen, props }` pushed over the active tab

`push(screen, props)` / `pop()` / `resetTo(tab)` are the only navigation primitives.

## Theming

Two visual directions, two modes each:
- **sage** light/dark — humanist sans (Figtree), muted green
- **dawn** light/dark — soft serif numerals (Spectral), warm clay

Controlled via `data-dir` and `data-mode` attributes on `.nh-root` in the HTML prototype; via `ThemeProvider`/`useTheme` in the Expo app.

`TWEAK_DEFAULTS` in `src/app.jsx` sets the initial direction/mode/motion/accentName. The `TweaksPanel` (bottom-right overlay in the HTML prototype) lets you toggle these at runtime.

## Domain data shapes

See `uploads/FRONTEND_DESIGN_BRIEF.md` for complete API data shapes and backend rules. Key points:
- **Streak**: one active at a time; expires if no check-in within 24 h; ending a streak immediately starts a new one.
- **Friendship status codes**: 4=pending, 5=accepted, 6=rejected, 3=blocked, 2=deleted.
- **Chat**: friends-only, 1-on-1. Lifecycle: pending → enabled → disabled.
- **Messages**: text only, max 2000 chars, status 7=unread / 8=read.
- **Auth**: Firebase identity + app-issued JWT. Access token 15 min, refresh token 7 days.
- **WebSocket** (Socket.IO): authenticated via JWT at connect. Events: chat (join/leave/send/mark_read/typing), presence (get_online_status / online_status), friend notifications (friend_request/accept/reject/remove/block/unblock).

## Adding screens

In the HTML prototype, add a case to the `switch (top.screen)` block (overlay screens) or `switch (tab)` block (tab root screens) in `src/app.jsx`, then implement the component in the appropriate `src/screens_*.jsx` file.

In the Expo app, add the component to the relevant file under `expo/src/screens/` and wire it into `expo/App.js` the same way.
