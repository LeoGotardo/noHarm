import { GeoBackground } from "@ui/GeoBackground.jsx";

/**
 * The frame every screen sits in: full-bleed background, one scroll area.
 *
 * The scroll area spans the whole shell so the scrollbar stays at the window
 * edge, but its children are capped at `--content-max` and centred. That one
 * wrapper is what makes seventeen phone-shaped screens readable on a desktop
 * — without it a 1600px window stretches a chat row across the monitor.
 *
 * The wrapper is itself `flex: 1` and a column, because several screens rely
 * on being a flex child of the scroller (`flex: 1` to fill the viewport,
 * `margin-top: auto` to pin a footer) and inserting a plain div between them
 * and the scroller would silently break that.
 */
export function Screen({
  geo,
  pulseKey,
  children,
  scrollRef,
  padTop = 52,
  padBottom = "var(--pad-bottom)",
  noScroll,
  // Forms read better narrower than a list does. `--form-max` is 100% below
  // the breakpoint, so this changes nothing on a phone.
  maxWidth = "var(--content-max)",
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "var(--bg)",
        overflow: "hidden",
      }}
    >
      {geo && <GeoBackground screen={geo} pulseKey={pulseKey} />}
      <div
        ref={scrollRef}
        className="nh-scroll"
        style={{
          position: "relative",
          zIndex: 1,
          height: "100%",
          overflowY: noScroll ? "hidden" : "auto",
          overflowX: "hidden",
          paddingTop: padTop,
          paddingBottom: padBottom,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth,
            margin: "0 auto",
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
