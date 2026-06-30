export function SectionLabel({ children, style }) {
  return (
    <div
      style={{
        fontSize: 12.5,
        fontWeight: 700,
        color: "var(--ink-3)",
        textTransform: "uppercase",
        letterSpacing: 0.6,
        padding: "0 4px 6px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
