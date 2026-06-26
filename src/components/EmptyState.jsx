import { Icon } from '@ui/Icon.jsx'

export function EmptyState({
  icon, iconBg, iconColor = 'var(--ink-3)', iconSize = 34, iconSw,
  round = false, title, sub, action, pad = '50px 24px',
}) {
  return (
    <div style={{ textAlign: 'center', padding: pad }}>
      {icon && (
        <div style={{
          width: 72, height: 72,
          borderRadius: round ? '50%' : 20,
          background: iconBg ?? 'var(--surface-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 18px',
        }}>
          <Icon name={icon} size={iconSize} color={iconColor} sw={iconSw} />
        </div>
      )}
      {title && <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>{title}</div>}
      {sub && <div style={{ fontSize: 14, color: 'var(--ink-3)', marginTop: 8, lineHeight: 1.5 }}>{sub}</div>}
      {action && <div style={{ marginTop: 20 }}>{action}</div>}
    </div>
  )
}
