import { Icon } from "@ui";

export function LinkRow({ icon, label, onClick, danger, last }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 13,
        padding: "14px 4px",
        background: "none",
        border: "none",
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
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
      {!danger && <Icon name="chevR" size={17} color="var(--ink-3)" />}
    </button>
  );
}
