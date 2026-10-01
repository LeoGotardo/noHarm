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
 * `details` is optional free text. `target` says what the report is about, and
 * every field of it is an **id, not content**: the backend copies the
 * conversation's last messages, the post, or the comment (with the post it
 * answers) out of its own database as evidence. Sending the text instead would
 * let a reporter compose the other person's lines, so there is deliberately no
 * parameter for it.
 *
 * `postId` and `commentId` exclude each other; either combines with `chatId`,
 * so reporting a post by someone you also talk to keeps the conversation as
 * evidence too.
 *
 * With an open report about the same person already on file, a new post or
 * comment is attached to that one instead and the response says
 * `appended: true` — the caller words its confirmation accordingly.
 *
 * @param {string} userId
 * @param {string} reason
 * @param {string} [details]
 * @param {{chatId?: string, postId?: string, commentId?: string}} [target]
 */
export async function reportUser(userId, reason, details, target = {}) {
  const { chatId, postId, commentId } = target;
  return api.post(`/reports/${userId}`, {
    reason,
    details: details?.trim() ? details.trim() : null,
    ...(chatId ? { chatId } : {}),
    ...(postId ? { postId } : commentId ? { commentId } : {}),
  });
}

/** The reports I filed — what the app reads to show "already reported". */
export async function getMyReports(paginated = false, page = 1, pageSize = 20) {
  return api.get(`/reports/mine`, { paginated, page, pageSize });
}
