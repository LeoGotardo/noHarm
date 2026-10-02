# E2E tests — NoHarm

Playwright suite automating the checklist in
[`TESTING.md`](../TESTING.md). Runs against the real app (Vite on `:5173`) and
the real backend (`:8080`).

```bash
npm run test:e2e            # run everything (headless)
npm run test:e2e -- --ui    # interactive mode
npm run test:e2e:report     # open the last HTML report
npx playwright test tests/chat.spec.js          # a single file
npx playwright test -g "Relapse"                # by name
```

Prerequisites: backend on `http://localhost:8080` (`docker compose up`) and
nothing else — Playwright starts `npm run dev` itself if it isn't already up.
Override with `E2E_API_URL`, `E2E_SOCKET_URL` and `E2E_WEB_URL`.

> **If `:5173` is already taken by another project, the suite tests that other
> project.** `reuseExistingServer` reuses whatever is listening on the port
> without checking that it is this app — the failures look like bugs from here,
> and the snapshot shows a screen that does not exist in this repo. When that
> happens: `npm run dev -- --port 5180` and
> `E2E_WEB_URL=http://localhost:5180 npm run test:e2e`.

If the backend comes up from a stale image, run `docker compose up -d --build`:
without the rebuild the container runs a previous `CMD`, without
`alembic upgrade head`, and — since nothing else creates schema at startup — the
database stays empty and every test fails at registration.

The browser no longer talks to the backend directly: the app uses relative URLs
(`/api`, `/ws`) and the dev server proxy (`vite.config.js`) mirrors the routes
nginx serves in production (`noHarmBack/docker/app_locations.conf`). The Node
helpers still hit `E2E_API_URL` directly, bypassing the proxy.

`tests/reports.spec.js` covers the report system on its own: the sheet, the
privacy promise it makes, the duplicate and failure paths, the evidence
captured with a report, and the endpoints behind all of it. Three things it
assumes about the environment — the throwaway accounts are never in
`ADMIN_USER_IDS` (which is why `GET /reports` must answer 404); the one account
that *is* on that list has the uid `e2e-moderator`, named in the backend's
`docker/compose.yaml` and reached through `asAdmin()` in `helpers/api.js`
(override with `E2E_ADMIN_UID`); and both `details` and the captured evidence
are encrypted at rest, so they are only ever read back through the API, never
straight from `tb_10` / `tb_11`.

`asAdmin()` registers that account once and logs in on every later call, and it
is **never deleted at teardown** — a deleted uid inside its 30-day grace window
cannot log back in, so dropping it would break the next run. `asSecondAdmin()`
(`e2e-moderator-2`, `E2E_ADMIN_UID_2`) is the same thing for the collisions a
single moderator cannot produce: the report lock only means anything with two
of them, and `tests/moderation.spec.js` needs both.

During the socket tests the dev server logs
`[vite] ws proxy socket error: ECONNRESET`: that is teardown closing the socket
abruptly, not a failure.

## How the suite works around Google login

`RegisterScreen` / `LoginScreen` open a Google popup, which Google blocks under
automation. And `POST /auth/login` / `/auth/register` no longer take
`{uid, email}`: they take `{idToken}` and pass it to
`firebase_admin.auth.verify_id_token` — uid, email, `email_verified` and photo
come from the verified claims, not from the request body. Sending
`{uid, email}` today is a `422`; sending a token from another project is a `401`.

What makes the suite possible is **firebase-admin's own emulator mode**: with
`FIREBASE_AUTH_EMULATOR_HOST` set, it skips the signature and expiry checks but
still requires `aud == <project_id>`,
`iss == https://securetoken.google.com/<project_id>` and a non-empty `sub`.
`fakeIdToken()` in `helpers/api.js` builds a three-segment JWT with those
claims — any signature will do, since nobody verifies it in this mode.

