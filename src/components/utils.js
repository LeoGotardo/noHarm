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
