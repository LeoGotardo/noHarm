import { Icon } from '@ui/Icon.jsx'

export function Banner({ icon = 'bell', title, body, onTap, onClose }) {
  return (
    <div onClick={onTap} style={{
      position: 'absolute', top: 56, left: 12, right: 12, zIndex: 80,
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
      borderRadius: 18, cursor: 'pointer',
      background: 'var(--banner-bg)', backdropFilter: 'blur(20px) saturate(160%)',
      WebkitBackdropFilter: 'blur(20px) saturate(160%)',
      boxShadow: '0 12px 32px -10px rgba(0,0,0,0.28), inset 0 0 0 1px var(--border)',
      animation: 'nhBannerIn .45s cubic-bezier(.2,.8,.3,1) both',
    }}>
      <div style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--primary-soft)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={icon} size={20} color="var(--primary)" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{title}</div>
        <div style={{ fontSize: 13, color: 'var(--ink-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{body}</div>
      </div>
      <button onClick={e => { e.stopPropagation(); onClose && onClose(); }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
        <Icon name="close" size={16} color="var(--ink-3)" />
      </button>
    </div>
  );
}
