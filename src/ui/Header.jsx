import { Icon } from './Icon.jsx'

export function Header({ title, onBack, right, sub, large }) {
  return (
    <div style={{ padding: '8px 20px 6px', display: 'flex', flexDirection: 'column', gap: large ? 6 : 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minHeight: 36 }}>
        {onBack && (
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, marginLeft: -6, display: 'flex' }}>
            <Icon name="back" size={24} color="var(--ink)" sw={2.2} />
          </button>
        )}
        {!large && <div style={{ flex: 1, fontSize: 18, fontWeight: 700, color: 'var(--ink)', textAlign: onBack ? 'center' : 'left', paddingRight: onBack ? 30 : 0 }}>{title}</div>}
        {!large && <div style={{ display: 'flex', gap: 6 }}>{right}</div>}
      </div>
      {large && (
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 'var(--display-weight)', color: 'var(--ink)', letterSpacing: -0.5, lineHeight: 1.05 }}>{title}</div>
            {sub && <div style={{ fontSize: 14, color: 'var(--ink-3)', marginTop: 3 }}>{sub}</div>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>{right}</div>
        </div>
      )}
    </div>
  );
}