> **Warning:** `FIREBASE_AUTH_EMULATOR_HOST` is a total authentication bypass —
> anyone can authenticate as anyone. It is for dev and test only (the backend's
> `docker/compose.yaml`). Never in production. The backend logs a warning at boot
> when the variable is set.

Each test registers a throwaway account over REST with one of these tokens,
writes `nh_access` / `nh_refresh` into `localStorage` and reloads the page: that
is exactly the state the app is in after a real login. The account is deleted at
teardown.

The expected `project_id` comes from `E2E_FIREBASE_PROJECT_ID` (default
`noharm-6cc9d`) and must match the backend's `FIREBASE_PROJECT_ID`. If it does
not match, register returns `401`; if the backend container is missing
`FIREBASE_AUTH_EMULATOR_HOST`, the token fails signature verification and
returns `401` — or `503` `AUTH_UNAVAILABLE`, if it also has no service account
credential.

Consequence: none of your own accounts are used, and none of the throwaway ones
survive the run — see "State the suite leaves in the database".

## Rate limit: why there is a counter `FLUSH`

The backend limits **all** routes to 240 requests/minute per IP
(`RATE_LIMIT_MAX_REQUESTS`), with a 60 s window kept in Redis under `rl:*`, on
top of tighter per-route limits. One screen load costs ~10 requests, so the
whole suite does not fit in a single bucket.

The old suite forged an `X-Forwarded-For` per test to get its own bucket. That
only worked because the header was accepted from any origin — a hole the backend
has closed: it is now only considered if the peer is in `TRUSTED_PROXIES`.
Forging the header became a no-op (or, worse, works only on your machine, where
the Docker bridge is on the list).

Instead, `helpers/ratelimit.js` zeroes the counters before each test, via an
`auto` fixture in `helpers/fixtures.js`:

```bash
docker exec redis_cache redis-cli --scan --pattern 'rl:*' | xargs -r redis-cli DEL
```

It deletes **only** `rl:*`, never `FLUSHDB`: the same Redis holds the presence
registry and the per-user socket sets (`ws:conns:*`, which cap each account
at three sockets), and a flush from one worker would corrupt that data for
the others mid-run. Deleting another worker's counter is harmless — it only
grants more quota, it never invalidates an assertion.

Running against a remote backend there is no container for `docker exec`: the
reset is skipped with a warning and the suite runs in a single bucket. Use
`E2E_REDIS_CONTAINER` if the container has a different name.

## Tests marked `test.fail()`

None today. The convention still holds for when a backend bug shows up that
cannot be fixed from the app side: the test describes the **correct** behavior,
gets `test.fail()` and a `KNOWN BUG` comment, stays green while the bug exists
and starts failing — as a heads-up — the day someone fixes it. That is exactly
how the six bugs below surfaced as fixed.

## Findings

### Backend — fixed

Every bug the suite catalogued has been resolved, and the corresponding tests
became positive assertions:

| Bug | State |
|---|---|
| `POST /streaks/end` always 500 (relapse broken) | ends the streak and opens a new one, including with a backdated `end_at` |
| `PUT /users/me` does not persist | persists |
| WS never emits `new_message` | emits, for both REST and socket sends |
| `DELETE /badges/{id}` 500, leaving a ghost badge | deletes, and it disappears from `GET /badges` |
| deleted account remained authenticable | `GET /users/me` returns 403 `Account not found.` |
| badges never granted | granted on `POST /streaks/start` and `/streaks/checkin` |

### Backend — open

None.

### Frontend — open

None.

### Frontend — fixed since

- **Socket refusal codes** (`src/connectors/socket.js`) — `missing_token`,
  `invalid_token`, `account_unavailable` and `too_many_connections` (only from
  an older backend: the current one evicts the oldest socket with
  `session_replaced` instead of refusing) each have
  their own answer now: refresh once, end the session, back off 30 s, or stop.
  Socket.IO's five blind retries only survive for the cases where retrying can
  actually work.
