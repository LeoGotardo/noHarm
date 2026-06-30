import { fmtTime } from "@components";
import { Icon } from "@ui";

export function Bubble({ msg, mine }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: mine ? "flex-end" : "flex-start",
        animation: "nhRise .32s both",
      }}
    >
      <div style={{ maxWidth: "76%" }}>
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 20,
            fontSize: 15,
            lineHeight: 1.4,
            background: mine ? "var(--primary)" : "var(--surface)",
            color: mine ? "var(--on-primary)" : "var(--ink)",
            borderBottomRightRadius: mine ? 6 : 20,
            borderBottomLeftRadius: mine ? 20 : 6,
            border: mine ? "none" : "1px solid var(--border)",
            boxShadow: mine
              ? "0 4px 14px -8px var(--primary)"
              : "0 2px 8px -6px rgba(0,0,0,0.2)",
          }}
        >
          {msg.message}
        </div>
        <div
          style={{
            fontSize: 10.5,
            color: "var(--ink-3)",
            marginTop: 4,
            textAlign: mine ? "right" : "left",
            padding: "0 6px",
            display: "flex",
            gap: 4,
            justifyContent: mine ? "flex-end" : "flex-start",
            alignItems: "center",
          }}
        >
          {fmtTime(msg.send_at ?? msg.created_at)}
          {mine &&
            (msg.status === 8 ? (
              <span style={{ display: "inline-flex" }}>
                <Icon name="check" size={13} color="var(--primary)" sw={2.6} />
              </span>
            ) : (
              <span style={{ display: "inline-flex" }}>
                <Icon name="check" size={13} color="var(--ink-3)" sw={2.2} />
              </span>
            ))}
        </div>
      </div>
    </div>
  );
}
