# E2E tests — NoHarm

Playwright suite (71 tests) automating the checklist in
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

Consequence: none of your own accounts are used. The database still accumulates
the throwaway accounts, because the backend only soft-deletes — see "State the
suite leaves in the database".

## Rate limit: why there is a counter `FLUSH`

The backend limits **all** routes to 60 requests/minute per IP, with a 60 s
window kept in Redis under `rl:*`. One screen load costs ~10 requests, so the
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
registry and the per-user socket counters (`ws:conn:*`, which enforce
`too_many_connections`), and a flush from one worker would corrupt that data for
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
| `DELETE /badges` 500, leaving a ghost badge | deletes, and it disappears from `GET /badges` |
| deleted account remained authenticable | `GET /users/me` returns 403 `Account not found.` |
| badges never granted | granted on `POST /streaks/start` and `/streaks/checkin` |

### Backend — open

None.

### Frontend — open

- **Socket refusal codes are not handled** (`src/connectors/socket.js`).
  The backend now returns the real reason in `connect_error` —
  `missing_token`, `invalid_token`, `account_unavailable`,
  `too_many_connections` — where everything used to become
  `"Connection refused by server"`. The handler is still a `console.warn` and
  socket.io retries 5 reconnections for any of the four; for
  `account_unavailable` and `too_many_connections` that is guaranteed noise. No
  test coverage until the handler exists.

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

- Users: deleted at teardown. The backend soft-deletes, so the rows stay in the
  database and the directory grows with each run. To purge:

  ```bash
  docker exec postgres_db psql -U root -d noharm-db -c "
    DELETE FROM tb_4 WHERE cl_4c LIKE 'e2e%';
    DELETE FROM tb_3 WHERE cl_3b LIKE 'e2e%' OR cl_3c LIKE 'e2e%';
    DELETE FROM tb_2 WHERE cl_2b LIKE 'e2e%' OR cl_2c LIKE 'e2e%';
    DELETE FROM tb_1 WHERE cl_1b LIKE 'e2e%';
    DELETE FROM tb_6 WHERE cl_6b LIKE 'e2e%';
    DELETE FROM tb_7 WHERE cl_7c LIKE 'e2e%';
    DELETE FROM tb_8 WHERE cl_8b LIKE 'e2e%';
    DELETE FROM tb_9 WHERE cl_9b LIKE 'e2e%';
    DELETE FROM tb_0 WHERE cl_0a LIKE 'e2e%';"
  ```

- Badges: none. `tests/badges.spec.js` creates its catalog in `beforeAll`, deletes
  it in `afterAll` and also sweeps leftovers from previous runs by the `E2E `
  prefix, now that the `DELETE` works.

- Redis: `ws:conn:<userId>` counters are left at `0` with a 24 h TTL after the
  socket closes — the decrement is correct, the key just isn't deleted. It does
  not affect `too_many_connections`; it expires on its own.

**Why friend search uses a stubbed directory.** The real directory grows with
each run and the app paginates under a 30 req/min ceiling on `/users`. As soon as
the total exceeds one page, a freshly created account lands on page 2 and the
test becomes a race against the rate limit. The search tests pin the pool with
`stubUserDirectory`; the real endpoint's contract stays covered by the
`GET /users — contract of the directory backing search` test, which does not go
through the browser.