- **A sent message rendered twice** — `send` refetches the thread after the
  POST, and the server echoes the message to the sender's own socket too. The
  thread appended whatever arrived second, so the sender saw their own line
  twice; the chat list had always deduped on `last_message.id` and the thread
  now does the same on `message.id`. Covered by "a sent message appears once,
  however the echo and the refetch race" in `chat.spec.js`.
- **Events missed while the socket was down** — Socket.IO replays nothing, so a
  message delivered before the first handshake (every cold start) left an unread
  badge that never appeared. `services/ws/connection.js` → `onSocketReady`
  fires on every handshake and `useChats`/`useFriends` refetch there. Covered by
  "a message that lands before the socket is live still shows up" in
  `realtime.spec.js`, which holds both the REST response and the handshake so
  the refetch is the only path that can produce the badge.

### Contract changes

**`milestone` became an integer.** It stopped being a date-time and became a
count of clean days. `tests/badges.spec.js` was rewritten on top of that, and the
comments in `src/services/badges.js` and the badge screens were updated. The
defensive handling in `milestoneDays()` is still there, now as a guard against a
malformed badge — not as the expected contract.

**`X-Forwarded-For` only counts coming from `TRUSTED_PROXIES`.** See the rate
limit section above.

**`/auth/login` and `/auth/register` take `{idToken}`.** They used to take
`{uid, email}` and trust them — and since the Firebase uid is public
(`UserResponse.id` appears in the friend list and in search), you could log in as
any user. The backend now verifies the ID token and takes identity from the
claims. `src/connectors/firebase.js` returns `idToken` alongside the popup
result, and `src/services/api/auth.js` sends only that.

**Socket event delivery no longer depends on the chat room.** `new_message`,
`messages_read` and `message_read` go to each participant's personal room
`user_<id>`, delivered exactly once with or without `join_chat`. `join_chat` is
still required **only** for `typing_indicator`, which still goes to the chat room
with `skip_sid` — which is why `tests/chat.spec.js` still calls `joinChat` before
emitting `typing`.

**Presence is multi-device and cross-instance.** `get_online_status` reads from a
registry in Redis; the `online_status` format has not changed.

**Per-user socket limits:** `send_message` 30/min, `typing` 60/min.

### Frontend — fixed

| Problem | Fix |
|---|---|
| date-time `milestone` treated as days → no badge ever earned | earned state now comes from `GET /user-badges/` (`services/badges.js`, `store/useBadges.js`) |
| `NaN days to go` and raw ISO on the medallion | `milestoneDays()` returns `null` when the milestone is not a day count; the UI hides the count |
| badge description did not render | `badgeDescription()` accepts `description` and `desc` |
| friend search only saw 20 users | the pool paginates on demand as the user types, with a "Searching…" state |
| check-in button unreachable | the modal only opens when there are open days; the server's `last_checkin` became the source of truth |
| check-in/relapse failure showed a success toast | `useStreak` re-throws the error |
| "Past streaks" with no past streaks | the header only appears with a non-empty list |
| typing was never sent | `ChatThread` emits `setTyping` with a debounce |
| "Sent" tab unreachable | requests button in the Friends header |
| dead links in Settings | marked "Soon" and disabled |
| `personalRecord` was `NaN` | `GET /streaks/record` returns `start_at`/`end_at`; `app.jsx` was reading `start`/`end` |
| backdated streak ≥ 11 days: 429, streak did not appear and badges seemed not to arrive | `useStreak` sent one check-in per elapsed day; `/streaks/checkin` is 10/min, and the 11th blew up **after** creating the streak and aborted before `saveStreak()`. Check-ins are not counted (duration comes from `start_at`, and `updateLastCheckin` is an assignment), so it became **one** conditional check-in; the badges already came from the server on `start`. Regression: 30-day backdate in `streak.spec.js` |
| dark mode flashed white on every screen change | theme tokens lived only on `.nh-root`, a descendant of `body` — `body { background: var(--bg, …) }` never resolved and painted the light fallback behind the `nhScreenIn` fade. Selectors became `[data-dir][data-mode]`, applied to `<html>` as well. Covered in `profile.spec.js` |
| theme did not survive a reload | `direction`/`mode`/`motion` persist in `nh_tweaks`; an inline script in `index.html` applies them before first paint, with an allowlist of values |

