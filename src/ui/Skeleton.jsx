export function Skeleton({ w = "100%", h = 16, r = 8, style }) {
  return (
    <div
      className="nh-shimmer"
      style={{ width: w, height: h, borderRadius: r, ...style }}
    />
  );
}
