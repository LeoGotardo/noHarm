import { useState, useEffect } from 'react'
import { Icon, Btn } from '@ui'
import { Screen, Header, BadgeMedallion } from '@components'

export function BadgeDetail({ onBack, badge, currentDays, justUnlocked }) {
  const earned = !!badge.earned;
  const [ripple, setRipple] = useState(justUnlocked);
  useEffect(() => {
    if (justUnlocked) { const t = setTimeout(() => setRipple(false), 1200); return () => clearTimeout(t); }
  }, [justUnlocked]);
  const pct = Math.min(100, (currentDays / badge.milestone) * 100);
  return (
    <Screen geo="badgeDetail" padTop={56} pulseKey={justUnlocked ? 1 : 0}>
      <Header title="" onBack={onBack} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 30px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ position: 'relative', marginBottom: 8 }}>
          {ripple && [0, 1].map(i => (
            <span key={i} style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid var(--primary)', animation: `nhCheckRipple 1.1s ${i * 0.25}s ease-out both` }} />
          ))}
          <div style={{ animation: justUnlocked ? 'nhPop .6s both' : 'none' }}>
            <BadgeMedallion milestone={badge.milestone} earned={earned} size={150} />
          </div>
        </div>

        {justUnlocked && (
          <div className="nh-rise" style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: 1.5, color: 'var(--primary)', textTransform: 'uppercase', marginTop: 18 }}>Badge unlocked</div>
        )}
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--display-weight)', fontSize: 30, color: 'var(--ink)', marginTop: 10, letterSpacing: -0.4 }}>{badge.name}</div>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--primary)', marginTop: 4 }}>{badge.milestone} clean {badge.milestone === 1 ? 'day' : 'days'}</div>
        <div style={{ fontSize: 15, color: 'var(--ink-2)', marginTop: 16, lineHeight: 1.55, maxWidth: 300 }}>{badge.desc}</div>

        {earned ? (
          <div style={{ marginTop: 22, display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 99, background: 'var(--primary-soft)', color: 'var(--primary)', fontSize: 13.5, fontWeight: 700 }}>
            <Icon name="check" size={16} color="var(--primary)" sw={2.6} /> Earned {badge.earned}
          </div>
        ) : (
          <div style={{ marginTop: 24, width: '100%', maxWidth: 280 }}>
            <div style={{ height: 8, borderRadius: 99, background: 'var(--ring-track)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: 'var(--primary)', borderRadius: 99, transition: 'width 1s' }} />
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 9 }}>
              <strong style={{ color: 'var(--ink)' }}>{badge.milestone - currentDays} days</strong> to go · keep showing up
            </div>
          </div>
        )}
      </div>

      {earned && (
        <div style={{ padding: '0 24px 16px', position: 'relative', zIndex: 1 }}>
          <Btn kind="soft" full icon="share">Share this milestone</Btn>
        </div>
      )}
    </Screen>
  );
}
