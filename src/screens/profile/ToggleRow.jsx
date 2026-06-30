import { Icon } from "@ui";

export function ToggleRow({ icon, label, sub, value, onChange, disabled }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 13,
        padding: "13px 4px",
        opacity: disabled ? 0.45 : 1,
        transition: "opacity .2s",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: "var(--surface-2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name={icon} size={19} color="var(--ink-2)" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>
          {label}
        </div>
        {sub && (
          <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 1 }}>
            {sub}
          </div>
        )}
      </div>
      <button
        onClick={() => !disabled && onChange(!value)}
        disabled={disabled}
        style={{
          width: 50,
          height: 30,
          borderRadius: 99,
          border: "none",
          cursor: disabled ? "default" : "pointer",
          background: value && !disabled ? "var(--primary)" : "var(--border)",
          position: "relative",
          transition: "background .2s",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 3,
            left: value && !disabled ? 23 : 3,
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "#fff",
            transition: "left .2s cubic-bezier(.3,.8,.3,1)",
            boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
          }}
        />
      </button>
    </div>
  );
}
