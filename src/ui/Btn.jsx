import { Icon } from './Icon.jsx'

export function Btn({ children, kind = 'primary', size = 'md', full, onClick, disabled, loading, style, icon }) {
  const pad = size === 'lg' ? '16px 22px' : size === 'sm' ? '9px 14px' : '13px 18px';
  const fs = size === 'lg' ? 18 : size === 'sm' ? 14 : 16;
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9,
    padding: pad, fontSize: fs, fontWeight: 600, fontFamily: 'var(--font-body)',
    borderRadius: 16, border: 'none', cursor: disabled ? 'default' : 'pointer',
    width: full ? '100%' : undefined, letterSpacing: 0.1, whiteSpace: 'nowrap',
    transition: 'transform .12s ease, filter .15s ease, background .15s ease',
    opacity: disabled ? 0.5 : 1, position: 'relative',
  };
  const kinds = {
    primary: { background: 'var(--primary)', color: 'var(--on-primary)', boxShadow: '0 6px 18px -8px var(--primary)' },
    soft:    { background: 'var(--primary-soft)', color: 'var(--primary)' },
    ghost:   { background: 'transparent', color: 'var(--ink-2)' },
    outline: { background: 'transparent', color: 'var(--ink)', boxShadow: 'inset 0 0 0 1.5px var(--border)' },
    quiet:   { background: 'var(--surface-2)', color: 'var(--ink-2)' },
    danger:  { background: 'var(--accent-soft)', color: 'var(--accent-ink)' },
  };
  return (
    <button onClick={disabled || loading ? undefined : onClick} disabled={disabled}
      onMouseDown={e => !disabled && (e.currentTarget.style.transform = 'scale(0.97)')}
      onMouseUp={e => (e.currentTarget.style.transform = '')}
      onMouseLeave={e => (e.currentTarget.style.transform = '')}
      style={{ ...base, ...kinds[kind], ...style }}>
      {loading
        ? <span className="nh-spin" style={{ width: fs, height: fs, borderRadius: '50%',
            border: '2.5px solid currentColor', borderTopColor: 'transparent', opacity: .9 }} />
        : <>{icon && <Icon name={icon} size={fs + 2} color="currentColor" />}{children}</>}
    </button>
  );
}
