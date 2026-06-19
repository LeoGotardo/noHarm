import { useState, useEffect } from 'react'
import { GeoBackground } from './geo.jsx'

export const cx = (...a) => a.filter(Boolean).join(' ');

const ICONS = {
  home:    'M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10',
  friends: 'M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19M9.5 10.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM20 19v-1.4a3.5 3.5 0 0 0-2.6-3.4M15.5 4.7a3 3 0 0 1 0 5.8',
  chat:    'M5 5h14v10H9l-4 4V5Z',
  badges:  'M12 14.5 7.5 17l1-5.2L4.7 8l5.3-.7L12 2.5l2 4.8 5.3.7-3.8 3.8 1 5.2z',
  profile: 'M12 12.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1',
  check:   'M4 12.5 9 17.5 20 6.5',
  plus:    'M12 5v14M5 12h14',
  search:  'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-3.5-3.5',
  back:    'M15 4 7 12l8 8',
  send:    'M4 11.5 20 4l-7.5 16-2.2-6.3L4 11.5Z',
  lock:    'M6.5 10.5V8a5.5 5.5 0 0 1 11 0v2.5M5 10.5h14v9H5z',
  bell:    'M6 16V10a6 6 0 1 1 12 0v6l2 2H4l2-2ZM10 20a2 2 0 0 0 4 0',
  close:   'M6 6l12 12M18 6 6 18',
  edit:    'M4 20h4L19 9l-4-4L4 16v4ZM14 6l4 4',
  gear:    'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z M19.5 12a7.5 7.5 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-2-1.2l-.4-2.6h-4l-.4 2.6a7.6 7.6 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.6 7.6 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 0 0 2 1.2l.4 2.6h4l.4-2.6a7.6 7.6 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.06-.4.1-.8.1-1.2Z',
  logout:  'M14 8V5H5v14h9v-3M10 12h11M18 9l3 3-3 3',
  chevR:   'M9 5l7 7-7 7',
  history: 'M12 7v5l3 2M4 12a8 8 0 1 1 2.5 5.8M4 12H7M4 12V9',
  heart:   'M12 20s-7-4.5-7-9.5A3.5 3.5 0 0 1 12 7a3.5 3.5 0 0 1 7 3.5C19 15.5 12 20 12 20Z',
  block:   'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM5.6 5.6l12.8 12.8',
  trash:   'M5 7h14M9 7V5h6v2M6 7l1 13h10l1-13',
  flame:   'M12 3c1.5 3-1.5 4.5-1.5 7A2.5 2.5 0 0 0 13 12c.5-1 .3-2 .3-2 1.7 1.2 2.7 3 2.7 5a4 4 0 1 1-8 0c0-3 2-5 4-12Z',
  camera:  'M4 8h3l1.5-2h7L17 8h3v11H4zM12 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  share:   'M4 11.5 20 4l-7.5 16-2.2-6.3L4 11.5Z',
};

export function Icon({ name, size = 22, color = 'currentColor', sw = 1.8, fill = 'none', style }) {
  const d = ICONS[name] || '';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} style={{ display: 'block', flexShrink: 0, ...style }}>
      {d.split(' M').map((seg, i) => (
        <path key={i} d={(i ? 'M' : '') + seg} stroke={color} strokeWidth={sw}
          strokeLinecap="round" strokeLinejoin="round" fill="none" />
      ))}
    </svg>
  );
}

export function Avatar({ name = '?', src = null, size = 44, hue = 150, online, style }) {
  const letter = (name[0] || '?').toUpperCase();
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0, ...style }}>
      <div style={{
        width: size, height: size, borderRadius: '50%', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: src ? 'transparent' : `oklch(0.82 0.07 ${hue})`,
        color: `oklch(0.32 0.08 ${hue})`, fontWeight: 700, fontSize: size * 0.42,
        fontFamily: 'var(--font-body)', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.04)',
      }}>
        {src ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : letter}
      </div>
      {online !== undefined && (
        <span style={{
          position: 'absolute', right: -1, bottom: -1, width: size * 0.28, height: size * 0.28,
          borderRadius: '50%', background: online ? 'oklch(0.7 0.16 150)' : 'var(--ink-3)',
          border: '2.5px solid var(--surface)',
        }} />
      )}
    </div>
  );
}

