/**
 * Badge domain helpers.
 *
 * `milestone` is an integer count of clean days, and whether a user earned a
 * badge lives in `/user-badges/` — never in arithmetic over `milestone`, which
 * says what a badge costs, not who has it. Everything here exists so no screen
 * has to guess at either of those.
 */

/**
 * The day count a badge represents, when it can be read as one.
 *
 * Returns `null` for anything that isn't a plain number, so a malformed badge
 * makes callers hide the countdown instead of rendering `NaN days to go`.
 *
 * @param {{milestone?: unknown}} badge
 * @returns {number|null}
 */
export function milestoneDays(badge) {
  const m = badge?.milestone;
  if (typeof m === "number" && Number.isFinite(m)) return m;
  if (typeof m === "string" && /^\d+$/.test(m.trim())) return Number(m.trim());
  return null;
}

/** Days left until `badge` is reached, or null when the milestone isn't a day count. */
export function daysToGo(badge, currentDays) {
  const target = milestoneDays(badge);
  if (target == null) return null;
  return Math.max(0, target - currentDays);
}

/** Progress towards `badge`, 0–1, or null when the milestone isn't a day count. */
export function badgeProgress(badge, currentDays) {
  const target = milestoneDays(badge);
  if (target == null || target <= 0) return null;
  return Math.min(1, currentDays / target);
}

/** A badge's description, tolerating the shorter `desc` key used by mock data. */
export function badgeDescription(badge) {
  return badge?.description ?? badge?.desc ?? "";
}

/**
 * Merge the badge catalogue with the badges this user has actually earned.
 *
 * @param {Array<object>} badges      from GET /badges
 * @param {Array<object>} userBadges  from GET /user-badges/
 * @returns {Array<object>} each badge with `earned` = given_at string or null
 */
export function withEarnedState(badges, userBadges = []) {
  const earnedAt = new Map(
    userBadges
      .filter((ub) => ub.status !== 2)
      .map((ub) => [String(ub.badge_id), ub.given_at ?? true]),
  );
  return badges.map((b) => {
    const given = earnedAt.get(String(b.id));
    return {
      ...b,
      earned: given ? formatEarned(given) : null,
    };
  });
}

function formatEarned(given) {
  if (given === true) return "Earned";
  const d = new Date(given);
  if (Number.isNaN(d.getTime())) return "Earned";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
