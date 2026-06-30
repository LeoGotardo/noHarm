export function Field({
  label,
  value,
  onChange,
  placeholder,
  error,
  hint,
  type = "text",
  onFocus,
  right,
}) {
  return (
    <label style={{ display: "block" }}>
      {label && (
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--ink-2)",
            marginBottom: 7,
            letterSpacing: 0.1,
          }}
        >
          {label}
        </div>
      )}
      <div
        style={{ position: "relative", display: "flex", alignItems: "center" }}
      >
        <input
          value={value}
          onChange={(e) => onChange && onChange(e.target.value)}
          placeholder={placeholder}
          type={type}
          onFocus={onFocus}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "14px 16px",
            fontSize: 16,
            fontFamily: "var(--font-body)",
            color: "var(--ink)",
            background: "var(--surface-2)",
            border: `1.5px solid ${error ? "var(--accent)" : "var(--border)"}`,
            borderRadius: 14,
            outline: "none",
          }}
        />
        {right && (
          <div style={{ position: "absolute", right: 12 }}>{right}</div>
        )}
      </div>
      {error && (
        <div
          style={{ fontSize: 12.5, color: "var(--accent-ink)", marginTop: 6 }}
        >
          {error}
        </div>
      )}
      {hint && !error && (
        <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 6 }}>
          {hint}
        </div>
      )}
    </label>
  );
}
