import { Icon } from '@ui'

export function SheetAction({ icon, label, onClick, danger }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 13, padding: '14px 8px',
      background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
      borderRadius: 12, color: danger ? 'var(--accent-ink)' : 'var(--ink)', fontSize: 15.5, fontWeight: 600,
    }}>
      <Icon name={icon} size={21} color={danger ? 'var(--accent-ink)' : 'var(--ink-2)'} />{label}
    </button>
  )
}
