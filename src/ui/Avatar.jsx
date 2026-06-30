export function Avatar({
  name = "?",
  src = null,
  size = 44,
  hue = 150,
  online,
  style,
}) {
  const letter = (name[0] || "?").toUpperCase();
  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        flexShrink: 0,
        ...style,
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: src ? "transparent" : `oklch(0.82 0.07 ${hue})`,
          color: `oklch(0.32 0.08 ${hue})`,
          fontWeight: 700,
          fontSize: size * 0.42,
          fontFamily: "var(--font-body)",
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.04)",
        }}
      >
        {src ? (
          <img
            src={src}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          letter
        )}
      </div>
      {online !== undefined && (
        <span
          style={{
            position: "absolute",
            right: -1,
            bottom: -1,
            width: size * 0.28,
            height: size * 0.28,
            borderRadius: "50%",
            background: online ? "oklch(0.7 0.16 150)" : "var(--ink-3)",
            border: "2.5px solid var(--surface)",
          }}
        />
      )}
    </div>
  );
}

export function OnlineDot({ online }) {
  return (
    <span
      style={{
        width: 9,
        height: 9,
        borderRadius: "50%",
        flexShrink: 0,
        background: online ? "oklch(0.7 0.16 150)" : "var(--ink-3)",
      }}
    />
  );
}
