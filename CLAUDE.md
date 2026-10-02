# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

NoHarm — addiction recovery tracker. Core loop: register → start streak → daily check-in → earn milestone badges → connect with friends for accountability → 1-on-1 chat. Tone must be warm and compassionate, never clinical.

This repo is the **front end only**. The API it talks to is
[`../noHarmBack`](../noHarmBack/) — FastAPI + PostgreSQL + Socket.IO, a sibling
repository that must sit next to this one on disk (the production image builds
both). Its `docs/README.md` is the architecture and auth reference, its
`CLAUDE.md` the domain rules (RLS, moderation, account lifecycle, rate limits),
and `docs/FRONTEND_DESIGN_BRIEF.md` the API shapes this app consumes.

## Commands

```bash
npm run dev        # Vite dev server (hot reload)
npm run build      # production build → dist/
npm run preview    # serve dist/ locally
npm run test:e2e   # Playwright suite — needs the backend on :8080

npm run build:mobile          # vite build --mode mobile (absolute API URLs from .env.mobile)
npx cap sync android          # copy dist/ into the native project
cd android && ./gradlew assembleDebug   # → android/app/build/outputs/apk/debug/app-debug.apk
```

No lint script. Open `http://localhost:5173` after `npm run dev`.

`.github/workflows/security.yml` runs `npm audit` (production dependencies fail
the build) and gitleaks over the whole history on every push, pull request and
Monday; `.github/dependabot.yml` opens weekly update PRs (the Capacitor CLI is
held below v8, which needs Node 22). `pre-commit install` enables the same
gitleaks check before each commit (`.pre-commit-config.yaml`).

The full APK walkthrough — prerequisites, signing a release build, and the
failure modes — is in [`README.md`](README.md), "Building the Android APK".
Two things to know before touching it: `android/` and `ios/` are **gitignored
and generated** (`npx cap add android`), so nothing you edit in there is
versioned or survives a regeneration; and `applicationId` must stay
`com.no.harm`, matching a `package_name` in the (also gitignored)
`android/app/google-services.json`, or `:app:processDebugGoogleServices` fails
the build.

The e2e suite **cleans the database before and after every run** — every account
it makes and everything hanging off them (`tests/helpers/cleanup.js`, wired as
`globalSetup`/`globalTeardown`). It has to be SQL: `DELETE /users/me` is a soft
delete and the only hard delete in the backend refuses anything inside its
30-day grace window, so before this the suite left thousands of accounts behind.

`tests/` is a Playwright suite that automates most of `TESTING.md`; see
[`tests/README.md`](tests/README.md) for how it fakes the Google popup and what
it assumes about the backend. `TESTING.md` remains the manual QA checklist,
organised by domain in use-flow order — update it when adding/changing
user-facing flows, and mark 🤖 what the suite covers.

Playwright reuses a dev server already listening on the configured port
(`reuseExistingServer`), so if **another project** holds `:5173` the suite
silently tests that app instead. Point it elsewhere when that happens:
`E2E_WEB_URL=http://localhost:5180 npm run test:e2e`, with `npm run dev -- --port 5180`.

