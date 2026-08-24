/**
 * Thin REST client for seeding backend state from tests.
 *
 * Auth shortcut: POST /auth/login and /auth/register take a raw Firebase UID +
 * email — the backend does not verify a Firebase ID token. That lets tests mint
 * real JWTs without driving the Google popup, which Playwright cannot automate.
 */

export const API_URL = process.env.E2E_API_URL ?? "http://localhost:8080";

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
/** Collision-proof identifier for a throwaway account. */
function newUid(tag) {
  seq += 1;
  return `e2e${Date.now().toString(36)}${process.pid.toString(36)}${seq}${tag}`;
}

/**
 * Register a throwaway account and return its identity + live tokens.
 * The backend uses the Firebase UID as the user id, so `id === uid`.
 */
export async function createUser(tag = "u") {
  const uid = newUid(tag);
  const res = await api.post("/auth/register", {
    body: {
      uid,
      email: `${uid}@e2e-noharm.example.com`,
      username: uid,
      emailVerified: true,
    },
  });
  return {
    id: uid,
    uid,
    username: uid,
    email: `${uid}@e2e-noharm.example.com`,
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
