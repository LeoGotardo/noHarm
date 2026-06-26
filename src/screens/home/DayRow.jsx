import { Icon } from '@ui'
import { fmtShortDay } from '@components'

export function DayRow({ date, checked, time, onToggle, onTimeChange }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 0',
      borderBottom: '1px solid var(--border)',
    }}>
      <button
        onClick={onToggle}
        style={{
          width: 26, height: 26, borderRadius: 8, border: '2px solid',
          borderColor: checked ? 'var(--accent)' : 'var(--border)',
          background: checked ? 'var(--accent)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0, transition: 'all .15s',
        }}
      >
        {checked && <Icon name="check" size={14} color="#fff" sw={2.8} />}
      </button>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14.5, fontWeight: checked ? 700 : 500, color: checked ? 'var(--ink)' : 'var(--ink-2)' }}>
          {fmtShortDay(date)}
        </div>
        {checked && (
          <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="history" size={13} color="var(--ink-3)" />
            <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Approximate time:</span>
            <input
              type="time"
              value={time}
              onChange={e => onTimeChange(e.target.value)}
              onClick={e => e.stopPropagation()}
              style={{
                border: 'none', background: 'var(--surface-2)', borderRadius: 7,
                padding: '2px 8px', fontSize: 13, color: 'var(--ink)', fontFamily: 'var(--font-body)',
                cursor: 'pointer',
              }}
            />
          </div>
        )}
      </div>

      {checked && (
        <span style={{
          fontSize: 11, fontWeight: 700, color: 'var(--accent-ink)',
          background: 'var(--accent-soft)', padding: '2px 8px', borderRadius: 99,
        }}>
          setback
        </span>
      )}
    </div>
  )
}