Env vars: `VITE_API_URL` (REST base URL) and `VITE_SOCKET_URL` (Socket.IO URL; unset falls back to `VITE_API_URL`, empty means the page's own origin). For the web build they are the relative `/api` and empty — see Deployment below. Every `VITE_*` is inlined by Vite at build time, so changing one needs a rebuild, not a restart.

Three more are **copy, not behaviour**, and the backend is the authority on all
three: `VITE_MINIMUM_AGE` and `VITE_DELETION_GRACE_DAYS` mirror
`MINIMUM_AGE_YEARS` and `ACCOUNT_DELETION_GRACE_DAYS`, and `VITE_SUPPORT_EMAIL`
is the appeal address on a notice and on a refused sign-in. Each has a fallback
in the code, so a missing one does not break the build — it ships a screen
stating a number the server does not enforce. `VITE_APP_VERSION` is the
release tag shown in Settings (`dev` when unset). See `.env.example` for the
full list; anything added there has to be added to `docker/Dockerfile`,
`docker/deploy-host.sh` and `.github/workflows/deploy.yml` as well — and, if
the APK needs it, to the `ENV_MOBILE_LOCAL` secret of the release workflow.

`npm run dev`'s proxy in `vite.config.js` mirrors the nginx routes (`/api` stripped, `/ws` passed through), which is what lets the app use the same relative URLs in dev and in production.

## Architecture

**Main app**: Vite + React 19 SPA. Entry: `index.html` → `src/main.jsx` → `src/app.jsx`.

**Mobile**: Capacitor wraps the web build for iOS/Android. `@capacitor/push-notifications` for FCM/APNs, `@capacitor/local-notifications` for scheduled reminders.

**Import aliases** (`vite.config.js`): `@components` → `src/components`, `@ui` → `src/ui`. Note `tsconfig.json` also declares `@/*` → `src/*`, but vite does **not** resolve it — `@/…` imports build-break. Use only `@components`/`@ui` or relative paths.

**Expo leftovers**: the project was bootstrapped from an Expo template but is **not** Expo — it's Vite + React + Capacitor. `AGENTS.md` and `scripts/reset-project.js` have been removed; `README.md` was rewritten. (`assets/` is no longer theirs: it now holds the icon and splash sources, below.) What still lingers: `.vscode/extensions.json` (recommends `expo.vscode-expo-tools`) and `.claude/settings.json` (enables the Expo plugin).

### Layer diagram

```
screens/          ← React UI, one folder per domain
  └─ import from ─→ ui/          ← low-level primitives (Icon, Avatar, Btn, Card, Field, …) + cx
                  → components/  ← composite widgets (Screen, Header, TabBar, BottomSheet, Toast, StreakRing, …) + format helpers
                  → store/       ← React hooks: data fetch + cache + WS subscriptions
                  → services/    ← domain logic (no React)
                      api/       ← REST calls
                      ws/        ← Socket.IO event handlers

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
| `src/main.jsx` | Mounts `<App>`, imports `theme.css` — or, for a web visitor with no session, sends them to the landing page instead |
| `src/landing.js` | When the landing page applies (web, not native, not an installed PWA), the `?start=` query it links back with, and `goToLanding` |
| `src/theme.css` | CSS custom properties for all four theme variants, the layout tokens the breakpoint drives, and the hover/focus rules. Theme token blocks are attribute-only selectors so `<html>` resolves them too — see Theming and Responsive layout |
| `src/ui/index.js` | Low-level primitives: `Icon`, `Avatar`/`OnlineDot`, `Btn`, `Card`, `Checkbox`, `Field`, `Skeleton`, `GeoBackground`, `Divider`, `SectionLabel`, plus `cx` helper, the tap guards from `guards.js` (`useGuardedCallback`, `useDebouncedValue`) and `useWide` from `useBreakpoint.js` (see Responsive layout) |
| `src/components/index.js` | Composite widgets: `Screen`, `Header`, `Banner`, `Toast`, `BottomSheet`, `TabBar`/`SideNav`, `SplitView`/`NoSelection`, `StreakRing`/`BadgeMedallion`, `EmptyState`, `Mark`/`Wordmark`/`Logo`, `GoogleButton`, `PersonRow`, `RoleBadge` (the Official/Admin mark beside a name, from the API's `role` — see Domain rules), `SegTabs`, `ConfirmSheet` + `CONFIRM_COPY` (see Confirmations), `EmojiPicker`/`EmojiButton`/`insertAtCursor` (see Emoji), plus format helpers from `utils.js` (`hashHue`, `fmtTime`, `fmtLongDate`, `fmtRelDate`, `fmtShortDay`, `textLength`, `clampText`, `bigEmojiCount`) |
| `src/connectors/` | Transport layer (see diagram above) |
| `src/services/api/` | `admin`, `auth`, `badge`, `chat`, `consent`, `device`, `friendship`, `message`, `moderation`, `notice`, `post`, `report`, `streak`, `user` |
| `src/services/ws/` | `admin` (alerts), `chat`, `connection`, `friendship`, `presence` |
| `src/services/notifications.js` | Browser Notification API wrapper (`notif.send/requestPermission/granted`) |
| `src/services/push.js` | Capacitor FCM wrapper (`push.register/onForeground/onTap`) |
| `src/services/download.js` | `downloadJson` / `copyText` / `isNativeApp`. The web build saves a file; the native shell has no download manager and no Filesystem plugin, so it reports `{ok:false}` and `DataAndPrivacy` shows the JSON to copy instead of failing silently |
| `src/services/checkinReminder.js` | Capacitor LocalNotifications — schedules daily 9 PM reminder (id 1001) |
| `src/store/cache.js` | localStorage cache helpers (`cacheRead/cacheWrite/cacheClear/cacheValid`), prefix `nh_cache_` |
| `src/store/useBadges.js` | Fetches badges; 1 h cache; normalises `items` → `badges` |
| `src/store/useChats.js` | Chat list + WS subscriptions |
| `src/store/useFriends.js` | Friend list + WS subscriptions |
| `src/store/useStreak.js` | Active streak data |
| `src/store/useUser.js` | Current user profile |
| `src/store/usePosts.js` | The Community feed, both scopes, in one module-level store (`useSyncExternalStore`) held in memory for the session — never localStorage. `patchPost`/`dropPost`/`dropAuthor` walk every copy of a post; `setLiked` is the optimistic like |
| `src/store/useComments.js` | Comments of the open post; writes the count back to the feed store |
| `src/store/useModeration.js` | `useModerator(enabled)` — probes `GET /reports` once per session to find out whether this account can moderate |
| `src/store/useNotices.js` | Moderation notices waiting for this user; `acknowledge` marks one read |
| `src/store/useNotifPrefs.js` | Persists notification prefs to `nh_notif_prefs` in localStorage; keys: `master`, `messages`, `friendRequests`, `friendAccepted`, `community`, `checkinReminder` |
| `src/store/useNotifications.js` | Wires WS events → browser/local notifs; registers FCM token on native |
| `src/store/useCheckinReminder.js` | Schedules/cancels `checkinReminder` based on combined master+pref flag |
| `src/screens/auth/` | `SplashScreen`, `RegisterScreen`, `LoginScreen` |
| `src/screens/home/` | `Dashboard`, `StreakHistory`, `CheckInModal` |
| `src/screens/friends/` | `FriendsScreen`, `FriendRequests`, `FriendSearch`, `PublicProfile`, `ReportSheet`, `BlockedPeople` |
| `src/screens/chat/` | `ChatList`, `ChatThread` |
| `src/screens/notifications/` | `NotificationsScreen` — what is *pending* (received friend requests, conversations with unread messages, blocked ones excluded), built from state the app already holds; the backend keeps no notification history. The bell's count is the length of that same list |
| `src/screens/community/` | `CommunityScreen` (tab root), `PostDetail`, `PostCard`/`CommentRow`/`AuthorLine`, `ComposeSheet` (+ `CrisisLink`), `ItemMenu` (delete / report / block on a post or comment) |
| `src/screens/badges/` | `BadgesScreen` (pushed from Profile — not a tab since Community took its place), `BadgeDetail` |
| `src/screens/profile/` | `MyProfile`, `EditProfile`, `Settings` (+ `ThemePicker`), `DataAndPrivacy`, `ForcedRename` (shown instead of the app while a username reset is outstanding) |
| `src/screens/legal/` | `legalContent.js` (the documents' text, in force since 2026-09-28, and the only place to edit them), `LegalDocument` (renders one, reached from Settings, the register screen and the gate — all three show the same page), `ConsentGate` (shown instead of the app while a consent is outstanding), `CrisisResources` + `crisisResources.js` (the numbers the "not medical care" clause points at — the one list in this folder that must be verified, not drafted) |
| `src/screens/moderation/` | `ModerationQueue`, `ReportReview`, `SuspendSheet`, `WarnSheet`, `ProfileSanctionSheet` — admin only; the Settings row that opens them is absent for everyone else |
| `src/screens/admin/` | `AdminDashboard` (the board, with `DayChart` / `StateBars` — see Charts) for every admin; `AdminsScreen` (who is an admin, removing the ones promoted in the app) for official accounts only |

## Tap guards

Nothing in this app is idempotent — two taps on Add friend are two POSTs, two
on Send are two messages, two on a row push the same screen twice — and taps
land faster than React re-renders, so a `sending` state flag set inside the
handler does not stop the second one: both taps read the same state in the same
tick.

`useGuardedCallback(fn, gap)` in `src/ui/guards.js` is the fix, and it is
already wired into the primitives every screen goes through: `Btn`, `Card`
(when tappable), `GoogleButton`, `PersonRow`, `Header`'s back arrow, `LinkRow`,
`SheetAction`, `ToggleRow`. A handler passed to any of those needs nothing
extra. Raw `<button>`s inside a screen do — `ChatThread`'s send, the request
rows, the search result's Add, `StreakHistory`'s pagination, `EditProfile`'s
Save each wrap their own.

It runs `fn` once and ignores further calls until it is safe: `gap` ms for a
sync handler (default `GUARD_MS`, 400), and for an async one the whole time the
request is in flight plus `gap`. It holds refs only, so wrapping an inline
arrow costs no re-render. Two places want a different gap: `ToggleRow` passes
`0`, because flipping a switch back is a real thing to do and only same-tick
taps should collapse — `tests/profile.spec.js` toggles dark mode twice in a row
and a 400 ms gap swallows the second one.

For work a **keystroke** triggers, `useDebouncedValue(value, delay)` is the
other half: the field stays instantly controlled and the expensive part trails
it. `FriendSearch` filters and widens the directory on the settled term, so a
typed word is one search, not one per letter.

`tests/chat.spec.js` fires two clicks in a single tick and asserts one
`POST /messages`.

## Confirmations

**Every action that changes a relationship with another person asks first**:
block, unblock, remove a friend, decline a request, cancel a sent one, ignore
a conversation request. So does anything that cannot be taken back (deleting a
post, a comment, the account; withdrawing health consent). Accepting a request
or adding a friend does not — that is the thing being asked for.

`ConfirmSheet` (`src/components/ConfirmSheet.jsx`) is the one sheet for it, and
`CONFIRM_COPY` holds the words per action, so a block reads the same from a
profile, a post and a comment. The copy says what changes **for the other
person** and whether they are told — the part people do not picture — and every
such sentence is a claim about the backend: unblocking does not restore the
friendship (the row goes to `disabled`), ignoring a chat only deletes the
pending invitation and does not stop a new one.

The button that *opens* a confirmation is not tap-guarded: the request is
guarded by the confirm button (`Btn`), and a guard on the opener swallowed a
second tap made within 400 ms of answering "Keep it".

Unblocking needs somewhere to happen, because a blocked person drops out of
the feed and search: the **Blocked people** row at the foot of the Friends tab (`screens/friends/BlockedPeople.jsx`, the row only while someone is blocked), fed
by the blocked rows `GET /friendships` already returns with `blocked_by`, and
the Unblock button on their profile. `DELETE /users/{id}/block` lifts it; only
the person who blocked may.

**A blocker keeps seeing whom they blocked, and can do nothing with them but
unblock.** `app.jsx` derives two sets from the blocked rows: `blockedIds` (I
blocked them) and `blockedMeIds` (they blocked me). Someone in the first set is
listed in Blocked people, marked "Blocked" in search (no Add), opens to a
profile with only Unblock — named from the row's `sender_user`/`reciver_user`,
since their own `GET /users/{id}` answers 403 to the blocker — and any old
conversation with them is read-only. Someone in the second set drops out of
search, and their conversation is read-only with neutral wording ("You can't
send messages in this conversation"), never "you were blocked". The composer is
closed in the front end because **the backend still accepts a message into a
chat that existed before the block**, in both directions.

## Deployment

The app is served by nginx from inside a single container that also runs the
FastAPI backend — config in `noHarmBack/docker/`. nginx serves the bundle,
proxies `/api/*` to the backend with the prefix stripped, and passes `/ws/*`
through for the Socket.IO upgrade. The bundle is therefore **same-origin with
the API**, which is why `VITE_API_URL` is `/api` and `VITE_SOCKET_URL` is empty.

**Live at `https://noharm.site`**: a single EC2 t3.micro running
`noHarmBack/docker/compose.host.yaml`, where nginx itself holds a Let's Encrypt
certificate (`TLS_MODE=container`). The runbook is
`noHarmBack/docs/operations.md`. The ECS/ALB stack in `noHarmBack/infra/` is
written but **not provisioned**; `TLS_MODE=alb` is its shape, where TLS ends at
the load balancer and the container serves plain `:80`. Neither changes anything
the bundle sees — the browser's leg is https either way, and the routes are the
same file in both.

Two consequences worth knowing before debugging:

- **CORS does not apply to the web build.** Same origin, no preflight. The
  Capacitor app is the only cross-origin client (`capacitor://localhost` on iOS,
  `http://localhost` on Android) and the one that needs `ALLOWED_ORIGINS` on the
  backend to include it. A restrictive value breaks mobile REST and leaves the
  socket working — an asymmetric failure that is confusing without this note.
- **CSP lives in nginx**, not in the app: `noHarmBack/docker/security_headers.conf`.
  Anything the app loads cross-origin (Google Fonts, Firebase sign-in) has to be
  listed there or it is blocked with no symptom but a console error.

The image builds the bundle itself (stage 1 of `noHarmBack/docker/Dockerfile`),
so `VITE_*` values arrive as `--build-arg`. Its build context is the **parent of
both repos** — `noHarm/` and `noHarmBack/` must sit side by side. The deploy
workflow (`noHarmBack/.github/workflows/deploy.yml`) therefore checks out this
repo alongside the backend and passes every `VITE_*` as a build arg; a value
added here has to be added there too, or it compiles to `undefined` and shows up
as a feature that quietly does nothing.

**Releases.** `deploy-host.sh` asks for a tag (`vX.Y.Z`) and release notes
before building, refuses to run with uncommitted or unpushed work in either
repo, and after a healthy deploy tags **both** repos and pushes the tags. The
tag here starts `.github/workflows/release.yml`, which builds the signed APK
with `scripts/build-android-release.sh` (`versionCode` derived from the tag)
and publishes the GitHub Release. `--no-release` deploys without a version.
One-time setup: `scripts/setup-release-secrets.sh`. Full walkthrough in
`README.md`, "Releases".

**App icon and splash** come from `assets/` (committed PNGs, rasterised by
`node scripts/build-app-icons.mjs` through Chromium — never ImageMagick, which
closes the ring). The release script runs `capacitor-assets generate` on them
after creating `android/`; without that step the APK ships Capacitor's default
icon. The app's launcher name is `appName` in `capacitor.config.json`.

**A change here only ships on a backend deploy.** There is no separate
front-end pipeline: pushing to this repo builds nothing, and nothing deploys on
push at all today. Shipping a change to this repo means running
`./noHarmBack/docker/deploy-host.sh` from the directory holding both repos: it
builds the image on your machine — `vite build` needs more RAM than the
instance has — and ships it over SSH.

## Navigation model

Custom stack-on-tabs — no router library:

- `phase`: `'splash' | 'register' | 'login' | 'app' | 'deleted'` — `splash` is
  the installed app's only; on the web the landing page (`public/about.html`)
  takes its place
- `tab`: `'home' | 'friends' | 'chat' | 'community' | 'profile'`
- `stack`: `{ screen, props }[]` pushed over the active tab

Only three navigation primitives: `push(screen, props)` / `pop()` / `resetTo(tab)`.

**Adding a screen**: add a `case` to the `switch (top.screen)` block (overlay screens) or `switch (tab)` block (tab roots) in `src/app.jsx`, implement the component in the appropriate `src/screens/*/` folder.

Overlay screens today: `streakHistory`, `friendRequests`, `friendSearch`,
`publicProfile`, `chatThread`, `postDetail`, `badges`, `badgeDetail`,
`editProfile`, `settings`, `blocked`, `notifications`, `privacy`, `legalDoc`,
`crisis`, `moderation`, `reportReview`, `admin`, `admins`.

**A sheet opened from a tab root needs `<BottomSheet portal>`.** `#nh-stage`
animates with a transform, so it is a stacking context and nothing inside it
can rise above the tab bar: the Community composer slid up *behind* the bar,
buttons and all. `portal` renders the sheet into `#nh-screen`, where the
app-level sheets already live. Pushed screens hide the bar and do not need it.

**Two screens are shown *instead of* the app, not pushed over it**, checked in
`app.jsx` before the stack is read. `ConsentGate` when `me.pending_consents` is
non-empty, then `ForcedRename` when `me.must_change_username` is set — consent
first, because picking a username is using the service and the terms are what
govern that. Both are deliberately inescapable: a prompt someone can dismiss is
one they dismiss, and the state it leaves behind is the state each exists to
prevent.

## Responsive layout

The app is phone-shaped by origin and runs on a desktop browser at
`noharm.site`. One breakpoint separates the two, **900px**, above every phone in
portrait and above a Capacitor webview — so the native builds never cross it and
a tablet does, on purpose.

Almost every style here is an inline `style={{}}` object, and **an inline style
cannot hold a media query**. That single fact shapes the whole approach:

- **A number that changes with the viewport is a CSS custom property** in
  `src/theme.css` (`--nav-w`, `--content-max`, `--pad-x`, `--pad-bottom`,
  `--form-max`, `--badge-cols`, `--master-w`), consumed from inline styles as
  `var(--pad-x)`. The media query lives in one place and a resize costs no React
  render.
- **A change to the markup is `useWide()`** (`src/ui/useBreakpoint.js`) — the
  side rail replacing the tab bar, the chat list and transcript side by side.
  Its `WIDE_MIN` and the `@media` in `theme.css` are two spellings of the same
  number and must stay equal.

Never reach for a third mechanism. Tailwind or CSS-in-JS would fight the
`data-dir`/`data-mode` token system described under Theming.

What the breakpoint actually changes:

| Compact | ≥ 900px |
|---------|---------|
| `TabBar` pinned to the bottom, hidden behind a pushed screen | `SideNav` down the left edge, **kept** while a screen is pushed — a desktop has the room, and a rail that vanished on every chat would be worse than none |
| Notifications is the bell on Home; Settings is the gear on Profile | both are pinned to the foot of the rail, one click from any tab. They push a screen rather than switch tab (`openOver` never stacks a second copy), and the rail marks the open one via `extra` |
| Screens fill the 480px shell | `<Screen>` centres its children in a `--content-max` column; `ChatThread` builds its own frame and centres each of its three bands itself |
| `BottomSheet` slides up, with a drag handle | the same component renders a centred dialog (`role="dialog"`, 460px, no handle) |
| Auth fills the screen, button under the thumb | `<Screen panel>` draws the column as a centred card (`.nh-panel`), and `.nh-thumb-gap` collapses — the gap exists to reach a thumb, and a mouse has none |
| Scrollbars hidden | thin scrollbar returns — with a mouse it is the only sign the page continues |
| Chat list, then the transcript over it | `SplitView`: list and transcript together, `ChatRow` marks the open one |

Three details that are easy to get wrong:

- **The auth panel centres with `margin: auto`, never `justify-content:
  center`.** A centred flex line clips its own overflow at the top, and the
  register form is taller than a 900px window — so the header would become
  unreachable on exactly the screen this layout is for.

- **`--nav-w` is a width, `--nav-offset` is an occupancy.** `--nav-w` stays
  240px on a desktop whether or not a rail is drawn; `app.jsx` sets
  `--nav-offset` on `.nh-root` to the rail's *actual* footprint (0 on splash and
  login, where there is no rail). Everything that aligns to the rail — the
  screen container, `Toast`, `Banner` — reads the offset, never the width.
