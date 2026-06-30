import { Icon } from "@ui";

export function SummaryLine({ icon, color, text }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 0",
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          background: color + "22",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon name={icon} size={18} color={color} sw={1.6} />
      </div>
      <span style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.4 }}>
        {text}
      </span>
    </div>
  );
}
