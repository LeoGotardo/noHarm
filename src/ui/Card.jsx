import { useGuardedCallback } from "./guards.js";

export function Card({ children, style, onClick, pad = 18 }) {
  // Tappable cards navigate; two taps would push the same screen twice.
  const run = useGuardedCallback(onClick);
  return (
    <div
      className={onClick ? "nh-tap nh-tap-card" : undefined}
      onClick={onClick ? run : undefined}
      style={{
        background: "var(--surface)",
        borderRadius: 22,
        padding: pad,
        boxShadow:
          "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px -16px rgba(0,0,0,0.18)",
        border: "1px solid var(--border)",
        cursor: onClick ? "pointer" : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