- **Hover rules are gated on `@media (hover: hover) and (pointer: fine)`, not on
  width**, because the question is what the input device can do. A touch laptop
  past 900px would otherwise leave every row stuck in its hover state after a
  tap. Those rules need `!important` on the properties that collide with an
  element's inline `style`, which outranks any unmarked stylesheet rule.

**Two-pane is chat only**, and the two omissions are deliberate.
`publicProfile` is pushed from four places (friends, chat list, search,
requests), so there is no one list it belongs beside. `reportReview` is not a
pane because opening a report *claims* it and leaving releases it (see
Moderation under Domain rules): a queue permanently beside a claimed report
invites exactly the half-open state that lock exists to prevent.

`Escape` is the desktop's back gesture — it closes the relapse/start-streak
sheet, else pops the stack. It never dismisses the check-in modal or a
moderation notice: those are answered, not escaped.

The Playwright suite has two projects. `chromium` runs everything at Pixel 7
size; `desktop` re-runs the navigation, chat, friends and profile specs at
1440×900 and adds `tests/desktop.spec.js` for what only exists past the
breakpoint. Test helpers address the nav badge by `.nh-tabbadge` and the back
arrow inside `#nh-stage`, because the bottom bar and the side rail nest them
differently.

## The mark

`src/components/Logo.jsx` is the one place the logo's geometry is written down —
`Mark` (the symbol), `Wordmark` (the name) and `Logo` (both, stacked). The ring
is the streak in progress and the check is today, done, which is why the arc is
**open**: a closed circle would say the work is over.