## State the suite leaves in the database

**None.** `playwright.config.js` runs `tests/global-setup.js` before the suite
and `tests/global-teardown.js` after it; both call `purgeE2EData` in
[`helpers/cleanup.js`](helpers/cleanup.js), which deletes every row whose uid
starts with `e2e` — accounts and, through their foreign keys, streaks,
friendships, chats, messages, user badges, tokens and moderation notices, plus
the two tables that deliberately survive an account (`tb_7` audit logs and
`tb_10` reports, both ON DELETE SET NULL) and the evidence hanging off those
reports.

It runs **before** as well as after, because a run killed with Ctrl-C never
reaches a teardown and nothing else in the system would ever remove those rows.

Why SQL and not the API: `DELETE /users/me` is a **soft** delete — status 2 and
a clock, kept for `ACCOUNT_DELETION_GRACE_DAYS` so a real person can change
their mind — and the only hard delete in the codebase is
`jobs/purgeAccounts.py`, which refuses anything inside that 30-day window. A
suite that only called the endpoint left every account it ever made: 3,246 of
them, with 2,797 audit rows, before this existed. That is also a directory the
friend-search tests have to page through and a moderation queue with thousands
of entries.

`DELETE /badges/{id}` is a soft delete too, and the badge catalogue is global,
so `badges.spec.js` left its own catalogue behind on every run — invisible to
`GET /badges`, permanent in `tb_5`. The sweep removes status-2 badges (and the
awards pointing at them, whose foreign key does not cascade), which in a test
database is residue by definition.

The moderator accounts (`e2e-moderator`, `e2e-moderator-2`) go with everything
else. That is only safe because it is a hard delete: a soft-deleted uid cannot
register or log in again inside its grace window, so the next run would find a
moderator it could no longer become.

Running against a remote backend there is no container to `docker exec` into.
The sweep warns once and skips, and this is the purge to run by hand:

```bash
docker exec postgres_db psql -U root -d noharm-db -c "
  DELETE FROM tb_7 WHERE cl_7c LIKE 'e2e%';
  DELETE FROM tb_11 WHERE cl_11b IN (SELECT cl_10a FROM tb_10 WHERE cl_10b LIKE 'e2e%' OR cl_10g LIKE 'e2e%');
  DELETE FROM tb_10 WHERE cl_10b LIKE 'e2e%' OR cl_10g LIKE 'e2e%';
  DELETE FROM tb_12 WHERE cl_12b LIKE 'e2e%';
  DELETE FROM tb_0 WHERE cl_0a LIKE 'e2e%';
  DELETE FROM tb_6 WHERE cl_6c IN (SELECT cl_5a FROM tb_5 WHERE cl_5f = 2);
  DELETE FROM tb_5 WHERE cl_5f = 2;"
```

Override the container and database with `E2E_DB_CONTAINER`, `E2E_DB_NAME`,
`E2E_DB_USER`. Redis: the per-user socket sets (`ws:conns:*`, and the older
`ws:conn:*` counters) are deleted by the same sweep; they have a 24 h TTL and
expire on their own, but a run that ends should end.

`auth.spec.js` has the test that keeps this honest — it soft-deletes an account,
asserts the row is still there, and then asserts the sweep removes it.

**Why friend search uses a stubbed directory.** The real directory grows with
each run and the app paginates under a 30 req/min ceiling on `/users`. As soon as
the total exceeds one page, a freshly created account lands on page 2 and the
test becomes a race against the rate limit. The search tests pin the pool with
`stubUserDirectory`; the real endpoint's contract stays covered by the
`GET /users — contract of the directory backing search` test, which does not go
through the browser.
