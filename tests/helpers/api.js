/**
 * Thin REST client for seeding backend state from tests.
 *
 * Auth shortcut: POST /auth/login and /auth/register verify a Firebase ID
 * token, and nothing here can produce one signed by Google. The dev backend
 * therefore runs with FIREBASE_AUTH_EMULATOR_HOST set (see
 * ../../../noHarmBack/docker/compose.yaml), which skips the signature check
 * while still enforcing the project, issuer and subject claims. `fakeIdToken`
 * below is shaped to satisfy exactly that — which is what lets a test mint an
 * identity without driving the Google popup, which Playwright cannot automate.
 *
 * If registration starts coming back 401, that env var is missing from the
 * backend container.
 */

import { createHmac } from "node:crypto";

export const API_URL = process.env.E2E_API_URL ?? "http://localhost:8080";

/**
 * Firebase project the minted tokens claim to come from. Must match the
 * backend's FIREBASE_PROJECT_ID — a mismatch is a 401, even in emulator mode.
 */
const PROJECT_ID = process.env.E2E_FIREBASE_PROJECT_ID ?? "noharm-6cc9d";

const b64url = (input) =>
  Buffer.from(input).toString("base64url");

/** An ID token the backend accepts while it runs in emulator mode. */
export function fakeIdToken(uid, email, { emailVerified = true, aud = PROJECT_ID } = {}) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({
      iss: `https://securetoken.google.com/${aud}`,
      aud,
      sub: uid,
      iat: now,
      exp: now + 3600,
      email,
      email_verified: emailVerified,
    }),
  );
  // The signature is never checked in emulator mode; it exists so the token has
  // the three segments every JWT parser expects.
  const signature = createHmac("sha256", "not-checked")
    .update(`${header}.${claims}`)
    .digest("base64url");
  return `${header}.${claims}.${signature}`;
}

/**
 * Rate limiting: every test starts from a cleared counter — see
 * helpers/ratelimit.js. The suite no longer forges a per-test client IP.
 */
import { clearRateLimit } from "./ratelimit.js";

/** Attempts for a call that comes back 429, including the first one. */
const RATE_LIMIT_ATTEMPTS = 3;

export class ApiError extends Error {
  constructor(method, path, status, body) {
    super(`${method} ${path} → ${status}: ${JSON.stringify(body)?.slice(0, 300)}`);
    this.status = status;
    this.body = body;
  }
}

async function call(method, path, { token, body, allow404 } = {}) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(API_URL + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body != null ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = text;
    }
    // Workers share one bucket now, so a burst from a sibling test can land on
    // this call between two resets. Clear and retry instead of failing a test
    // for something that has nothing to do with what it asserts.
    if (res.status === 429 && attempt < RATE_LIMIT_ATTEMPTS) {
      await clearRateLimit();
      continue;
    }
    if (res.status === 404 && allow404) return null;
    if (!res.ok) throw new ApiError(method, path, res.status, json);
    return json;
  }
}

/** Auth options for a given test user. */
export const as = (user) => ({ token: user.accessToken });

export const api = {
  get: (p, o) => call("GET", p, o),
  post: (p, o) => call("POST", p, o),
  put: (p, o) => call("PUT", p, o),
  delete: (p, o) => call("DELETE", p, o),
};

let seq = 0;
/**
 * What registration now needs besides a token and a username.
 *
 * A fixed adult birth date, and the two binding consents — the backend refuses
 * without either, which is the point of both. `healthDataConsent` is true
 * because every suite that touches a streak needs it: `POST /streaks/start`
 * answers 403 HEALTH_CONSENT_REQUIRED without it.
 */
const REGISTRATION_CONSENT = {
  birthDate: "1990-06-15",
  acceptedTerms: true,
  acceptedPrivacy: true,
  healthDataConsent: true,
};

/** Collision-proof identifier for a throwaway account. */
function newUid(tag) {
  seq += 1;
  return `e2e${Date.now().toString(36)}${process.pid.toString(36)}${seq}${tag}`;
}

/**
 * Register a throwaway account and return its identity + live tokens.
 * The backend uses the Firebase UID as the user id, so `id === uid`.
 *
 * The uid and email reach the backend inside the token, not beside it: they are
 * read from the verified claims, so sending them in the body would do nothing.
 */
export async function createUser(tag = "u") {
  const uid = newUid(tag);
  const email = `${uid}@e2e-noharm.example.com`;
  const res = await api.post("/auth/register", {
    body: {
      idToken: fakeIdToken(uid, email),
      username: uid,
      ...REGISTRATION_CONSENT,
    },
  });
  return {
    id: uid,
    uid,
    username: uid,
    email,
    idToken: fakeIdToken(uid, email),
    accessToken: res.accessToken,
    refreshToken: res.refreshToken,
  };
}

export async function deleteUser(user) {
  if (!user?.accessToken) return;
  try {
    await api.delete("/users/me", as(user));
  } catch {
    // Already deleted by the test itself (delete-account flow) — fine.
  }
}

// ── Friendships ──────────────────────────────────────────────────────────────

/** `from` sends a friend request to `to`. Returns the friendship record. */
export async function sendRequest(from, to) {
  return api.post(`/friendships/${to.id}`, as(from));
}

/** Make two users friends (request + accept). Returns the friendship record. */
export async function makeFriends(a, b) {
  const fr = await sendRequest(a, b);
  return api.post(`/friendships/${fr.id}/accept`, as(b));
}

// ── Streaks ──────────────────────────────────────────────────────────────────

/** ISO date (YYYY-MM-DD) `n` days before today, in local time. */
export function daysAgo(n) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export function todayISO() {
  return daysAgo(0);
}

