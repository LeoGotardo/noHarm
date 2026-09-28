/**
 * The NoHarm mark, and the one place its geometry is written down.
 *
 * The ring is the streak in progress and the check is today, done — which is
 * why the arc is open rather than closed: a finished circle would say the work
 * is over. Everything that draws the mark comes through here, so the app, the
 * favicon and the public legal pages cannot drift into three slightly
 * different logos.
 *
 * Two variants, one drawing:
 *
 * - `plain` (default) — the mark in token colour, for the splash, the side rail
 *   and the auth screens.
 * - `tile` — the same mark reversed out of a filled, rounded square. The app
 *   icon, and anything that has to sit on a ground it does not control.
 *
 * They differ in colour and ground, never in shape. There used to be a third,
 * `mini`, that dropped the ring for sizes under about 32px where its gap closes
 * up — it is gone on purpose: a logo that changes shape by size is two logos,
 * and the tab is where people see it most often.
 *
 * The track's opacity is the one thing that follows the ground: 0.22 reads on a
 * page background and disappears against the filled tile, which uses 0.32.
 */

/** The viewBox every variant is drawn in. */
const BOX = 100;

export function Mark({
  size = 76,
  variant = "plain",
  color = "var(--primary)",
  /** The tile's ground. Ignored unless `variant="tile"`. */
  ground = "var(--primary)",
  title,
}) {
  const mark = variant === "tile" ? "var(--on-primary)" : color;
  const trackOpacity = variant === "tile" ? 0.32 : 0.22;

  const glyph = (
    <>
      <circle
        cx="50"
        cy="50"
        r="42"
        fill="none"
        stroke={mark}
        strokeWidth="6"
        opacity={trackOpacity}
      />
      {/* dasharray 264 is the circumference at r=42; the offset is the gap
          that keeps the ring open. */}
      <circle
        cx="50"
        cy="50"
        r="42"
        fill="none"
        stroke={mark}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray="264"
        strokeDashoffset="79"
        transform="rotate(-90 50 50)"
      />
      <path
        d="M32 52 L44 64 L70 34"
        fill="none"
        stroke={mark}
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  );

  if (variant === "tile") {
    return (
      <div
        style={{
          width: size,
          height: size,
          // 22.5% of the side, which is what keeps the corner looking the same
          // at 512px and at 44px.
          borderRadius: size * 0.225,
          background: ground,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg
          width={size * 0.575}
          height={size * 0.575}
          viewBox={`0 0 ${BOX} ${BOX}`}
          role={title ? "img" : "presentation"}
          aria-label={title}
          aria-hidden={title ? undefined : true}
        >
          {glyph}
        </svg>
      </div>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${BOX} ${BOX}`}
      style={{ display: "block", flexShrink: 0 }}
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {glyph}
    </svg>
  );
}

/**
 * "NoHarm", set the one way it is set.
 *
 * Tracking is a token, not a constant: `sage`'s sans needs the pair closed up
 * (-0.03em) and `dawn`'s serif carries its own fit and wants none. An em rather
 * than a pixel value, so it holds at 96px on the splash and at 20px in the
 * side rail.
 */
export function Wordmark({ size = 34, color = "var(--ink)" }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-display)",
        fontWeight: "var(--display-weight)",
        fontSize: size,
        lineHeight: 1,
        letterSpacing: "var(--display-tracking)",
        color,
        whiteSpace: "nowrap",
      }}
    >
      No<span style={{ color: "var(--primary)" }}>Harm</span>
    </div>
  );
}

/** The mark over the wordmark — the lockup the splash and auth screens use. */
export function Logo({ size = 76, withText = false, variant, color }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
      }}
    >
      <Mark size={size} variant={variant} color={color} title="NoHarm" />
      {withText && <Wordmark size={size * 0.45} />}
    </div>
  );
}