Two variants, and they differ in colour and ground only — **never in shape**:

| Variant | Where | Why it differs |
|---------|-------|----------------|
| `plain` | splash, side rail, auth, gates | track at 0.22 opacity, which is what reads on a page background |
| `tile` | app icon, the browser tab, any ground the mark does not control | mark reversed in `--on-primary` on a `--primary` square, radius 22.5% of the side; the track goes to 0.32 or it disappears against the fill |

There was a third, `mini`, which dropped the ring below ~32px where its gap
closes up. It is gone, and `public/favicon.svg` with it: **the tab points at
`icon.svg` like everything else**. The simplification read better at 16px and
cost more than it bought — the tab is where the icon is seen most often, and a
logo that changes shape by size is two logos.

The exported masters live beside the generated files, all in `public/` because
that is the only directory Vite serves — a `static/` folder next to it ships
nothing:

| File | What it is |
|------|------------|
| `noharm-mark.svg` | the mark alone, the master these were all cut from |
| `noharm-lockup.svg` | mark + wordmark, horizontal |
| `noharm-lockup.png` | the same, rasterised **with Figtree applied** |
| `icon.svg` · `icon-192.png` · `icon-512.png` · `apple-touch-icon.png` | the tile — the tab, the manifest and the home screen all point here |
| `og-image.png` | the link preview |

