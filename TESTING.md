# NoHarm — Test checklist

List of app features to test manually. Organized by domain, in usage-flow order.

> **Most of this checklist is already automated** in `tests/` (Playwright, 113 tests).
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
- [x] 🤖 **Report a user** — gear → "Report this user"; six reasons, Send
      disabled until one is picked; optional details, capped at 1000 characters
      and stored without markup; "Report sent — thank you" toast; the sheet
      states the reported user is never told; Cancel and a reopen start blank;
      a second report while the first is open shows "You already reported this
      user" inline and keeps what was typed; a server failure keeps the sheet
      open and does not celebrate; reporting works on a stranger found in
      search and changes no relationship — the friendship, the friend list and
      the tab counters are the same afterwards, on both sides
- [x] 🤖 **A report stays private** — the reported user sees no banner, no
      toast and no counter while it is filed, and `GET /reports/mine` never
      returns a report about them; the moderation queue (`GET /reports`,
      resolve, evidence) answers 404 to anyone outside `ADMIN_USER_IDS`
- [x] 🤖 **A report carries the conversation** — reporting someone you have a
      chat with captures that chat's last messages, both sides, in order, plus
      the reported profile as it was; with no chat, the profile alone. What the
      reporter typed in "details" never appears among the captured messages —
      the app sends a chat id, and the server copies the text itself

## Chat

- [x] 🤖 **Chat list** — conversation list; unread counter (tab badge)
- [x] 🤖 **A message that arrives with the socket down** — it shows up when the
      socket connects, without reopening the app (Socket.IO replays nothing)
- [x] 🤖 **Chat thread** — open a conversation; send a message; typing; mark_read (WS)
- [x] 🤖 **A sent message appears once** — the socket echoes it back to the
      sender and the send also refetches the thread; whichever lands second must
      not paint a second copy
- [x] 🤖 **Message person** — opens an existing chat or creates a new one (from friends/profile)
- [x] 🤖 **Double tap on Send** — two taps landing before the re-render post one
      message, not two (the tap guard, see CLAUDE.md → Tap guards)

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

## Housekeeping

- [x] 🤖 **The suite leaves no trace** — a soft-deleted account is still a row,
      and the sweep the run ends with is what actually removes it

## Moderation

Admin-only, no screen in the app — covered at the API level in
`tests/moderation.spec.js`.

- [x] 🤖 **Suspension** — a timed ban answers the login with
      `ACCOUNT_SUSPENDED` and the end date; a permanent one with
      `ACCOUNT_BANNED` and no date; the token the user already held stops
      working; lifting it by hand lets them straight back in
- [x] 🤖 **Only moderators** — an ordinary user suspending anyone gets 404, and
      a moderator cannot suspend themselves
- [x] 🤖 **Review lock** — claiming a report keeps a second moderator from
      claiming *or resolving* it; releasing puts it back undecided; resolving
      clears the lock; the reporter is never told who is reading their report
- [x] 🤖 **Resolving is not punishing** — closing a report leaves the reported
      account able to sign in
- [x] 🤖 **Moderation screen** — the Settings "Reports" row is absent for an
      ordinary account; for a moderator it opens the queue, a report shows the
      reason, what the reporter wrote and the captured conversation on both
      sides, opening it claims the report (a second moderator gets 409),
      leaving without deciding hands it back, Dismiss closes it, and suspending
      from it locks the account out while leaving the report open
