// Protocol status codes from VITE_STATUS_CONSTANTS (see CLAUDE.md "Domain rules").
// Vite injects env vars as raw strings, so the JSON must be parsed once here.
// Every consumer imports this instead of touching import.meta.env directly —
// reading `.accepted` off the raw string always yielded `undefined` and
// silently broke every status comparison (friends never showed as accepted).
function parseStatusConstants() {
  const raw = import.meta.env.VITE_STATUS_CONSTANTS;
  try {
    return JSON.parse(raw);
  } catch {
    console.error(
      "[constants] VITE_STATUS_CONSTANTS is missing or not valid JSON:",
      raw,
    );
    return {};
  }
}

export const STATUS_CONSTANTS = parseStatusConstants();
