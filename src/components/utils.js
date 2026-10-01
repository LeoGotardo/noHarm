export function hashHue(str = "") {
  let h = 0;
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return Math.abs(h) % 360;
}

export function fmtTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

/** "Jan 15, 2024" */
export function fmtLongDate(iso) {
  if (!iso) return "?";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** "today" / "1d ago" / "5d ago" */
export function fmtRelDate(iso) {
  if (!iso) return "";
  const diff = Math.floor((Date.now() - new Date(iso)) / 86_400_000);
  if (diff === 0) return "today";
  if (diff === 1) return "1d ago";
  return `${diff}d ago`;
}

/** "Mon, Jan 15" */
export function fmtShortDay(iso) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** "now" / "5m" / "3h" / "2d" / "Jan 15" — for posts, where minutes matter. */
export function fmtAgo(iso) {
  if (!iso) return "";
  // The backend sends naive UTC timestamps; read them as UTC, not local time.
  const d = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : iso + "Z");
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86_400) return `${Math.floor(s / 3600)}h`;
  if (s < 7 * 86_400) return `${Math.floor(s / 86_400)}d`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── text length, as the backend counts it ────────────────────────────────────
// Python's len() counts code points; String#length counts UTF-16 units, and an
// emoji is two of them. Counting units made a limit tighter than the server's,
// and slicing by them could cut an emoji in half — a lone surrogate the API
// cannot encode, so the post failed with a 500 instead of being shortened.

/** Length in code points — what `max_length` on the backend measures. */
export function textLength(str = "") {
  let n = 0;
  for (const _ of str) n++;
  return n;
}

/** `str` cut to at most `max` code points, never inside a surrogate pair. */
export function clampText(str = "", max) {
  if (str.length <= max) return str;
  return Array.from(str).slice(0, max).join("");
}

// A message made only of emoji (up to three) is drawn large, without a bubble.
const EMOJI_ONLY =
  /^(?:\p{Extended_Pictographic}|\p{Emoji_Modifier}|\p{Regional_Indicator}|‍|️|⃣|\s)+$/u;

export function bigEmojiCount(str = "") {
  const t = str.trim();
  if (!t || !EMOJI_ONLY.test(t) || !/\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(t))
    return 0;
  const n =
    typeof Intl !== "undefined" && Intl.Segmenter
      ? [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(t.replace(/\s/g, ""))].length
      : Array.from(t.replace(/\s/g, "")).length;
  return n <= 3 ? n : 0;
}
