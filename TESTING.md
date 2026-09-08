# NoHarm — Test checklist

List of app features to test manually. Organized by domain, in usage-flow order.

> **Most of this checklist is already automated** in `tests/` (Playwright, 71 tests).
> Run it with `npm run test:e2e`. Items the automation covers are marked 🤖 —
> the rest remain manual verification (Google popup, native push, etc.).
> The bugs the suite found — frontend and backend — have all been fixed;
> the history is in [`tests/README.md`](tests/README.md).

## Auth / Onboarding

- [x] 🤖 **Splash** — "Get Started" opens Register; "Login" opens Login
- [ ] **Register** — create account (Firebase + JWT); back button returns to splash; success → app/home _(Google popup — manual; account creation via API is tested)_
- [ ] **Login** — sign in; back button returns to splash; success → app/home _(Google popup — manual; login via API is tested)_
- [ ] **ID token reaches the backend** — on a real login, the `/auth/login`
      request carries `{idToken}` and the backend responds 200. Worth checking
      only once after swapping Firebase credentials: a token from the wrong
      project returns `401`
- [x] 🤖 **Session persistence** — reload with a saved token goes straight into the app
- [x] 🤖 **Logout** (Settings) — returns to splash, clears the stack
- [x] 🤖 **Delete account** (Settings) — "Your account is gone" screen → "Start over" returns to splash

## Home / Streak

- [x] 🤖 **Start streak** — bottom sheet; pick a date (max = today); "Begin my streak" → confetti + toast
- [x] 🤖 **Long backdated streak** — pick a date ~30 days ago: the streak starts,
      the medals for past milestones appear and **no** rate-limit message shows up
- [x] 🤖 **Check-in** — button; confetti (if motion on); "Checked in — day N" toast; reschedules reminder
- [x] 🤖 **Check-in modal (auto)** — appears when `needsCheckin`; confirming all-clean; marking a setback day ends the streak on that date
- [x] 🤖 **Relapse** — "A setback isn't the end" sheet; reset to 0; compassionate toast; a server failure does not celebrate
- [x] 🤖 **Streak history** — opens the screen; current days + start date; empty state when `days === 0`
- [x] 🤖 **Personal record** — computed from `GET /streaks/record` (`start_at`/`end_at`)
- [x] 🤖 **Confetti** — respects reduce-motion (off when motion = false)

## Friends

- [x] 🤖 **Friends list** — friend list (status = accepted); request counter; tab badge
- [ ] **Friend requests** — received/sent 🤖; accept ("Friend added" toast) 🤖; cancel 🤖; **reject** _(no coverage)_
- [x] 🤖 **Friend search** — search; open profile; send request ("Request sent" toast)
- [x] 🤖 **Public profile** — view profile; relationship (friend / pending_out / pending_in / none); actions: message, add, accept, remove ("Friend removed" toast), block ("User blocked" toast)

## Chat

- [x] 🤖 **Chat list** — conversation list; unread counter (tab badge)
- [x] 🤖 **Chat thread** — open a conversation; send a message; typing; mark_read (WS)
- [x] 🤖 **Message person** — opens an existing chat or creates a new one (from friends/profile)

## Badges

- [x] 🤖 **Badges screen** — grid; earned status from `GET /user-badges/`; "N of M earned" count
- [ ] **Badge detail** — opens the screen 🤖; description 🤖; days remaining 🤖; earned date 🤖; `justUnlocked` flag _(no coverage)_
- [x] 🤖 **Next badge / milestone** — next unearned badge shown on home

## Profile

- [x] 🤖 **My profile** — earned badges, days, record, count, join date
- [x] 🤖 **Edit profile** — save ("Profile updated" toast) + refetch
- [x] 🤖 **Settings** — dark/light toggle, logout, delete, notifications
- [x] 🤖 **Dark mode does not flash white** — switching screens in dark mode shows
      no light flash between screens (the `nhScreenIn` fade exposes the document
      background; it has to be dark too, not just the app column)
- [x] 🤖 **Theme survives a reload** — pick dark, reload: comes back dark,
      and starts dark (no light flash before the app mounts)

## Notifications

