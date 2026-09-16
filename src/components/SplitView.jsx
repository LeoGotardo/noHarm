import { EmptyState } from "./EmptyState.jsx";

/**
 * A list beside the thing it opens — the desktop half of the push/pop model.
 *
 * Both panes hold a `<Screen>`, which is `position: absolute; inset: 0`, so
 * each gets its own positioned box to fill. Navigation is untouched: the
 * detail is still the top of the stack and its back arrow still pops. All that
 * changes is that the master stays on screen instead of being covered.
 */
export function SplitView({ master, detail, detailKey }) {
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex" }}>
      <div
        style={{
          position: "relative",
          width: "var(--master-w)",
          flexShrink: 0,
          overflow: "hidden",
          borderRight: "1px solid var(--border)",
          // The pane is its own little viewport: the column must not try to be
          // 860px wide inside 380, and the gutter belongs to the pane.
          "--content-max": "100%",
          "--pad-x": "18px",
        }}
      >
        {master}
      </div>
      <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>
        {/* Only the detail animates when the selection changes; re-running the
            entry animation on the list every time you click a row is noise. */}
        <div
          key={detailKey}
          style={{
            position: "absolute",
            inset: 0,
            animation: "nhScreenIn .28s cubic-bezier(.2,.8,.3,1) both",
          }}
        >
          {detail}
        </div>
      </div>
    </div>
  );
}

/** The detail pane before anything is selected. */
export function NoSelection({ icon = "chat", title, sub }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <EmptyState icon={icon} round title={title} sub={sub} />
    </div>
  );
}
