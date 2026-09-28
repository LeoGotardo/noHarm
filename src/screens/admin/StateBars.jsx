import { useState } from "react";

/**
 * Accounts that are not active, compared side by side.
 *
 * ## Horizontal bars, one colour
 *
 * The job is magnitude — "which of these is the big one" — and horizontal bars
 * read it directly, with room for the label beside each. **All three share one
 * hue**: disabled, deleted and banned are nominal categories with no order
 * between them, and colouring them darker-where-bigger would encode bar length
 * twice, burn the only free channel on something the chart already shows, and
 * fail the categorical checks by design.
 *
 * ## Why this is a chart at all
 *
 * Three numbers are already on the board above. What the bars add is the
 * proportion between them, which is the thing three separate figures make the
 * reader compute. If they were within a few percent of one another this would
 * be decoration — they usually are not.
 */
export function StateBars({ states, dim = false }) {
  const [hover, setHover] = useState(null);

  const max = Math.max(1, ...states.map((s) => s.count));
  const total = states.reduce((n, s) => n + s.count, 0);

  return (
    <div style={{ opacity: dim ? 0.4 : 1, transition: "opacity .18s ease" }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
          Not in use
        </div>
        <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
          {total === 0
            ? "Every account is active."
            : `${total} of them, by what took them out of use`}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {states.map((state) => {
          const on = hover === state.key;
          return (
            <div
              key={state.key}
              onMouseEnter={() => setHover(state.key)}
              onMouseLeave={() => setHover(null)}
              style={{ display: "flex", alignItems: "center", gap: 12 }}
            >
              <div
                style={{
                  width: 76,
                  flexShrink: 0,
                  fontSize: 12.5,
                  color: "var(--ink-2)",
                  textAlign: "right",
                }}
              >
                {state.label}
              </div>

              {/* The track is the full scale, so an empty category still reads
                  as "measured and zero" rather than as a missing row. */}
              <div
                style={{
                  flex: 1,
                  height: 22,
                  background: "var(--surface-2)",
                  borderRadius: 6,
                  overflow: "hidden",
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    width: `${(state.count / max) * 100}%`,
                    height: "100%",
                    background: "var(--primary)",
                    // Rounded at the data end, square at the baseline.
                    borderRadius: "0 4px 4px 0",
                    opacity: !hover || on ? 1 : 0.4,
                    transition: "opacity .1s ease, width .25s ease",
                  }}
                />
              </div>

              {/* Direct-labelled: three bars is few enough that every value can
                  carry its number without becoming noise, and it keeps the
                  figures reachable without hovering. */}
              <div
                style={{
                  width: 34,
                  flexShrink: 0,
                  fontSize: 14,
                  fontWeight: 700,
                  color: state.count ? "var(--ink)" : "var(--ink-3)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {state.count}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          fontSize: 11.5,
          color: "var(--ink-3)",
          lineHeight: 1.5,
          paddingTop: 12,
        }}
      >
        {hover
          ? states.find((s) => s.key === hover)?.note
          : "Three different things, and only one of them is a decision about the account."}
      </div>
    </div>
  );
}
