# HANDOFF — noHarm
**Branch:** ref/new-ui | **Date:** 2026-06-19 | **Repo:** https://github.com/LeoGotardo/noHarm.git

---

## What This Project Is

NoHarm — addiction recovery tracker. Core loop: register → streak → daily check-in → badges → friends → 1-on-1 chat. Backend: `../noHarmBack/` (FastAPI + Socket.IO + PostgreSQL, deployed on Vercel).

---

## Current State

**Phases 1 + 2 complete. App builds with zero errors/warnings.**

The branch is now a clean React + Vite web app. All Expo remnants have been removed. The Vite build outputs `dist/` with 40 modules, ~287 KB JS.

### New file layout

| File | Status |
|---|---|
| `index.html` | Vite entry, includes Google Fonts |
| `vite.config.js` | `@vitejs/plugin-react`, automatic JSX runtime |
| `package.json` | Vite 6 + React 19, no Expo |
| `tsconfig.json` | Plain Vite tsconfig, no `expo/tsconfig.base` |
| `src/main.jsx` | `createRoot` → `<App />`, imports `theme.css` |
| `src/theme.css` | All CSS tokens, keyframes (nhScreenIn, nhTypeDot, geo-*) |
| `src/data.jsx` | Mock data, all ES `export const` |
| `src/geo.jsx` | `export function GeoBackground` |
| `src/ui.jsx` | All primitives exported; re-exports GeoBackground |
| `src/tweaks-panel.jsx` | Moved from root; all hooks imported; all exported |
| `src/ios-frame.jsx` | Moved from root; Fragment imported; all exported |
| `src/screens_auth.jsx` | ES module, named exports |
| `src/screens_home.jsx` | ES module, named exports |
| `src/screens_friends.jsx` | ES module, named exports |
| `src/screens_chat.jsx` | ES module, named exports |
| `src/screens_badges.jsx` | ES module, named exports |
| `src/screens_profile.jsx` | ES module, named exports |
| `src/app.jsx` | `export default App`; all screen/data/ui imports wired |

### Removed (Expo remnants)
- `app/` directory (expo-router placeholder)
- `app.json`, `babel.config.js`, `expo-env.d.ts`, `.expo/`
- Root `ios-frame.jsx`, `tweaks-panel.jsx` (moved to `src/`)

### Still untracked / untouched
- `NoHarm.html`, `NoHarm-standalone.html` — original HTML prototype (keep as reference)
- The old Expo TypeScript files under `src/components/`, `src/hooks/`, `src/services/` are staged as deleted (were deleted on this branch before this session)

---

## Architecture

- Navigation: `phase` (splash/register/login/app/deleted) + `tab` + `stack[]` — pure state, no router library
- Theming: `data-dir` (sage/dawn) + `data-mode` (light/dark) on `.nh-root`; CSS custom properties in `theme.css`
- Dev tools: `TweaksPanel` (bottom-right overlay) toggles theme/motion at runtime
- Device frame: `IOSDevice` wraps everything; scales to fit viewport via `useDeviceScale`

---

## What's Next

### Phase 3 — Conditional dev-only imports (optional, ~20 min)
Wrap `TweaksPanel` + `IOSDevice` in `src/app.jsx` with `import.meta.env.DEV` guards so the prod build strips them. Currently always included.

### Phase 4 — Capacitor (~1h)
```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
npx cap init noHarm com.noharm.app --web-dir dist
npx cap add ios
npx cap add android
```
Create `capacitor.config.ts` pointing `webDir: 'dist'`. Run `npm run build && npx cap sync` before opening Xcode/Android Studio.

### Phase 5 — Backend Integration (~3-4h)
- `npm install socket.io-client axios`
- Create `src/services/api.js` — axios instance, base URL from `import.meta.env.VITE_API_URL`
- Create `src/services/socket.js` — Socket.IO client, JWT auth at connect
- Create `src/context/AuthContext.jsx` — Firebase Auth + app JWT in localStorage
- Wire real API into screens, starting with auth → streak → friends/chat

---

## Backend Reference (`../noHarmBack/`)

FastAPI + Socket.IO + PostgreSQL (Neon) + Redis. Deployed on Vercel.
- Socket.IO: JWT at connect; rooms `user_{id}` (auto) and `chat_{chatId}` (join via event)
- Auth: Firebase identity + app JWT (access 15 min, refresh 7 days)
- Friendship codes: 4=pending 5=accepted 6=rejected 3=blocked 2=deleted
- Message codes: 7=unread 8=read
- Full API shapes: `uploads/FRONTEND_DESIGN_BRIEF.md`

---

## Resume Prompt

You are resuming work on **noHarm** (branch `ref/new-ui`), an addiction recovery tracker at `/home/leog/Documentos/noharm/noHarm`. Backend is at `../noHarmBack/` (FastAPI + Socket.IO).

**Phases 1 and 2 are done.** The app is now React + Vite with all source files converted to ES modules. `npm run build` succeeds with 40 modules, zero warnings. All Expo files have been removed.

The app renders a pixel-perfect iOS device frame (`IOSDevice` from `src/ios-frame.jsx`) containing all screens: splash, auth, home (streak ring, check-in), friends, chat, badges, profile. Navigation is a custom state machine (`phase/tab/stack`) in `src/app.jsx`. A `TweaksPanel` overlay (bottom-right) controls theme direction (sage/dawn) and mode (light/dark) at runtime.

**What to do next:**

1. Run `npm run dev` and verify the app renders correctly in the browser.
2. **Phase 3 (optional):** In `src/app.jsx`, wrap the `TweaksPanel` and `IOSDevice` imports with `import.meta.env.DEV` so they are stripped from production builds.
3. **Phase 4 (Capacitor):** `npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android`, then `npx cap init noHarm com.noharm.app --web-dir dist`, then `npx cap add ios && npx cap add android`. Create `capacitor.config.ts`.
4. **Phase 5 (Backend):** Install `socket.io-client axios`, create `src/services/api.js` and `src/services/socket.js`, create `src/context/AuthContext.jsx` with Firebase Auth. Wire real API into screens starting with auth flow.

Full API shapes are in `uploads/FRONTEND_DESIGN_BRIEF.md`.