- [x] 🤖 **Warning** — a moderator sends one from the report screen; the user
      sees it on their next open ("A message you sent was reported" + the
      moderator's words), it says nothing changed about their account and where
      to appeal, never names the reporter, and one "I understand" retires it for
      good. The account still signs in, and the report stays open — warning is
      not deciding
- [x] 🤖 **Suspension notice** — an account coming back from a suspension is
      told why, and that its streak and friends are untouched
- [x] 🤖 **A safety report is never a warning** — `self_harm` is refused with
      the crisis-resources reason
- [x] 🤖 **Username reset** — for a report about a *name*. The handle is
      replaced immediately with `user_xxxxxxxx`, the account owes a new one,
      and choosing one is the only thing that lifts it. The account is not
      banned and keeps its streak, friends and history
- [x] 🤖 **Picture block** — the photo is removed, a new one is refused, and
      signing in again does not bring it back from the Google account;
      unblocking restores nothing and stops refusing
- [x] 🤖 **Both say why** — each writes its own notice (`rename`, `picture`)
      and neither names the reporter
- [x] 🤖 **Profile sanctions are admin-only** — an ordinary caller gets 404,
      and a moderator cannot use either on themselves
- [x] 🤖 **The queue names the reporter** — `reporter_username` beside the uid
      for a moderator, and never on `GET /reports/mine`
- [ ] **Report screen shows the profile** — for an `impersonation` or
      `inappropriate` report, the captured picture and username are drawn at a
      size a moderator can judge, and "Reset their username" / "Remove their
      picture" appear above the ladder _(needs a real photo — manual)_
- [ ] **Forced rename screen** — an account under the sanction sees its notice,
      then a screen it cannot leave until it picks a name; the tab bar and side
      rail are gone and the check-in modal does not interrupt it _(manual)_
- [ ] **Suspended sign-in copy** — the login screen says "paused until <date>"
      and where to appeal _(behind the Google popup — manual)_

## Brand & icons

- [x] 🤖 **Icon set wired** — `favicon.svg`, `apple-touch-icon.png`,
      `manifest.webmanifest` and both theme-colors in the head, and every file
      they name answers 200
- [x] 🤖 **The tab icon is the same image as every other** — `icon.svg`, ring
      included; the simplified variant that dropped it is gone, and
      `/favicon.svg` 404s
- [x] 🤖 **One drawing everywhere** — the check path matches in the app, in
      `icon.svg`, `noharm-mark.svg`, `noharm-lockup.svg` and both public legal
      pages
- [x] 🤖 **A shared link previews as something** — `og:image`, title and
      `summary_large_image`, and the image is the PNG rather than the lockup
      SVG, whose `<text>` falls back to Arial wherever Figtree is not loaded
- [ ] **Installed app** — the icon on a home screen and in the app switcher,
      light and dark _(needs a device — manual)_
- [ ] **Native icons** — `android/` and `ios/` are generated and gitignored, so
      the Capacitor icon set is regenerated from `public/icon.svg` at build
      time, not versioned _(manual)_

## Desktop layout

Covered by the `desktop` Playwright project (1440x900) — `tests/desktop.spec.js`
plus the flow specs re-run at that size.

- [x] 🤖 **Side rail replaces the tab bar** — and stays while a screen is pushed
- [x] 🤖 **Content sits in a centred column**, not stretched across the window
- [x] 🤖 **Badges grid uses the width** — more than the phone's three columns
- [x] 🤖 **Auth is a centred card** — capped at `--form-max`, vertically centred,
      drawn as a surface; the thumb gap that splits login in half on a phone is
      collapsed
- [x] 🤖 **The register form scrolls without losing its top** — it is taller than
      the window, and `margin: auto` is what keeps the header reachable
- [x] 🤖 **Sheets become centred dialogs**, and Escape closes them
- [x] 🤖 **Chat is two panes** — the list stays while a conversation is open

## Admin board

Behind the same `ADMIN_USER_IDS` allowlist as the moderation queue — one
allowlist decides both, so `useModerator`'s single probe answers for both rows.

- [x] 🤖 **The row is absent for an ordinary account** — and the API answers
      404, not 403, so the screen being hidden is cosmetic rather than the gate
- [x] 🤖 **Every panel renders** — accounts, bans and sanctions, moderation,
      health, suspicious traffic
- [x] 🤖 **Health reads zero when nothing is wrong** — and says so; every field
      in that block is a failure, and two of them are the retention crons
      failing invisibly
- [x] 🤖 **Self-harm reports are counted on their own** — not folded into the
      queue total
- [x] 🤖 **The account list shows banned and deleted accounts** — which
      `GET /users` hides — **and nothing about anyone's recovery**: the test
      asserts no streak appears anywhere on the screen
- [x] 🤖 **Charts plot every day in the window**, empty ones included — a
      series with its gaps removed is drawn as a line through them, which turns
      a handful of sign-ups into a steady climb
- [x] 🤖 **Two charts, never one with two y-scales** — sign-ups and reports
      differ by an order of magnitude, and a second axis invents a correlation
- [x] 🤖 **The period filter scopes the charts** — 7 / 30 / 90, the summary
      line follows it, and the server cache is keyed by period so switching the
      range cannot return the previous window's numbers
- [x] 🤖 **The comparison chart reads the three inactive states** — disabled,
      deleted, banned, one hue between them
- [x] 🤖 **Every chart has a table view** — identity never rests on seeing the
      shape
- [ ] **Errors and Access tabs with real content** — needs a fault and an SSH
      login on the box _(manual)_
- [ ] **Pagination past one page** — needs more than 25 accounts _(manual)_

## Legal & consent

The gate decides whether an account gets into the app at all, and one of its
buttons deletes every streak the account has — `tests/legal.spec.js` covers both
halves. The documents' *text* is deliberately not asserted: it is a placeholder
and will be rewritten.

- [x] 🤖 **Registration is gated** — refused without the terms and the privacy
      policy (400), and refused below `MINIMUM_AGE_YEARS` (403 `UNDERAGE`, with
      the minimum in `details`)
- [x] 🤖 **A fresh account owes nothing** — `pending_consents` empty, and the
      three rows carry the version the *server* had in force, never one the
      client named
- [x] 🤖 **Declining health data is an answer** — the app stays usable, the gate
      never reappears for it, and `POST /streaks/start` answers 403
- [x] 🤖 **Withdrawing health consent deletes every streak** — including the
      closed ones behind the personal record; the consent row survives stamped
      with the moment it ended, and withdrawing again is a no-op
- [x] 🤖 **Export is the account's own data** — and never the reports filed
      against it, which would name the reporter
- [x] 🤖 **A stale version shows the gate instead of the app** — full screen,
      with no tab bar and no side rail over it
- [x] 🤖 **Withdrawing turns the dashboard honest** — "Tracking is off" instead
      of "Begin your journey", no "Start my streak" (the only answer it could
      get is 403), it says the old streaks are gone for good, and the way back
      goes through Privacy & data rather than a second, quieter consent prompt
- [x] 🤖 **Crisis resources** — reachable from Settings, says plainly that this
      is not treatment, and the numbers are `tel:` links
- [x] 🤖 **Privacy & data** — both documents listed, and one opens as the same
      screen the gate shows
- [ ] **Export downloads a file** — the button fetches and saves
      `noharm-export.json` _(a browser download — manual)_
- [ ] **Re-accepting from the gate** — ticking both and continuing returns the
      app _(needs a republished version on a live backend — manual)_

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
- `onReport` (PublicProfile → `ReportSheet`) → `reportUser` (`POST /reports/{userId}`)
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
