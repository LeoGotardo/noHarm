export function TypingBubble() {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
      <div style={{ padding: '13px 16px', borderRadius: 20, borderBottomLeftRadius: 6, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', gap: 5 }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--ink-3)', animation: `nhTypeDot 1.2s ease-in-out ${i * 0.18}s infinite` }} />
        ))}
      </div>
    </div>
  )
}