**The lockup SVG sets the wordmark in `<text>`.** Anywhere Figtree is not
loaded — a preview renderer, an app store listing, an email — it falls back to
Arial and draws a visibly different logo. That is why `og:image` points at the
PNG and not at the SVG, and why the PNG exists at all.

The inline lockup at the top of `public/terms.html` / `public/privacy.html` is a
third copy on purpose: those pages carry no stylesheet and make no network
request, so an `<img>` to the icon file would break the guarantee that they
render on a reviewer's machine with nothing cached.

The PNGs are rasterised **through Chromium**, not ImageMagick: `convert` drops
`stroke-dasharray`, which closes the ring and quietly ships a different logo.

Colours in the standalone files are hex, not the app's `oklch` tokens: a tab
icon and an app-store page are rendered by tooling far older than the app's
browsers, and a colour they cannot parse comes out black.

`tests/navigation.spec.js` guards all of it — every icon and logo file the head
and the manifest name answers 200, `icon.svg` still carries both circles (a
re-simplified tab icon fails), `/favicon.svg` is asserted to be **gone**, the
check path appears in the app, in all three SVGs and in both public pages (so a
logo edited in one place only fails), and `og:image` is asserted not to be an
SVG.

## Charts

`src/screens/admin/` holds two: `DayChart` (daily counts over a window) and
`StateBars` (the three ways an account stops being in use). Five decisions are
worth keeping:

- **Columns, not an area or a line.** A day's sign-ups are discrete events. A
  line drawn between two days claims the value passed through everything
  between them, which for `0, 0, 3, 0` is a claim the data does not make.
- **Two charts, never one with two y-axes.** Sign-ups and reports differ by an
  order of magnitude; a second scale invents a correlation that is not in the
  data. Separate plots, one axis each.
- **Colour is `--primary`**, the theme's own hue, so the chart follows all four
  themes with no second palette to keep in step. It clears 3:1 against the card
  surface in every one of them — the check that applies to a lone series. The
  chroma-floor and lightness-band checks are scoped to *categorical* palettes,
  where several hues have to stay apart from one another and from gray; there
  is one hue here.
- **Every chart has a table view**, and only the busiest day is labelled. A
  number on every column goes unread, and identity never rests on being able to
  see the shape.
- **`StateBars` gives all three bars one hue.** Disabled, deleted and banned are
  nominal categories with no order between them; colouring them
  darker-where-bigger would encode bar length twice and burn the only free
  channel on what the chart already shows. Three bars is few enough to
  direct-label every value, which keeps the numbers reachable without hovering.

The period filter is **one row above the charts**, presets only (7 / 30 / 90) —
nobody reaches for "the last 37 days" — and it scopes everything below it. A
change refetches while the charts **hold their previous render at 40% opacity**:
no skeleton, no layout jump, no flash. The server cache is keyed by period, or
switching the range would hand back the previous window's numbers under the new
label.

The series come from the backend with **every day present, zeros included**
(`AdminService._compute` → `countCreatedPerDay`). Filling the gaps server-side
keeps one description of the window; a client that filled them would be a second
place for the window length to drift.

## Theming

Two visual directions × two modes = four combinations:

- **sage** light/dark — Figtree (humanist sans), muted green
- **dawn** light/dark — Spectral (soft serif), warm clay

Switched at runtime via `data-dir` and `data-mode` attributes, set on **both
`<html>` and `.nh-root`**. All three are user settings, under Settings →
Appearance: the theme dropdown (`screens/profile/ThemePicker.jsx`), the Dark
mode switch and the Animations switch (`data-reduce-motion`, which stills the
background and the confetti). The dropdown is a WAI-ARIA listbox — arrows,
Enter, Escape (stopped there, so it does not also pop Settings), click outside
— and every entry, the button included, draws a miniature of its theme with
its own `data-dir`/`data-mode`. That previews the real theme only because the
tokens are attribute-only selectors (below). Adding a theme is a token block
in `theme.css`, an entry in `THEMES` there, and the value in `TWEAK_OPTIONS`
(`app.jsx`) and in the pre-paint script in `index.html`.

