export function BottomSheet({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 90,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.42)",
          animation: "nhFade .3s both",
        }}
      />
      <div
        style={{
          position: "relative",
          background: "var(--surface)",
          borderRadius: "28px 28px 0 0",
          padding: "12px 22px 36px",
          boxShadow: "0 -10px 40px -8px rgba(0,0,0,0.3)",
          animation: "nhSheetIn .42s cubic-bezier(.2,.85,.3,1) both",
        }}
      >
        <div
          style={{
            width: 40,
            height: 5,
            borderRadius: 99,
            background: "var(--border)",
            margin: "0 auto 18px",
          }}
        />
        {children}
      </div>
    </div>
  );
}
