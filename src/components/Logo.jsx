export function Logo({ size = 76, withText = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" fill="none" stroke="var(--primary)" strokeWidth="4" opacity="0.28" />
          <circle cx="50" cy="50" r="44" fill="none" stroke="var(--primary)" strokeWidth="5.5"
            strokeLinecap="round" strokeDasharray="276" strokeDashoffset="96" transform="rotate(-90 50 50)" />
          <path d="M34 51 L45 62 L68 38" fill="none" stroke="var(--primary)" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {withText && (
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--display-weight)', fontSize: 34, color: 'var(--ink)', letterSpacing: -0.5 }}>
          No<span style={{ color: 'var(--primary)' }}>Harm</span>
        </div>
      )}
    </div>
  )
}
