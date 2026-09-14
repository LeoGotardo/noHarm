import { api } from "../../connectors/api.js";

/**
 * What moderation has told this user about their own account.
 *
 * A notice names the **conduct**, never the person who reported it. That is
 * not a UI detail: the promise that a reported user is never told who
 * complained is the whole reason reports get filed, and a warning that leaked
 * the complainant would turn every report into a confrontation.
 */

/** Where an appeal goes. Stated on every notice and on a refused sign-in. */
export const SUPPORT_EMAIL =
  import.meta.env.VITE_SUPPORT_EMAIL || "support@noharm.site";

/**
 * What each conduct code means, in the second person, without accusation.
 *
 * Deliberately not the report sheet's wording: there the reader is someone
 * describing a stranger ("Harassment or bullying"), here it is the person
 * being told, and being read a label lands very differently from being told
 * what happened.
 */
export const NOTICE_COPY = {
  harassment: {
    title: "A message you sent was reported",
    body: "Messages that target, pressure or intimidate someone are not okay here.",
  },
  inappropriate: {
    title: "Something you shared was reported",
    body: "Explicit or graphic content does not belong in this community.",
  },
  spam: {
    title: "Something you posted was reported",
    body: "Unsolicited links and promotion are not what this space is for.",
  },
  impersonation: {
    title: "Your profile was reported",
    body: "Presenting yourself as someone else is not allowed.",
  },
  other: {
    title: "Your account was reported",
    body: "Something on your account went against our community rules.",
  },
};

export function noticeCopy(reason) {
  return NOTICE_COPY[reason] ?? NOTICE_COPY.other;
}

/** The notices on my account. `pending` limits it to unacknowledged ones. */
export async function getMyNotices(pending = false) {
  return api.get("/notices/mine", pending ? { pending: true } : undefined);
}

/** Mark one as read. Acknowledging is not agreeing — appeals go to support. */
export async function acknowledgeNotice(noticeId) {
  return api.post(`/notices/${noticeId}/ack`);
}

/** Send a warning (admin). Nothing about the account changes. */
export async function warnUser(userId, reason, message) {
  return api.post(`/users/${userId}/warn`, {
    reason,
    message: message?.trim() ? message.trim() : null,
  });
}