- [ ] **Permission** — "Enable notifications" (Settings) _(browser prompt — manual)_
- [ ] **Prefs** — master 🤖 and sub-toggles disabled without permission 🤖; turn `messages`, `friendRequests`, `friendAccepted`, `checkinReminder` on/off individually _(no coverage)_
- [ ] **Check-in reminder** — schedules 9 PM daily when master + pref are on _(Capacitor LocalNotifications — manual, native only)_
- [ ] **In-app banner** — WS notification shows as a banner; tapping navigates (chat/etc) _(the backend already emits `new_message`; the test is still to be written)_
- [x] 🤖 **Toast** — action feedback (auto-dismiss after 2.2 s)

## Navigation / Tabs

- [x] 🤖 **TabBar** — home / friends / chat / badges / profile; counter badges (friends, chat)
- [x] 🤖 **Stack** — push / pop / resetTo; tabs hide when there is an overlay on the stack
- [x] 🤖 **Transition animation** — `nhScreenIn` on screen change

## Theming (TweaksPanel — bottom-right corner)

- [x] 🤖 **Direction** — sage ↔ dawn
- [x] 🤖 **Mode** — light ↔ dark
- [x] 🤖 **Motion** — toggles the animated background + confetti
- [ ] **Accent** — warm (default) _(no alternative in the panel)_

---

## API integrations — now wired up

Handlers previously stubbed, now calling the backend:

- `FriendSearch` receives a real `pool` (`getUsers`) → search filters users
- `onSendRequest` / `onAdd` → `sendFriendRequest`
- `onAccept` / `onReject` / `onCancel` (requests + PublicProfile) → `acceptFriendship` / `rejectFriendship` / `removeFriendship`
- `onRemove` / `onBlock` (PublicProfile) → `removeFriendship` / `blockFriendship`
- Delete account (Settings) → `deleteMe`
- Logout (Settings) → `signOut` + clears tokens
- Chat "Ignore" (received request) → `rejectChat`
- Logout / delete account → `unregisterDeviceToken` (FCM token persisted in `nh_fcm`)

## Backend contract changes already absorbed

- `/auth/login` and `/auth/register` take `{idToken}` (the Firebase ID token),
  no longer `{uid, email}` — the backend verifies the token and takes
  uid/email/photo/`email_verified` from the claims. The front end sends
  `user.getIdToken()`
- `milestone` (badges) became an **integer** — a count of clean days, not a date-time
- badges are granted by the backend on `POST /streaks/start` and `/streaks/checkin`
- `POST /streaks/end` ends the streak and immediately opens the next one (accepts a backdated `end_at`)
- deleted account: the old access token now gets `403 Account not found.`
- `X-Forwarded-For` is only considered coming from a peer in `TRUSTED_PROXIES` — the
  suite stopped forging IPs and now zeroes the rate-limit counters between tests
- `new_message` / `messages_read` / `message_read` events go to the personal room
  `user_<id>`; `join_chat` is still required **only** for `typing_indicator`
- presence became multi-device and cross-instance (registry in Redis);
  the `online_status` format has not changed
- per-user socket limits: `send_message` 30/min, `typing` 60/min

## Proxy (private backend)

Implemented. The details are in `CLAUDE.md` (Deployment section) and in
`noHarmBack/docker/app_locations.conf`, which is the real routing file;
the old `PROXY.md` described a serverless proxy that no longer exists.
The app now talks to its own origin: `VITE_API_URL=/api`, empty
`VITE_SOCKET_URL`, and the container's nginx forwards `/api` (without the
prefix) and `/ws` to the backend at `127.0.0.1:8080`. `npm run dev` proxies the
same routes, so the E2E suite runs against the dev server without bringing up the
container.

Side effect: CORS ceased to exist for web traffic (same origin, no preflight),
and `ALLOWED_ORIGINS` on the backend stops mattering for the SPA.

## Pending on the frontend because of the new backend

- **`src/connectors/socket.js`** — handle the real `connect_error` codes
  (`missing_token`, `invalid_token`, `account_unavailable`, `too_many_connections`).
  Today it is `console.warn` + 5 reconnections for every case.

## Still not integrated (missing endpoint/infra)

- Profile picture upload (EditProfile camera) — no upload endpoint; `putMe` only accepts a URL
- Settings "Privacy & safety" / "Crisis resources" — the screens do not exist; the rows now show as "Soon" and disabled instead of being dead taps
- `totalStreaks` on the Dashboard — hardcoded `0` (no field in the API)
