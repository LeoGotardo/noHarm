import { useState, useEffect } from 'react'
import { Icon } from '@ui/Icon.jsx'

export function StreakRing({ days, milestone, label, sub, size = 232, display, recordPill }) {
  const stroke = 13;
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const pct = milestone > 0 ? Math.min(1, days / milestone) : 0;
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

export function BadgeMedallion({ milestone, earned, size = 84 }) {
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
          {milestone >= 365 ? 'year' : milestone === 1 ? 'day' : 'days'}
        </div>
      </div>
      {!earned && (
        <div style={{ position: 'absolute', right: -2, bottom: -2, width: size * 0.34, height: size * 0.34,
          borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="lock" size={size * 0.18} color="var(--ink-3)" sw={2} />
        </div>
      )}
    </div>
  );
}