CSS tokens live in `src/theme.css` under attribute-only selectors —
`[data-dir="sage"][data-mode="light"]`, not `.nh-root[…]`. That is deliberate
and load-bearing:

- **The document has to resolve `--bg` too.** Screens fade in (`nhScreenIn`
  animates `opacity: 0 → 1`), and during that fade whatever is behind them is
  visible. If the tokens are scoped to `.nh-root`, `body` cannot see them —
  custom properties inherit downward, and `.nh-root` is a *descendant* of body —
  so `body { background: var(--bg, <light fallback>) }` paints the fallback and
  every screen change in dark mode flashes white. A transparent background is
  the same bug: the browser paints its own white canvas underneath.
- Prefixing a token block with `.nh-root` again reintroduces exactly that.
  `tests/profile.spec.js` guards it by asserting `--bg` resolves on `<html>` and
  that `body`'s computed background is neither transparent nor different from
  the token.

**Persistence**: `direction`, `mode` and `motion` are stored in `localStorage`
under `nh_tweaks`. `loadTweaks()` in `src/app.jsx` validates every stored value
against an allowlist before it reaches the DOM, and an inline script at the top
of `<body>` in `index.html` applies `data-dir`/`data-mode` **before first
paint** so a reload does not flash light. That script and `loadTweaks()` read
the same key and must stay in sync.

Only in `npm run dev` does the very first frame still flash: `theme.css` is
injected by the module script there, while the production build emits a
render-blocking `<link>` in `<head>`.

## Notifications architecture

Two notification paths coexist:

- **Web** (`services/notifications.js`): Browser Notification API. Skips when tab is visible (in-app toast handles it).
- **Native** (`services/push.js` + `services/checkinReminder.js`): Capacitor. `push` → FCM for real-time events (backend sends via FCM). `checkinReminder` → LocalNotifications for the scheduled 9 PM daily prompt.

`useNotifications(meId, prefs)` in `src/store/` unifies both: listens to the same WS events, dispatches to the right platform. FCM token is registered via `services/api/device.js` → `POST /notifications`, **with the push categories** (`messages`, `friends`, `community`) taken from the Settings switches — `community` has to be sent explicitly, because the server defaults it to on — and re-registered whenever one changes; master off unregisters it. The server filters on them, which is the only way a switch can affect a push sent while the app is closed. The listeners read prefs through a ref — the effect subscribes once per account, and a closure would keep the values from the first render.

Notification IDs must not collide: checkinReminder uses 1001; message notifs use 2000–2999; friend events use 3001–3002.

## Domain rules

See `noHarmBack/docs/FRONTEND_DESIGN_BRIEF.md` for full API shapes. Key invariants:

- **Streak**: one active at a time; **it never expires** — a missed check-in changes nothing on the server, and only a relapse (`POST /streaks/end`) ends a streak, immediately starting a new one. The check-in modal is the app asking about the days since the last check-in, by **local** calendar day.
- **Check-ins are not counted.** Duration comes from `start_at`/`end_at`, and
  `updateLastCheckin` is a plain assignment of "now" — so N check-ins do exactly
  what one does. Never loop one request per elapsed day to backfill a
  backdated streak: `POST /streaks/checkin` is capped at 10/minute, so anything
  past ten days 429s partway through, *after* the streak was already created,
  and the retry then fails with 409 `STREAK_ALREADY_ACTIVE`. Badges are granted
  server-side by `startStreak` from `start_at`, so backfilling earns nothing
  either. `src/store/useStreak.js` sends **one** conditional check-in;
  `tests/streak.spec.js` covers a 30-day backdate to keep it that way.
- **Consent gates the app, and health-data consent gates the tracker.**
  Registration sends a birth date and three separate answers
  (`acceptedTerms`, `acceptedPrivacy`, `healthDataConsent`); the backend refuses
  without the first two and below `MINIMUM_AGE_YEARS`. The third is a real
  choice: declining creates a working account with the streak tracker off, and
  `POST /streaks/start` answers 403 `HEALTH_CONSENT_REQUIRED` until it is given.
  Withdrawing it (Settings → Privacy & data, or the gate) **deletes every
  streak**, history and personal record included, with no undo — so both places
  confirm first, and `app.jsx` refetches the profile *and* the streak
  afterwards.
- **A consent is answered, never toggled.** The register screen and the gate use
  `Checkbox`, not `ToggleRow`: a switch is a setting you change, and a switch
  that happens to be on is not something anyone agreed to.
- **The app never names a document version.** `POST /users/me/consents` sends
  document keys only; the server stamps whatever revision is live. The version
  shown on `LegalDocument` comes from `GET /users/me/consents` → `versions`,
  never from `legalContent.js` — two local sources of "which revision is this"
  is how an app shows one text and records agreement to another.
- **The documents live in two places and must be kept in step**:
  `src/screens/legal/legalContent.js` for the in-app screens, and
  `public/terms.html` / `public/privacy.html` for the copies served without a
  login. The second pair is not optional — an app store review needs a privacy
  policy at a URL anyone can open, and nginx (`app_locations.conf`) rewrites
  `/terms` and `/privacy` to them. The public pages are **generated from
  `legalContent.js`**, never edited by hand — a change means editing the
  content, regenerating both pages (`npm run legal`), and bumping the matching version in the
  backend config, which is what asks every existing account to accept it.
  Every sentence in them is a claim about the backend (retention days, the
  200-character push, the 20 messages a report copies); change one of those
  and the document is wrong until it is edited too. There is deliberately no
  postal address: the controller is a natural person, and the contact the LGPD
  asks for is `contact@noharm.site`. Appeals go to `support@noharm.site`
  (`VITE_SUPPORT_EMAIL`). Both are ImprovMX aliases on the domain.
