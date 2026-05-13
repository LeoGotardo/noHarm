# noHarm — Frontend

Addiction recovery tracker web app. React + Vite + TypeScript.

## Stack

- **React 18** + **TypeScript** + **Vite**
- **shadcn/ui** + **Tailwind CSS** — UI components
- **TanStack Query v5** — server state
- **react-router-dom v6** — routing
- **Firebase Auth** — Google sign-in
- **Socket.IO** — real-time chat & friendship events
- **Vitest** + **Testing Library** — unit tests

Backend: [`../noHarmBack/`](../noHarmBack/)

## Getting started

```bash
# Install dependencies
bun install

# Create env file
cp .env.example .env.local  # fill in values (see below)

# Start dev server (http://localhost:8080)
bun run dev
```

## Environment variables

Create `.env.local`:

```env
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

## Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Dev server on port 8080 |
| `bun run build` | Production build |
| `bun run lint` | ESLint |
| `bun run test` | Run tests once |
| `bun run test:watch` | Tests in watch mode |

## Project structure

```
src/
├── pages/          # Route-level components (Home, Friends, Progress, Chat, Help, Profile)
├── components/     # App-specific components (AppLayout, StreakCounter, EmergencyButton, …)
│   └── ui/         # shadcn/ui primitives — do not hand-edit
├── hooks/
│   ├── api/        # TanStack Query hooks (useStreak, useFriends, useChats, …)
│   └── webSocket/  # Socket.IO handlers (chat, friendship events)
├── context/        # AuthContext — Firebase + JWT session
├── services/       # api.js (Axios + refresh logic), socket.js
└── lib/            # utils (cn helper)
```

## Auth flow

1. Firebase Google popup → Firebase UID
2. `POST /auth/login` with UID → JWT pair stored in `localStorage`
3. 404 on login → `POST /auth/register` (new user)
4. Axios interceptor attaches `Authorization: Bearer` on every request
5. On 401 → refresh via `POST /auth/refresh`, retry once, then clear tokens

## Adding shadcn components

```bash
bunx shadcn@latest add <component-name>
```

Never hand-edit files in `src/components/ui/`.
