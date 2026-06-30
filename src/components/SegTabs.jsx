export function SegTabs({ tabs, active, onChange, counts = {} }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        padding: "4px",
        background: "var(--surface-2)",
        borderRadius: 14,
        margin: "0 20px",
      }}
    >
      {tabs.map((t) => {
        const on = active === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
              flex: 1,
              padding: "9px 8px",
              borderRadius: 11,
              border: "none",
              cursor: "pointer",
              background: on ? "var(--surface)" : "transparent",
              color: on ? "var(--ink)" : "var(--ink-3)",
              fontWeight: on ? 700 : 600,
              fontSize: 13.5,
              fontFamily: "var(--font-body)",
              boxShadow: on ? "0 2px 8px -4px rgba(0,0,0,0.2)" : "none",
              transition: "all .18s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            {t.label}
            {counts[t.id] ? (
              <span
                style={{
                  minWidth: 18,
                  height: 18,
                  padding: "0 5px",
                  borderRadius: 99,
                  background: on ? "var(--accent)" : "var(--ink-3)",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {counts[t.id]}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
