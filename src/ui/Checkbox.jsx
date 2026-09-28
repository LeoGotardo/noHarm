import { Icon } from "./Icon.jsx";

/**
 * A labelled checkbox.
 *
 * Built rather than reached for because the app had none: every yes/no in it
 * until now was a `ToggleRow`, which is a switch — a setting you change, not an
 * answer you give. Consent is the second kind, and a switch that happens to be
 * on is not a thing anyone agreed to.
 *
 * The whole row is the hit target, `sub` carries the explanation, and `error`
 * is what the register screen turns on when someone submits without ticking.
 */
export function Checkbox({ checked, onChange, label, sub, error, disabled }) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 11,
        padding: "11px 12px",
        borderRadius: 14,
        background: "var(--surface-2)",
        border: `1.5px solid ${error ? "var(--accent)" : "var(--border)"}`,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        // Off-screen rather than display:none — a hidden input is skipped by
        // assistive tech and by tab order, and this is the control being
        // labelled.
        style={{
          position: "absolute",
          opacity: 0,
          width: 1,
          height: 1,
          pointerEvents: "none",
        }}
      />
      <span
        aria-hidden="true"
        style={{
          width: 21,
          height: 21,
          flexShrink: 0,
          marginTop: 1,
          borderRadius: 7,
          background: checked ? "var(--primary)" : "var(--surface)",
          border: checked
            ? "1.5px solid var(--primary)"
            : `1.5px solid ${error ? "var(--accent)" : "var(--border)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background .15s, border-color .15s",
        }}
      >
        {checked && (
          <Icon name="check" size={14} color="var(--on-primary)" sw={3} />
        )}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: "block",
            fontSize: 14,
            lineHeight: 1.45,
            color: "var(--ink)",
            fontWeight: 500,
          }}
        >
          {label}
        </span>
        {sub && (
          <span
            style={{
              display: "block",
              fontSize: 12.5,
              lineHeight: 1.45,
              color: "var(--ink-3)",
              marginTop: 3,
            }}
          >
            {sub}
          </span>
        )}
      </span>
    </label>
  );
}