- **`public/about.html` is the web's front door** (`/about` via nginx, and the
  same rewrite in `vite.config.js` for dev), and the "App home page" on the
  Google OAuth consent screen. `src/main.jsx` sends a visitor — web, no
  session, at `/` — there before React renders; its buttons come back as
  `/?start=register` / `/?start=login`, which `app.jsx` opens directly and then
  strips. The reverse holds too: a signed-in visitor (an `nh_access` token)
  opening `/about` is sent back to `/` by `public/about-redirect.js` — a
  same-origin file, because the CSP allows no inline script. Every "back to
  the start" on the web (back from auth, logout, the
  session ending, "Start over") goes to it too, via `toFront`. **Never in the
  installed app** or an installed PWA (`src/landing.js`): the native shell has
  no `/about`, and the splash stays its front door. Hand-written, not generated
  — its "Your data" summary repeats claims from the Privacy Policy, so a change
  to one is a change to both. Tests enter the app at `/?start=login` for the
  same reason a visitor does not stay on `/`. It also says NoHarm is **open source**, which
  rests on both GitHub repositories being public (this one MIT, the backend
  Apache 2.0) — making either private makes the page false.
- **Crawlers get three files in `public/`**: `robots.txt` (keeps `/api/`,
  `/ws/` and the `?start=` links out), `sitemap.xml` (the three public pages
  only — bump `<lastmod>` when one changes) and `llms.txt` (a plain summary
  for LLMs, restating claims from the landing page, so it goes stale with
  it). `terms.html` / `privacy.html` carry a canonical link because nginx
  serves each at two URLs; `build-legal.mjs` leaves the head alone, so it
  survives `npm run legal`.
- **Official and Admin marks are the backend's call.** Every user object
  carries `role` — `"official"` (`OFFICIAL_USER_IDS`), `"admin"`
  (`ADMIN_USER_IDS`, or promoted by an official account) or null — and `RoleBadge` draws it in rows, the chat
  header and both profiles. Display only: moderation access is still the
  `useModerator` probe. `user_<id>` cache entries never expire, so
  `cachedUser()` treats one without a `role` key as a miss.
- **A conversation with the official account is read-only.** `ChatThread`
  checks `chat.official` (backend-derived) against `meRole`: the other side
  gets a notice at the top of the thread and a "can't reply" line in place of
  the composer, never an accept/ignore prompt, and `PublicProfile` hides
  Message on an official profile. The backend refuses the reply anyway
  (`OFFICIAL_CHAT_READONLY`). The official account itself gets a "Message
  everyone" row in Settings (`BroadcastSheet` → `POST /messages/broadcast`),
  shown on `me.role === "official"`, beside **Administrators** (`AdminsScreen`).
- **Official accounts are admins, and the only ones who make admins.** An
  official account passes every admin route. On someone else's profile its ⋯
  menu offers *Make admin* / *Remove as admin* (`onSetAdmin` in `app.jsx` →
  `POST`/`DELETE /admin/admins/{id}`), and `AdminsScreen` lists every admin with
  where the access comes from. Only the ones promoted in the app can be removed
  there — the others are set in the server config. A newly promoted account sees
  the moderation rows after its next sign-in or reload: `useModerator`'s probe
  is remembered for the session.
- **Friendship status codes**: 2=deleted, 3=blocked, 4=pending, 5=accepted, 6=ignored (a rejected request).
- **Reporting is private and inert.** `POST /reports/{userId}` takes one of six
  reasons (`services/api/report.js` holds the list and its copy) plus up to 1000
  optional characters. The reported user is never notified and can never read a
  report about them, so the sheet says so — that promise is what makes people
  file one. A report changes nothing else: it does not block, unfriend or notify,
  and blocking stays the separate action offered beside it in the profile sheet.
  A second report about the same person while the first is unreviewed comes back
  409, which `ReportSheet` shows inline rather than as a failure.
- **A report carries the conversation, as an id.** When the reporter and the
  reported user have a chat, `app.jsx` finds it in `chatList` and passes its id
  as the fourth argument to `reportUser`; the backend copies that chat's last 20
  messages into the evidence attached to the report. Only the id travels —
  there is no parameter for message text and the backend refuses a body field
  carrying any, because a reporter must never be able to attribute invented
  lines to someone. Nothing in the app reads that copy back: it is a
  moderator's, and `GET /reports/{id}/evidence` answers 404 to everyone else,
  the reporter included.
- **Chat**: friends-only, 1-on-1 — except an official account, which can open a chat with anyone. Lifecycle: pending → enabled → disabled.
- **Messages**: text only, max 2000 chars — enforced by the backend on both REST and the socket (`MESSAGE_TOO_LONG`). Status 7=unread, 8=read.
- **Emoji.** Plain Unicode in the text — the backend stores and sanitises it
  like any other character. `EmojiPicker` is a small hand-picked set, no
  dependency, drawn **inline** (it takes room above the field rather than
  floating, so it never lands under a sheet edge or the keyboard), with a
  per-device Recent row in `nh_emoji_recent`. It sits in the chat composer, the
  comment field and the post composer. **Limits count code points, never
  `.length`**: the backend's `max_length` is Python's `len()`, an emoji is two
  UTF-16 units, and `.slice(0, MAX)` could cut one in half — a lone surrogate
  the API cannot encode. Every capped field goes through `clampText`, every
  counter through `textLength`. A message of one to three emoji only is drawn
  large without a bubble (`bigEmojiCount`). Font stacks end in the colour-emoji
  fonts so Linux renders them in colour.
- **Auth**: Firebase identity + app JWT. Access token 15 min, refresh 7 days. `connectors/api.js` handles the silent refresh automatically on 401.
- **Google sign-in differs by platform, the token does not.** The web uses
  `signInWithPopup`. The installed app cannot — in a WebView the popup opens in
  the system browser, which has no way back, and the login waited for ever — so
  `fbLogin()` uses the native account picker (`@capacitor-firebase/authentication`,
  Credential Manager on Android) and hands its Google ID token to the JS SDK's
  `signInWithCredential`. Either way the backend receives the same Firebase
  `idToken`. `skipNativeAuth` (`capacitor.config.json`) keeps the native SDK
  signed out; `fbLogout()` clears the native account too, or the next sign-in
  would silently reuse it. Requires the signing key's SHA-1 on the Android app
  in the Firebase console, and `rgcfaIncludeGoogle = true` in
  `android/variables.gradle` (the release script writes it). Closing the picker
  maps to `auth/popup-closed-by-user`, which the screens treat as a silent cancel.
