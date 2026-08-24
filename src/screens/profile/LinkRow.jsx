import { Icon } from "@ui";

export function LinkRow({ icon, label, onClick, danger, last, soon }) {
  return (
    <button
      onClick={soon ? undefined : onClick}
      disabled={soon}
      aria-disabled={soon || undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 13,
        padding: "14px 4px",
        background: "none",
        border: "none",
        width: "100%",
        textAlign: "left",
        cursor: soon ? "default" : "pointer",
        opacity: soon ? 0.55 : 1,
        borderBottom: last ? "none" : "1px solid var(--border)",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: danger ? "var(--accent-soft)" : "var(--surface-2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon
          name={icon}
          size={19}
          color={danger ? "var(--accent-ink)" : "var(--ink-2)"}
        />
      </div>
      <div
        style={{
          flex: 1,
          fontSize: 15,
          fontWeight: 600,
          color: danger ? "var(--accent-ink)" : "var(--ink)",
        }}
      >
        {label}
      </div>
      {soon ? (
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: 0.4,
            textTransform: "uppercase",
            color: "var(--ink-3)",
            background: "var(--surface-2)",
            padding: "3px 8px",
            borderRadius: 99,
          }}
        >
          Soon
        </span>
      ) : (
        !danger && <Icon name="chevR" size={17} color="var(--ink-3)" />
      )}
    </button>
  );
}
