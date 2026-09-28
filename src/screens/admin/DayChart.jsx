import { useRef, useState } from "react";

/**
 * Daily counts as columns.
 *
 * ## Columns, not an area
 *
 * A day's sign-ups are discrete events. An area or a line draws a slope
 * between two days and says the value passed through everything in between,
 * which for `0, 0, 3, 0` is a claim the data does not make. Columns say
 * "three on that day, none on the others" and nothing else.
 *
 * ## The hit target is the slot, not the bar
 *
 * An empty day is a 2px stub nobody can aim at, so each column's full-height
 * slot carries the hover. The bar then *responds* — it lightens and the rest
 * recede — so the reader sees which one they landed on.
 *
 * ## One series, so no legend
 *
 * The title names what is plotted; a legend box with a single swatch would
 * restate it. Only the busiest day is labelled — a number on every column is
 * chaos and goes unread, and the axis, the tooltip and the table carry the
 * rest.
 *
 * Colour is `--primary`, the theme's own hue, so the chart follows all four
 * themes with no second palette to keep in step. It clears 3:1 against the
 * card surface in every one of them, which is the check that applies to a lone
 * series; the chroma and lightness-band checks are for categorical palettes,
 * where several hues have to stay apart from each other and from gray.
 */
export function DayChart({ title, data, height = 132, dim = false }) {
  const [hover, setHover] = useState(null);
  const [asTable, setAsTable] = useState(false);
  const plotRef = useRef(null);

  const max = Math.max(1, ...data.map((d) => d.count));
  const total = data.reduce((n, d) => n + d.count, 0);
  const busiest = data.reduce((best, d) => (d.count > best.count ? d : best), data[0]);

  // "en-US" like `fmtLongDate` — every other date in this app is English, and
  // an axis that follows the machine while the sentence beside it does not is
  // the inconsistency people notice. Parsed at local midnight: a bare ISO day
  // is UTC, which shifts the label back a day west of Greenwich.
  const day = (iso) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

  const onMove = (event, d, index) => {
    const box = plotRef.current?.getBoundingClientRect();
    if (!box) return;
    setHover({ ...d, index, x: event.clientX - box.left });
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 10,
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{title}</div>
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
            {total} in {data.length} days
            {total > 0 && ` · busiest ${day(busiest.date)}, ${busiest.count}`}
          </div>
        </div>
        <button
          onClick={() => setAsTable((v) => !v)}
          className="nh-tap nh-tap-row"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            color: "var(--ink-3)",
            padding: "4px 8px",
            whiteSpace: "nowrap",
          }}
        >
          {asTable ? "Chart" : "Table"}
        </button>
      </div>

      {asTable ? (
        <Table data={data.filter((d) => d.count > 0)} day={day} />
      ) : (
        <div
          ref={plotRef}
          style={{
            position: "relative",
            // Held at reduced opacity while a new period loads: no skeleton,
            // no layout jump, no flash — the frame stays put.
            opacity: dim ? 0.4 : 1,
            transition: "opacity .18s ease",
          }}
          onMouseLeave={() => setHover(null)}
        >
          <Gridline value={max} top={0} />
          {/* Only when it is a different number: at max 1 the midpoint rounds
              back to 1, and two gridlines labelled the same say nothing twice. */}
          {Math.round(max / 2) > 0 && Math.round(max / 2) < max && (
            <Gridline value={Math.round(max / 2)} top="50%" muted />
          )}

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 2,
              height,
              position: "relative",
              zIndex: 1,
            }}
          >
            {data.map((d, i) => {
              const on = hover?.index === i;
              return (
                <div
                  key={d.date}
                  onMouseMove={(e) => onMove(e, d, i)}
                  style={{
                    flex: 1,
                    minWidth: 3,
                    maxWidth: 26,
                    height: "100%",
                    display: "flex",
                    alignItems: "flex-end",
                    cursor: "default",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: `${Math.max((d.count / max) * 100, d.count ? 3 : 1.5)}%`,
                      background: d.count ? "var(--primary)" : "var(--border)",
                      borderRadius: "4px 4px 0 0",
                      // The hovered mark lifts; the rest recede rather than
                      // the hovered one shouting.
                      opacity: !hover || on ? 1 : 0.4,
                      transition: "opacity .1s ease",
                    }}
                  />
                </div>
              );
            })}
          </div>

          {hover && (
            <Tooltip x={hover.x} label={day(hover.date)} value={hover.count} />
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11,
              color: "var(--ink-3)",
              paddingTop: 8,
            }}
          >
            <span>{day(data[0].date)}</span>
            <span>{day(data[data.length - 1].date)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/** Hairline, solid, recessive — never dashed, never competing with the data. */
function Gridline({ value, top, muted }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top,
        borderTop: "1px solid var(--border)",
        opacity: muted ? 0.55 : 1,
        pointerEvents: "none",
      }}
    >
      <span
        style={{
          position: "absolute",
          left: 0,
          top: -7,
          background: "var(--surface)",
          paddingRight: 5,
          fontSize: 10.5,
          color: "var(--ink-3)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * The readout follows the pointer.
 *
 * Value first and strong, label second and quiet: the legend's hierarchy
 * inverted, because here the reader already knows the series and wants the
 * number.
 */
function Tooltip({ x, label, value }) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        // Inside the plot, not above it: above is where the title and the
        // Table button live, and the readout was landing on them.
        top: 4,
        transform: "translateX(-50%)",
        pointerEvents: "none",
        background: "var(--toast-bg)",
        color: "var(--toast-ink)",
        padding: "6px 10px",
        borderRadius: 10,
        whiteSpace: "nowrap",
        boxShadow: "0 8px 20px -8px rgba(0,0,0,0.4)",
        zIndex: 3,
      }}
    >
      <span
        style={{
          fontSize: 15,
          fontWeight: 700,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
      <span style={{ fontSize: 11.5, opacity: 0.75, marginLeft: 6 }}>{label}</span>
    </div>
  );
}

/** The same numbers as text — the accessible reading of every chart here. */
function Table({ data, day }) {
  if (!data.length) {
    return (
      <div style={{ fontSize: 12.5, color: "var(--ink-3)", padding: "8px 2px" }}>
        Nothing in this window.
      </div>
    );
  }
  return (
    <div style={{ maxHeight: 176, overflowY: "auto" }} className="nh-scroll">
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
        <tbody>
          {data.map((d) => (
            <tr key={d.date}>
              <td style={{ padding: "5px 2px", color: "var(--ink-2)" }}>{day(d.date)}</td>
              <td
                style={{
                  padding: "5px 2px",
                  textAlign: "right",
                  color: "var(--ink)",
                  fontWeight: 600,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {d.count}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
