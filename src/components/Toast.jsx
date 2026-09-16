import { Icon } from "@ui/Icon.jsx";

export function Toast({ text, icon = "check" }) {
  return (
    <div
      style={{
        position: "absolute",
        // Clears the tab bar on a phone (96 + 14) and sits just off the bottom
        // edge on a desktop, where there is no bar to clear.
        bottom: "calc(var(--pad-bottom) + 14px)",
        left: "calc(50% + var(--nav-offset) / 2)",
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
