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
