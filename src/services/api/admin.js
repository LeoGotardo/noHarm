import { api } from "../../connectors/api.js";

/**
 * The admin board.
 *
 * Same gate as the moderation queue and for the same reason: authorisation is
 * the backend's `getAdminUser` (`ADMIN_USER_IDS`, official accounts and the
 * accounts they promoted), and every route here answers
 * **404** to anyone else rather than 403. There is no "am I an admin"
 * endpoint — `useModerator` probing the report queue is the answer for both
 * surfaces, because one allowlist decides both.
 */

/** Every number on the board, in one response. Cached 60s server-side. */
export async function getOverview({ days } = {}) {
  return api.get("/admin/overview", days ? { days } : undefined);
}

/**
 * The three ways an account stops being in use, for the comparison chart.
 *
 * One hue for all three on purpose: they are nominal categories with no order
 * between them, and colouring them darker-where-bigger would encode bar length
 * twice. The notes say what each one actually means, because "deleted" and
 * "banned" sound interchangeable and are not.
 */
export const INACTIVE_STATES = [
  {
    key: "disabled",
    label: "Disabled",
    note: "Disabled accounts are switched off without being deleted or banned.",
  },
  {
    key: "deleted",
    label: "Deleted",
    note: "Deleted by their owner, and still inside the grace window — every one of these can still be restored.",
  },
  {
    key: "banned",
    label: "Banned",
    note: "The only one of the three that is a moderation decision. Includes timed suspensions that have not yet lapsed.",
  },
];

/**
 * The account directory, including the accounts the app hides.
 *
 * `GET /users` omits deleted, banned and blocked — right for the app, useless
 * here, since those are exactly what an administrator is looking for.
 */
export async function getUsers({ page = 1, pageSize = 25, status } = {}) {
  return api.get("/admin/users", {
    page,
    pageSize,
    ...(status != null ? { status } : {}),
  });
}

/** Distinct faults, most recently seen first. One row is one *kind* of failure. */
export async function getErrors({ page = 1, pageSize = 20 } = {}) {
  return api.get("/admin/errors", { page, pageSize });
}

/** SSH logins to the machine, newest first. */
export async function getHostAccess({ page = 1, pageSize = 20 } = {}) {
  return api.get("/admin/access", { page, pageSize });
}

/** Status code → what to call it on screen. Mirrors STATUS_CODES. */
export const STATUS_LABELS = {
  0: "Disabled",
  1: "Active",
  2: "Deleted",
  3: "Blocked",
  9: "Banned",
};

/**
 * The health panel's fields, in the order they should be read, with what a
 * non-zero value actually means.
 *
 * Kept here rather than in the screen because it is the part a reader has to
 * understand: every one of these is zero when the system is healthy, and the
 * first two are failures that are otherwise invisible from outside — a deleted
 * account past its window answers "not found" whether the purge ran or not.
 */
export const HEALTH_FIELDS = [
  {
    key: "purge_overdue",
    label: "Accounts past their purge date",
    bad: "The account purge has stopped running.",
  },
  {
    key: "evidence_overdue",
    label: "Report evidence past retention",
    bad: "The evidence purge has stopped running.",
  },
  {
    key: "error_occurrences_24h",
    label: "Errors in the last 24 h",
    bad: "Something is failing.",
  },
  {
    key: "distinct_faults",
    label: "Kinds of failure on record",
    // Context, not a failure: a row here is a fault that *has* happened, kept
    // for 90 days. Counting it as a current problem would mean the board could
    // never read healthy again after the first bug.
    context: true,
  },
];

/**
 * Who can use the admin routes, and why (`source`: official · env · granted).
 *
 * Official accounts only — everyone else gets the usual 404. Only `granted`
 * rows can be revoked from the app; the other two are set in the server
 * configuration.
 */
export async function listAdmins() {
  return api.get("/admin/admins");
}

/** Give an account everything the admin routes allow. Official accounts only. */
export async function promoteAdmin(userId) {
  return api.post(`/admin/admins/${encodeURIComponent(userId)}`);
}

/** Revoke a promotion made from the app. Takes effect on their next request. */
export async function demoteAdmin(userId) {
  return api.delete(`/admin/admins/${encodeURIComponent(userId)}`);
}
