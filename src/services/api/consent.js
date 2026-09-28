import { api } from "../../connectors/api.js";

/**
 * What this account has agreed to, and what it still owes an answer on.
 *
 * `pending` is the list the consent gate blocks on; `health_data_consent` is
 * what the streak tracker reads. Both are derived server-side from the
 * versions in force — the client never decides it has already agreed.
 *
 * @returns {Promise<{versions: Record<string,string>, consents: Array<object>, pending: string[], health_data_consent: boolean}>}
 */
export async function getConsents() {
  return api.get("/users/me/consents");
}

/**
 * Record agreement to one or more documents.
 *
 * No version travels in the body on purpose: the server stamps whatever is
 * live when it writes. A client able to name the revision it was agreeing to
 * could record agreement to a text it never showed anyone.
 *
 * @param {Array<"terms"|"privacy"|"health_data">} documents
 */
export async function acceptConsents(documents) {
  return api.post("/users/me/consents", { documents });
}

/**
 * Withdraw consent to hold recovery data.
 *
 * Deletes every streak — active, history and personal record — with no grace
 * window and no undo. The account itself is untouched. The caller is
 * responsible for having said so before calling this.
 *
 * @returns {Promise<{withdrawn: boolean, streaks_deleted: number}>}
 */
export async function withdrawHealthConsent() {
  return api.delete("/users/me/consents/health");
}
