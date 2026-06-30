import { Icon } from "@ui/Icon.jsx";

export function Toast({ text, icon = "check" }) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 110,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 85,
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: "11px 18px",
        borderRadius: 999,
        background: "var(--toast-bg)",
        color: "var(--toast-ink)",
        fontSize: 14,
        fontWeight: 600,
        boxShadow: "0 14px 34px -10px rgba(0,0,0,0.4)",
        whiteSpace: "nowrap",
        animation: "nhToastIn .4s cubic-bezier(.2,.8,.3,1) both",
      }}
    >
      <Icon name={icon} size={17} color="currentColor" />
      {text}
    </div>
  );
}
