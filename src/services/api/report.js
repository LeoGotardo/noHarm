import { api } from "../../connectors/api.js";

// The closed set the backend accepts (`ReportReason` in reportSchemas.py).
// Order is the order the sheet lists them: the reasons people reach for most
// first, "something else" last. `self_harm` is worded as concern rather than
// an accusation — in a recovery app that report is usually someone worried
// about a friend, not someone complaining about them.
export const REPORT_REASONS = [
  { value: "harassment", label: "Harassment or bullying" },
  { value: "inappropriate", label: "Inappropriate or explicit content" },
  { value: "spam", label: "Spam or scams" },
  { value: "impersonation", label: "Pretending to be someone else" },
  { value: "self_harm", label: "I'm worried about their safety" },
  { value: "other", label: "Something else" },
];

export const REPORT_DETAILS_MAX = 1000;

/**
 * File a report about another user.
 *
 * `details` is optional free text. `chatId` is optional too, and is an **id,
 * not content**: the backend copies that conversation's last messages out of
 * its own database as evidence attached to the report. Sending the text
 * instead would let a reporter compose the other person's lines, so there is
 * deliberately no parameter for it.
 *
 * Naming a chat the reporter is not in is a 403; one the reported user is not
 * in is a 400. Both are caller mistakes rather than states the UI can reach.
 */
export async function reportUser(userId, reason, details, chatId) {
  return api.post(`/reports/${userId}`, {
    reason,
    details: details?.trim() ? details.trim() : null,
    ...(chatId ? { chatId } : {}),
  });
}

/** The reports I filed — what the app reads to show "already reported". */
export async function getMyReports(paginated = false, page = 1, pageSize = 20) {
  return api.get(`/reports/mine`, { paginated, page, pageSize });
}
