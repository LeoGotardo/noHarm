import { useState } from 'react'
import { Screen, Header, Card, Icon, Btn } from '../../ui/index.js'

export function StreakHistory({ onBack, streaks, currentDays, currentStart, empty }) {
  const [loadingMore, setLoadingMore] = useState(false);
  const list = empty ? [] : streaks;
  return (
    <Screen geo="history" padTop={56}>
      <Header title="Streak history" onBack={onBack} />
      <div style={{ padding: '14px 20px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {!empty && (
          <Card style={{ display: 'flex', alignItems: 'center', gap: 14, borderColor: 'var(--primary)', boxShadow: '0 0 0 1px var(--primary), 0 8px 24px -16px var(--primary)' }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="flame" size={24} color="var(--primary)" sw={1.4} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>{currentDays} days</span>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-soft)', padding: '2px 7px', borderRadius: 99 }}>ACTIVE</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 2 }}>Since {currentStart} · going strong</div>
            </div>
          </Card>
        )}

        {empty ? (
          <div style={{ textAlign: 'center', padding: '60px 30px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="flame" size={34} color="var(--primary)" sw={1.4} />
              </div>
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>Your first streak is still going strong!</div>
            <div style={{ fontSize: 14, color: 'var(--ink-3)', marginTop: 8, lineHeight: 1.5 }}>Past streaks will appear here. For now, focus on today.</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: 0.6, padding: '6px 4px 0' }}>Past streaks</div>
            {list.map((s, i) => (
              <Card key={s.id} pad={15} style={{ display: 'flex', alignItems: 'center', gap: 14, animation: 'nhRise .4s both', animationDelay: `${i * 0.04}s` }}>
                <div style={{ width: 44, height: 44, borderRadius: 13, background: 'var(--surface-2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--display-weight)', fontSize: 18, color: 'var(--ink)', lineHeight: 1 }}>{s.days}</span>
                  <span style={{ fontSize: 8.5, color: 'var(--ink-3)', fontWeight: 600 }}>DAYS</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink)' }}>{s.start} → {s.end}</span>
                  </div>
                  {s.record && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 5, fontSize: 11, fontWeight: 700, color: 'var(--accent-ink)', background: 'var(--accent-soft)', padding: '2px 8px', borderRadius: 99 }}>
                      <Icon name="badges" size={12} color="var(--accent-ink)" sw={1.6} fill="var(--accent-ink)" /> Record at the time
                    </div>
                  )}
                </div>
              </Card>
            ))}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px' }}>
              {loadingMore
                ? <span className="nh-spin" style={{ width: 22, height: 22, borderRadius: '50%', border: '2.5px solid var(--border)', borderTopColor: 'var(--primary)' }} />
                : <button onClick={() => { setLoadingMore(true); setTimeout(() => setLoadingMore(false), 1400); }}
                    style={{ background: 'none', border: 'none', color: 'var(--ink-3)', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 8 }}>Load older streaks</button>}
            </div>
          </>
        )}
      </div>
    </Screen>
  );
}
