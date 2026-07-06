# NoHarm

NoHarm is an addiction recovery tracker. The core loop: register → start a streak → daily check-in → earn milestone badges → connect with friends for accountability → 1-on-1 chat.

## Tech stack

- **Vite + React 19** SPA (no router library — custom stack-on-tabs navigation)
- **Capacitor** wraps the web build for iOS/Android (FCM push notifications, scheduled local reminders)
- **Firebase Auth** for identity, backed by an app-issued JWT (access + refresh tokens)
- **Socket.IO** for realtime chat, presence, and friend events

## Getting started

```bash
npm install
npm run dev      # Vite dev server with hot reload → http://localhost:5173
npm run build     # production build → dist/
npm run preview   # serve dist/ locally
```

There is no test runner or lint script configured. `TESTING.md` is a manual QA checklist (in Portuguese) for exercising every user-facing flow.

### Environment variables

| Variable          | Purpose                                               |
| ----------------- | ----------------------------------------------------- |
| `VITE_API_URL`    | REST API base URL                                     |
| `VITE_SOCKET_URL` | Socket.IO URL (falls back to `VITE_API_URL` if unset) |

## Project structure

```
src/
  app.jsx          # Root component: nav state machine, theme wiring, routing
  main.jsx         # Mounts <App>, imports theme.css
  theme.css        # CSS custom properties for the four theme variants
  screens/         # React UI, one folder per domain (auth, home, friends, chat, badges, profile)
  ui/               # Low-level primitives (Icon, Avatar, Btn, Card, Field, ...)
  components/      # Composite widgets (Screen, Header, TabBar, StreakRing, ...)
  store/            # React hooks: data fetch + cache + WS subscriptions
  services/         # Domain logic (api/, ws/, notifications, push)
  connectors/       # Transport layer: REST client, Socket.IO singleton, Firebase, token storage
  data/             # Mock data (used before/without a live backend)
```

See `CLAUDE.md` for the full architecture breakdown and domain rules (streaks, friendship states, chat lifecycle, notification IDs), and `uploads/FRONTEND_DESIGN_BRIEF.md` for API shapes.

## Backend

This app talks to [`noHarmBack`](../noHarmBack/), a separate sibling repository — a FastAPI + PostgreSQL service exposing the REST API (`VITE_API_URL`) and Socket.IO server (`VITE_SOCKET_URL`) this frontend consumes. See its `docs/README.md` for architecture, auth flow, and API details.

## Mobile

The web build is wrapped with Capacitor for iOS/Android (`capacitor.config.json`). Uses `@capacitor/push-notifications` for FCM/APNs and `@capacitor/local-notifications` for the scheduled daily check-in reminder.

## Other files

- `NoHarm.html` / `NoHarm-standalone.html` — a standalone CDN-loaded React+Babel demo, not the active development target.
- This project was originally bootstrapped from an Expo template. `AGENTS.md` and `scripts/reset-project.js` are leftovers from that and no longer apply — the project is Vite + React + Capacitor, not Expo.

## License

MIT — see `LICENSE`.
