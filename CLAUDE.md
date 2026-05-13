# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

React + Vite + TypeScript web app — addiction recovery tracker. Uses shadcn/ui, TailwindCSS, TanStack Query, react-router-dom v6, and Firebase Auth. Connects to a FastAPI backend (`../noHarmBack/`).

## Commands

```bash
# Dev server (port 8080)
bun run dev        # or: npm run dev

# Build
bun run build

# Lint
bun run lint

# Tests (vitest + jsdom)
bun run test               # single run
bun run test:watch         # watch mode

# Run single test file
bunx vitest run src/path/to/file.test.ts
```

## Path Alias

`@/` maps to `src/`. All internal imports use this alias.

## Architecture

### Routing (`src/App.tsx`)
Provider order: `QueryClientProvider` → `AuthProvider` → `TooltipProvider` → `BrowserRouter`. `/login` is public; all other routes are wrapped in `ProtectedRoute`. Pages: Index (re-exports HomeScreen), FriendsScreen, ProgressScreen, ChatScreen, HelpScreen, ProfileScreen, LoginPage, NotFound.

### Layout (`src/components/AppLayout.tsx`)
All authenticated pages use `AppLayout` — sticky header, bottom nav bar, geometric background. Max width `md`, centered. Nav: Home / Friends / Progress / Chat / Help. Profile via header icon.

### Auth (`src/context/AuthContext.jsx`)
Firebase Google sign-in only. Flow: Firebase popup → exchange Firebase UID with backend at `POST /auth/login` (or `POST /auth/register` on 404) → store JWT pair in `localStorage`. `AuthProvider` wraps the app; `ProtectedRoute` (`src/components/ProtectedRoute.tsx`) redirects unauthenticated users to `/login`.

### API client (`src/services/api.js`)
Axios instance pointed at `EXPO_PUBLIC_API_URL` (falls back to `http://localhost:8000`). Attaches `Authorization: Bearer <accessToken>`. On 401, attempts one refresh via `POST /auth/refresh`, retries; on second failure clears tokens and reloads.

TanStack Query hooks live in `src/hooks/api/`: `useStreak`, `useUser`, `useFriends`, `useChats`, `useBadges`. Add new API hooks there.

### WebSocket (`src/services/socket.js` + `src/hooks/webSocket/`)
Socket.IO client, `autoConnect: false`. `useWebSocket` hook connects on mount if `accessToken` present. Handlers split by domain: `chatHandlers.ts`, `friendshipHandlers.ts`. Use `emit()` exported from `useWebSocket.ts` to send events.

> Note: env vars use `EXPO_PUBLIC_` prefix (legacy from the React Native prototype). Create a `.env.local` with these keys:
> ```
> EXPO_PUBLIC_API_URL=
> EXPO_PUBLIC_FIREBASE_API_KEY=
> EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
> EXPO_PUBLIC_FIREBASE_PROJECT_ID=
> EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
> EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
> EXPO_PUBLIC_FIREBASE_APP_ID=
> ```

### UI components
`src/components/ui/` — shadcn/ui primitives (do not hand-edit; add new ones via `bunx shadcn@latest add <component>`).

`src/components/` — app-specific: `AppLayout`, `StreakCounter`, `QuoteCard`, `EmergencyButton`, `FriendCard`, `GeometricBg`, `NavLink`, `ProtectedRoute`.

### State
No global store. Streak start date and user name stored in `localStorage` (`noharm-start`, `noharm-name`). Server data via TanStack Query hooks in `src/hooks/api/`.

### Testing
Vitest + jsdom + `@testing-library/react`. Tests live in `src/**/*.test.ts(x)`. Setup file at `src/test/setup.ts`.

## Key decisions
- `firebase.js` at root is a leftover from the React Native prototype; active Firebase init is in `src/context/AuthContext.jsx`.
- `components.json` governs shadcn/ui config (base color, path aliases, etc.).
- Dev server uses `hmr.overlay: false` to suppress Vite error overlay.
