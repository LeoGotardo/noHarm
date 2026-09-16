import { useEffect, useState } from "react";

// A name the app is still waiting for, not a name. `ChatRow`, `ChatThread` and
// `PublicProfile` all render the row before `GET /users/{id}` answers and pass
// their loading placeholder straight through — drawing "…" or "?" as an initial
// dressed a missing profile up as a real one.
const PLACEHOLDER_NAMES = new Set(["", "?", "…", "..."]);

const hasName = (name) =>
  typeof name === "string" && !PLACEHOLDER_NAMES.has(name.trim());

/**
 * The generic person, for an avatar with no picture *and* no name to draw an
 * initial from. Inline rather than a file: it costs no request, it is the one
 * image that must never itself fail to load, and `currentColor` lets it take
 * the same hue the initials would have had.
 */
function PlaceholderAvatar({ size }) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      role="img"
      aria-label="No profile picture"
      style={{ display: "block" }}
    >
      <circle cx="24" cy="18.5" r="7.5" fill="currentColor" opacity="0.85" />
      <path
        d="M9.5 41.5c0-8 6.5-13 14.5-13s14.5 5 14.5 13z"
        fill="currentColor"
        opacity="0.85"
      />
    </svg>
  );
}

export function Avatar({
  name = "?",
  src = null,
  size = 44,
  hue = 150,
  online,
  style,
}) {
  const named = hasName(name);
  const letter = named ? name.trim()[0].toUpperCase() : null;
  // A picture that fails to load used to leave an empty circle: the coloured
  // initial is only drawn when `src` is null, so a broken URL rendered nothing
  // at all. Google's `lh3.googleusercontent.com` photos — the only source of a
  // profile picture here — are exactly the ones that fail, which is also why
  // the <img> below asks for no referrer: Google answers 403 to a hotlink from
  // an origin it does not know.
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [src]);
  const showImg = Boolean(src) && !broken;
  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        flexShrink: 0,
        ...style,
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: showImg ? "transparent" : `oklch(0.82 0.07 ${hue})`,
          color: `oklch(0.32 0.08 ${hue})`,
          fontWeight: 700,
          fontSize: size * 0.42,
          fontFamily: "var(--font-body)",
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.04)",
        }}
      >
        {showImg ? (
          <img
            src={src}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setBroken(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : named ? (
          letter
        ) : (
          <PlaceholderAvatar size={size} />
        )}
      </div>
      {online !== undefined && (
        <span
          style={{
            position: "absolute",
            right: -1,
            bottom: -1,
            width: size * 0.28,
            height: size * 0.28,
            borderRadius: "50%",
            background: online ? "oklch(0.7 0.16 150)" : "var(--ink-3)",
            border: "2.5px solid var(--surface)",
          }}
        />
      )}
    </div>
  );
}

export function OnlineDot({ online }) {
  return (
    <span
      style={{
        width: 9,
        height: 9,
        borderRadius: "50%",
        flexShrink: 0,
        background: online ? "oklch(0.7 0.16 150)" : "var(--ink-3)",
      }}
    />
  );
}