export function OnlineDot({ online }) {
  return <span style={{
    width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
    background: online ? 'oklch(0.7 0.16 150)' : 'var(--ink-3)',
  }} />;
}

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
    primary:  { background: 'var(--primary)', color: 'var(--on-primary)', boxShadow: '0 6px 18px -8px var(--primary)' },
    soft:     { background: 'var(--primary-soft)', color: 'var(--primary)' },
    ghost:    { background: 'transparent', color: 'var(--ink-2)' },
    outline:  { background: 'transparent', color: 'var(--ink)', boxShadow: 'inset 0 0 0 1.5px var(--border)' },
    quiet:    { background: 'var(--surface-2)', color: 'var(--ink-2)' },
    danger:   { background: 'var(--accent-soft)', color: 'var(--accent-ink)' },
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

export function Card({ children, style, onClick, pad = 18 }) {
  return <div onClick={onClick} style={{
    background: 'var(--surface)', borderRadius: 22, padding: pad,
    boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 8px 24px -16px rgba(0,0,0,0.18)',
    border: '1px solid var(--border)', cursor: onClick ? 'pointer' : undefined, ...style,
  }}>{children}</div>;
}

export function Field({ label, value, onChange, placeholder, error, hint, type = 'text', onFocus, right }) {
  return (
    <label style={{ display: 'block' }}>
      {label && <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 7, letterSpacing: 0.1 }}>{label}</div>}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input value={value} onChange={e => onChange && onChange(e.target.value)} placeholder={placeholder} type={type} onFocus={onFocus}
          style={{
            width: '100%', boxSizing: 'border-box', padding: '14px 16px', fontSize: 16,
            fontFamily: 'var(--font-body)', color: 'var(--ink)', background: 'var(--surface-2)',
            border: `1.5px solid ${error ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 14, outline: 'none',
          }} />
        {right && <div style={{ position: 'absolute', right: 12 }}>{right}</div>}
      </div>
      {error && <div style={{ fontSize: 12.5, color: 'var(--accent-ink)', marginTop: 6 }}>{error}</div>}
      {hint && !error && <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 6 }}>{hint}</div>}
    </label>
  );
}

export function Banner({ icon = 'bell', title, body, onTap, onClose, tone = 'primary' }) {
  return (
    <div onClick={onTap} style={{
      position: 'absolute', top: 56, left: 12, right: 12, zIndex: 80,
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
      borderRadius: 18, cursor: 'pointer',
      background: 'var(--banner-bg)', backdropFilter: 'blur(20px) saturate(160%)', WebkitBackdropFilter: 'blur(20px) saturate(160%)',
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
      <button onClick={e => { e.stopPropagation(); onClose && onClose(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
        <Icon name="close" size={16} color="var(--ink-3)" />
      </button>
    </div>
  );
}

export function Toast({ text, icon = 'check' }) {
  return <div style={{
    position: 'absolute', bottom: 110, left: '50%', transform: 'translateX(-50%)', zIndex: 85,
    display: 'flex', alignItems: 'center', gap: 9, padding: '11px 18px', borderRadius: 999,
    background: 'var(--toast-bg)', color: 'var(--toast-ink)', fontSize: 14, fontWeight: 600,
    boxShadow: '0 14px 34px -10px rgba(0,0,0,0.4)', whiteSpace: 'nowrap',
    animation: 'nhToastIn .4s cubic-bezier(.2,.8,.3,1) both',
  }}>
    <Icon name={icon} size={17} color="currentColor" />{text}
  </div>;
}

export function BottomSheet({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 90, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.42)', animation: 'nhFade .3s both' }} />
      <div style={{
        position: 'relative', background: 'var(--surface)', borderRadius: '28px 28px 0 0',
        padding: '12px 22px calc(22px + env(safe-area-inset-bottom))', boxShadow: '0 -10px 40px -8px rgba(0,0,0,0.3)',
        animation: 'nhSheetIn .42s cubic-bezier(.2,.85,.3,1) both', paddingBottom: 36,
      }}>
        <div style={{ width: 40, height: 5, borderRadius: 99, background: 'var(--border)', margin: '0 auto 18px' }} />
        {children}
      </div>
    </div>
  );
}

export function StreakRing({ days, milestone, label, sub, size = 232, display, recordPill }) {
  const stroke = 13;
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const pct = Math.min(1, days / milestone);
  const [anim, setAnim] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnim(pct), 220);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ring-track)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--primary)" strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - anim)}
          style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(.3,.8,.3,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {recordPill}
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--display-weight)', fontSize: size * 0.4,
          lineHeight: 1, color: 'var(--ink)', letterSpacing: -1 }}>{display ?? days}</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-2)', marginTop: 4 }}>{label}</div>
        {sub && <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 3 }}>{sub}</div>}
      </div>
    </div>
  );
}

export function BadgeMedallion({ milestone, earned, size = 84, hue }) {
  const ringColor = earned ? 'var(--primary)' : 'var(--ink-3)';
  const faceBg = earned ? 'var(--primary-soft)' : 'var(--surface-2)';
  const txt = earned ? 'var(--primary)' : 'var(--ink-3)';
  return (
    <div style={{ position: 'relative', width: size, height: size, filter: earned ? 'none' : 'grayscale(0.4)', opacity: earned ? 1 : 0.7 }}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        <g fill="none" stroke={ringColor} strokeWidth="2.5" opacity={earned ? 0.9 : 0.5}>
          <circle cx="50" cy="50" r="46" />
          <circle cx="50" cy="50" r="38" strokeDasharray="2 5" strokeLinecap="round" />
        </g>
        <circle cx="50" cy="50" r="33" fill={faceBg} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: size * 0.26, color: txt, lineHeight: 1 }}>
          {milestone >= 365 ? '1' : milestone}
        </div>
        <div style={{ fontSize: size * 0.105, fontWeight: 700, color: txt, letterSpacing: 1, textTransform: 'uppercase', marginTop: 1 }}>
          {milestone >= 365 ? 'year' : milestone >= 30 ? 'days' : milestone === 1 ? 'day' : 'days'}
        </div>
      </div>
      {!earned && (
        <div style={{ position: 'absolute', right: -2, bottom: -2, width: size * 0.34, height: size * 0.34, borderRadius: '50%',
          background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="lock" size={size * 0.18} color="var(--ink-3)" sw={2} />
        </div>
      )}
    </div>
  );
}

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

export function TabBar({ active, onChange, badges = {} }) {
  const tabs = [
    { id: 'home', icon: 'home', label: 'Home' },
    { id: 'friends', icon: 'friends', label: 'Friends' },
    { id: 'chat', icon: 'chat', label: 'Chat' },
    { id: 'badges', icon: 'badges', label: 'Badges' },
    { id: 'profile', icon: 'profile', label: 'Profile' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 40,
      display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start',
      padding: '10px 8px 26px', background: 'var(--tabbar-bg)',
      backdropFilter: 'blur(22px) saturate(170%)', WebkitBackdropFilter: 'blur(22px) saturate(170%)',
      borderTop: '1px solid var(--border)',
    }}>
      {tabs.map(t => {
        const on = active === t.id;
        const badge = badges[t.id];
        return (
          <button key={t.id} onClick={() => onChange(t.id)} style={{
            background: 'none', border: 'none', cursor: 'pointer', flex: 1,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '4px 0', position: 'relative',
          }}>
            <div style={{ position: 'relative' }}>
              <Icon name={t.icon} size={25} color={on ? 'var(--primary)' : 'var(--ink-3)'} sw={on ? 2.1 : 1.8}
                fill={on ? 'var(--primary-soft)' : 'none'} />
              {badge ? (
                <span style={{
                  position: 'absolute', top: -5, right: -8, minWidth: 17, height: 17, padding: '0 4px',
                  borderRadius: 99, background: 'var(--accent)', color: '#fff', fontSize: 10.5, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--tabbar-solid)',
                }}>{badge}</span>
              ) : null}
            </div>
            <span style={{ fontSize: 10.5, fontWeight: on ? 700 : 500, color: on ? 'var(--primary)' : 'var(--ink-3)' }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Skeleton({ w = '100%', h = 16, r = 8, style }) {
  return <div className="nh-shimmer" style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

export function Screen({ geo, pulseKey, children, scrollRef, padTop = 52, padBottom = 96, noScroll }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--bg)', overflow: 'hidden' }}>
      {geo && <GeoBackground screen={geo} pulseKey={pulseKey} />}
      <div ref={scrollRef} className="nh-scroll" style={{
        position: 'relative', zIndex: 1, height: '100%',
        overflowY: noScroll ? 'hidden' : 'auto', overflowX: 'hidden',
        paddingTop: padTop, paddingBottom: padBottom,
        display: 'flex', flexDirection: 'column',
      }}>
        {children}
      </div>
    </div>
  );
}

export { GeoBackground }
