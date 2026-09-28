import { api } from "../../connectors/api.js";
import { REPORT_REASONS } from "./report.js";

/**
 * The moderation surface. Every call here answers **404 to anyone outside
 * `ADMIN_USER_IDS`** — not 403 — so a non-moderator cannot even confirm these
 * endpoints exist. That is also how the app decides whether to show the
 * entry point: there is no "am I an admin" endpoint, and adding one would
 * hand out the same fact this deliberately withholds.
 */

/** Report status codes, as the queue's three tabs. */
export const REPORT_STATUS = { open: 4, actioned: 5, dismissed: 6 };

/** "harassment" → "Harassment or bullying", from the list the sheet offers. */
export function reasonLabel(value) {
  return REPORT_REASONS.find((r) => r.value === value)?.label ?? value;
}

/** The queue. `status` is one of REPORT_STATUS; omit for everything. */
export async function getQueue(status) {
  return api.get("/reports", status == null ? undefined : { status });
}

export async function getReport(reportId) {
  return api.get(`/reports/${reportId}`);
}

/**
 * What was captured when the report was filed.
 *
 * Reading this is logged against the moderator (audit type 11): it is two
 * users' private messages, and a power to read them that leaves no trace is
 * indistinguishable from one being abused.
 */
export async function getEvidence(reportId) {
  return api.get(`/reports/${reportId}/evidence`);
}

/** Take a report for review. 409 when another moderator holds it. */
export async function claimReport(reportId) {
  return api.post(`/reports/${reportId}/claim`);
}

/** Put it back, undecided. */
export async function releaseReport(reportId) {
  return api.delete(`/reports/${reportId}/claim`);
}

/** Close it: "accepted" = acted on, "ignored" = dismissed. */
export async function resolveReport(reportId, outcome) {
  return api.put(`/reports/${reportId}/resolve/${outcome}`);
}

/**
 * Ban an account — for `days`, or for good when `days` is null.
 *
 * Deliberately not part of resolving a report: closing a complaint and
 * punishing an account are two decisions, and a queue where one implies the
 * other is one moderators stop reading.
 */
export async function suspendUser(userId, days, reason, message) {
  return api.put(`/users/${userId}/suspend`, {
    days: days ?? null,
    ...(reason ? { reason } : {}),
    // Shown to the suspended user when they come back, so they are not left
    // guessing. The backend writes it as a suspension notice beside the ban.
    ...(message?.trim() ? { message: message.trim() } : {}),
  });
}

/**
 * Take an abusive username away and make the account choose another.
 *
 * The rung a report about a *name* actually needs: a ban is far too much for
 * a handle and a warning far too little, because a warning leaves the name
 * exactly where it is. The backend renames the account immediately to a
 * neutral handle — the harm is the name being readable — and then refuses to
 * let the app past a rename screen until a real one is chosen.
 */
export async function resetUsername(userId, reason, message) {
  return api.put(`/users/${userId}/username/reset`, {
    ...(reason ? { reason } : {}),
    ...(message?.trim() ? { message: message.trim() } : {}),
  });
}

/**
 * Block or unblock the account's profile picture.
 *
 * Blocking removes it and refuses a new one. It has to be a flag and not just
 * a delete: the backend refreshes the photo from the Google account at every
 * login, so clearing it alone would undo itself the next time they signed in.
 *
 * Unblocking restores nothing — the old picture is gone, and the next sign-in
 * pulls whatever the Google account holds now.
 */
export async function setPictureBlocked(userId, blocked, reason, message) {
  return api.put(`/users/${userId}/picture/${blocked ? "block" : "unblock"}`, {
    ...(reason ? { reason } : {}),
    ...(message?.trim() ? { message: message.trim() } : {}),
  });
}

/**
 * Whether a report is about the profile itself rather than about conduct.
 *
 * Only these two reasons offer the name and picture sanctions: a harassment
 * report is answered with a warning or a suspension, and offering "reset their
 * username" there invites a moderator to reach for the tool that is in front
 * of them rather than the one that fits.
 */
export const PROFILE_REASONS = new Set(["impersonation", "inappropriate"]);

/** Lift a ban early. Clears the end date with it. */
export async function liftSuspension(userId) {
  return api.put(`/users/${userId}/status/1`);
}

/** The evidence blob for a profile snapshot, parsed. */
export function parseProfileEvidence(content) {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}