/** Start a streak for `user`, backdated `days` days. */
export async function startStreak(user, days = 0) {
  return api.post("/streaks/start", {
    ...as(user),
    body: { start_at: `${daysAgo(days)}T00:00:00` },
  });
}

export async function checkin(user) {
  return api.post("/streaks/checkin", as(user));
}

export async function endStreak(user, endAt = null) {
  return api.post("/streaks/end", {
    ...as(user),
    body: { end_at: endAt },
  });
}

export async function currentStreak(user) {
  return api.get("/streaks/current", { ...as(user), allow404: true });
}

// ── Chat ─────────────────────────────────────────────────────────────────────

/** Send a message; creates the chat on first send. Returns the message. */
export async function sendMessage(from, { to, chatId, content }) {
  return api.post("/messages", {
    ...as(from),
    body: chatId ? { chatId, content } : { recipientId: to.id, content },
  });
}

export async function getChats(user) {
  const r = await api.get("/chats", as(user));
  return r.chats ?? r.items ?? [];
}

// ── Badges ───────────────────────────────────────────────────────────────────

/**
 * Create a badge.
 *
 * `milestone` is a plain day count (integer). `description` must be at least 3
 * characters, and `created_at` / `updated_at` are required by the schema.
 */
export async function createBadge(user, { name, description, milestone, icon = "flame" }) {
  const now = new Date().toISOString();
  return api.post("/badges", {
    ...as(user),
    body: {
      name,
      description,
      milestone,
      icon,
      status: 1,
      created_at: now,
      updated_at: now,
    },
  });
}

export async function deleteBadge(badgeId, user) {
  try {
    await api.delete(`/badges/${badgeId}`, as(user));
  } catch {
    /* best effort — teardown must not fail a passing test */
  }
}

/**
 * Delete every badge whose name starts with `prefix`.
 *
 * The badge catalogue is global, so a run that died before teardown would
 * otherwise leave rows that skew the "N of M earned" counters. Returns the
 * number of badges removed.
 */
export async function deleteBadgesByPrefix(user, prefix) {
  const stale = (await listBadges(user)).filter((b) =>
    String(b.name ?? "").startsWith(prefix),
  );
  for (const b of stale) await deleteBadge(b.id, user);
  return stale.length;
}

/** Badges the backend actually granted to this user. */
export async function listUserBadges(user) {
  const r = await api.get("/user-badges/", as(user));
  return r.badges ?? r.items ?? [];
}

export async function listBadges(user) {
  const r = await api.get("/badges", as(user));
  return r.badges ?? r.items ?? [];
}

// ── Reports ──────────────────────────────────────────────────────────────────

/** `from` files a report about `to`. Mirrors what the sheet sends. */
export async function fileReport(from, to, reason = "spam", details = null) {
  return api.post(`/reports/${to.id}`, { ...as(from), body: { reason, details } });
}

/** The reports a user filed — nobody can read reports filed about them. */
export async function myReports(user) {
  return api.get("/reports/mine", as(user));
}

/**
 * The account on the backend's admin allowlist — the only one that can read a
 * moderation queue or the evidence behind a report.
 *
 * Authorisation is `ADMIN_USER_IDS` and nothing else, and the dev backend names
 * exactly this uid (`docker/compose.yaml`). The account is shared by every
 * worker: whoever gets there first registers it, everyone else logs in.
 *
 * It is erased with everything else by the sweep in `helpers/cleanup.js`, and
 * that has to be a *hard* delete — `DELETE /users/me` only soft-deletes, and a
 * uid inside its 30-day grace window cannot register or log in again, so the
 * next run would find a moderator it can no longer become.
 */
const ADMIN_UID = process.env.E2E_ADMIN_UID ?? "e2e-moderator";

export async function asAdmin() {
  return _moderator(ADMIN_UID, "e2e_moderator");
}

/**
 * Sign in (or register) one of the fixed moderator accounts.
 *
 * Returns the same shape `createUser` does, tokens included, so a test can
 * seed a browser session as the moderator and drive the moderation screens.
 */
async function _moderator(uid, username) {
  const email = `${uid}@e2e-noharm.example.com`;
  const idToken = fakeIdToken(uid, email);
  let res;
  try {
    res = await api.post("/auth/register", {
      body: { idToken, username, ...REGISTRATION_CONSENT },
    });
  } catch {
    // Already registered — by a previous run, or by a sibling worker moments
    // ago. Logging in is the same account either way.
    res = await api.post("/auth/login", { body: { idToken } });
  }
  return {
    id: uid,
    uid,
    username,
    email,
    idToken,
    accessToken: res.accessToken,
    refreshToken: res.refreshToken,
  };
}

/**
 * A second account on the allowlist, for the collisions a single moderator
 * cannot produce: the report lock only means anything with two of them.
 */
const ADMIN_UID_2 = process.env.E2E_ADMIN_UID_2 ?? "e2e-moderator-2";

export async function asSecondAdmin() {
  return _moderator(ADMIN_UID_2, "e2e_moderator_2");
}

/** The evidence captured behind a report — admin only. */
export async function reportEvidence(admin, reportId) {
  return api.get(`/reports/${reportId}/evidence`, as(admin));
}


// ── Moderation notices ───────────────────────────────────────────────────────

/** Send a warning as a moderator. Changes nothing about the account. */
export async function warnUser(admin, user, reason = "harassment", message = null) {
  return api.post(`/users/${user.id}/warn`, {
    ...as(admin),
    body: { reason, ...(message ? { message } : {}) },
  });
}

/** The notices waiting on an account. */
export async function myNotices(user, pending = false) {
  return api.get(`/notices/mine${pending ? "?pending=true" : ""}`, as(user));
}
