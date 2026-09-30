/**
 * Suggestions travel by email, not through the API: the box in Settings
 * opens the user's own mail app with the text already in it, addressed to an
 * ImprovMX alias. Nothing is stored server-side, and the user sees exactly
 * what is sent before sending it.
 *
 * public/suggest.js does the same for the landing page — a static page cannot
 * import this module, so the address and the limit are written there too.
 * Keep the two in step.
 */
export const SUGGESTIONS_EMAIL = "suggestions@noharm.site";

// A mailto URL much past ~2000 characters is cut off or refused by some mail
// clients, and percent-encoding can triple the text's length.
export const SUGGESTION_MAX = 600;

export function suggestionMailto(text) {
  const subject = encodeURIComponent("NoHarm suggestion");
  const body = encodeURIComponent(text.trim());
  return `mailto:${SUGGESTIONS_EMAIL}?subject=${subject}&body=${body}`;
}