- **Moderation is a screen in the app, not a separate tool.** Settings shows a
  "Reports" row only for an administrator (`ADMIN_USER_IDS`, an official
  account, or one an official account promoted), and `src/screens/moderation/` is what it opens: the queue (open /
  actioned / dismissed), then one report with the evidence captured when it was
  filed — the profile snapshot and the conversation, both sides, as a
  transcript. **There is no "am I an admin" endpoint on purpose**: every
  moderation route answers 404 rather than 403, so `useModerator` probes the
  queue once per session and hides the row on failure. Opening a report
  *claims* it and leaving without deciding releases it, so a second moderator
  is never reading the same conversation; reading the evidence is logged
  against the moderator. Suspending and closing are two buttons because they
  are two decisions — closing a report never touches an account.
- **Two reports are about the profile, not the conduct.** An impersonating
  username and a picture that does not belong beside a recovery conversation
  are not answered by the warn/suspend ladder: a ban is far too much for a
  handle and a warning is far too little, because it leaves the thing exactly
  where it is. `ReportReview` offers two more actions for `impersonation` and
  `inappropriate` only — resetting the username and removing the picture — and
  draws the captured profile as a profile, the photo and the name at a size a
  moderator can actually judge, rather than as "Picture: set". A username reset
  renames the account **immediately** to `user_xxxxxxxx`; `must_change_username`
  then makes `app.jsx` show `ForcedRename` instead of the app until a real name
  is chosen, with no tab bar, no side rail and no check-in modal. Choosing one
  is the only thing that lifts it. A blocked picture is refused by `PUT
  /users/me` — which is why `putMe` sends only the fields that changed — and
  cannot come back from the Google account at the next sign-in either. Neither
  sanction bans, limits or touches the streak, the friends or the history.
- **The queue names the reporter; the reporter's own list never does.**
  `reporter_username` is on `ModeratedReportResponse` and nowhere else. The
  promise of anonymity is owed to the *reported* user; a moderator cannot weigh
  a complaint without knowing whether the same person filed the last four, and
  a uid does not tell them that.
- **Withdrawing health consent turns the tracker off, not the account.** The
  dashboard's empty state reads `me.health_data_consent`: with it withdrawn it
  says "Tracking is off" and offers Privacy & data instead of "Start my streak",
  which could only ever answer 403 `HEALTH_CONSENT_REQUIRED`. The way back is
  that screen and not a shortcut here — a second consent prompt is a quieter
  version of the same question. The copy also says the deleted streaks are not
  coming back, because they are not.
- **Moderation talks back.** `useNotices` fetches what moderation has said to
  this account and `NoticeSheet` shows it over everything on open — **before
  the check-in modal**, because being asked "all clean today?" with an unread
  warning waiting is the wrong order. A warning changes nothing about the
  account and the copy says so; a suspension notice waits until the account
  comes back, which is the only moment it can be read at all. The sheet never
  names who reported them (the API does not carry it) and always says where to
  appeal — `VITE_SUPPORT_EMAIL`, also on a refused sign-in.
- **A suspended account is paused, not gone.** Moderation can ban for a fixed
  window: signing in then answers 403 `ACCOUNT_SUSPENDED` with
  `details.suspendedUntil`, where a permanent ban is still `ACCOUNT_BANNED`.
  `LoginScreen` reads the date and says "paused until <date>" — telling someone
  serving three days that their account is gone is a different message than the
  truth, and this app's accounts hold a streak and a friend list. The ban lifts
  itself on the first sign-in past the date, so nothing here has to poll.
- **Account deletion is reversible for 30 days.** `deleteMe()` soft-deletes; the
  backend keeps the row for `ACCOUNT_DELETION_GRACE_DAYS` and a cron purges it
  after. Signing in during the window returns 403 `ACCOUNT_PENDING_DELETION`
  with `details.deletionScheduledAt`; `signIn`/`signUp` re-throw that error with
  the Firebase `idToken` attached, and `LoginScreen` offers the restore sheet
  that calls `reactivate(idToken)`. The window is stated to the user on the
  delete confirmation and on the farewell screen — `VITE_DELETION_GRACE_DAYS`
  feeds that copy and must match the backend. Never present deletion as
  immediate: the copy said "Delete forever" while the backend kept everything,
  and that mismatch is the thing being fixed, not a detail to restore.
- **Three sockets per account; the newest wins.** A fourth device connects
  normally and the backend drops the oldest, telling it `session_replaced`.
  socket.io does not reconnect after a server-side disconnect, so
  `connectors/socket.js` waits for that tab to become visible again before
  reconnecting — reconnecting at once would evict the device being used.
- **Log out of all devices** (Settings → Account) calls `POST /auth/logout-all`,
  which refuses every token of the account and disables its push devices. On
  failure the session is kept and a toast says so: clearing it anyway would
  claim the other devices were signed out.
- **Socket.IO replays nothing it missed.** A `new_message` or `friend_*` event
  emitted while the socket was down — or before the first handshake finished,
  which is every cold start — is simply gone, and the screen keeps the state
  from before: an unread badge that never appears. `services/ws/connection.js`
  → `onSocketReady` fires on every successful handshake, and `useChats` /
  `useFriends` refetch over REST there. Connecting is the one instant the
  client knows it has a gap. Cost: one extra fetch per connect, including the
  silent token refresh every 15 minutes.
- **Posts (Community)** — contract in `noHarmBack/docs/POSTS_PLAN.md`, where
  decisions D1–D8 are argued. Text only (post 1000, comment 500). The author
  picks the audience per post, `friends` or `community`, and the composer
  starts on `friends` every time. No editing. Like and unlike are `PUT` /
  `DELETE` — idempotent, never a toggle. Any 404 on a post means *gone for
  this viewer* (deleted, removed, author blocked or suspended), so the item is
  dropped with a toast, never an error screen. A report about a post or a
  comment is still a report about its author: `reportUser(userId, reason,
  details, { chatId, postId | commentId })`, ids only. Blocking from the feed
  goes through `blockUser(userId)` when there is no friendship to name — a
  stranger has none, and `POST /friendships/{id}/block` needs one. The feed
  is not live: it refreshes on every visit to the tab.
- **WebSocket** (Socket.IO): JWT-authenticated at connect. Events: `chat` (join/leave/send/mark_read/typing), `presence` (get_online_status/online_status), friend notifications (friend_request/accept/reject/remove/block/unblock).
