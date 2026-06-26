export function StatTile({ value, label, accent }) {
  return (
    <div style={{ flex: 1, textAlign: 'center', padding: '4px 2px' }}>
      <div style={{
        fontFamily: 'var(--font-display)', fontWeight: 'var(--display-weight)', fontSize: 24,
        color: accent ? 'var(--primary)' : 'var(--ink)', lineHeight: 1,
      }}>{value}</div>
      <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 5, fontWeight: 500 }}>{label}</div>
    </div>
  )
}
