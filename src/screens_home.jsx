import { useState } from 'react'
import { ME } from './data.jsx'
import { Screen, Header, Card, Icon, Btn, StreakRing, Avatar } from './ui.jsx'

function StatTile({ value, label, accent }) {
  return (
    <div style={{ flex: 1, textAlign: 'center', padding: '4px 2px' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--display-weight)', fontSize: 24,
        color: accent ? 'var(--primary)' : 'var(--ink)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 5, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

export function Dashboard({ days, checkedIn, milestone, startLabel, personalRecord, totalStreaks,
  nextBadgeName, onCheckIn, onRelapse, onOpenHistory, pulseKey }) {
  const isRecord = days >= personalRecord;
  const toRecord = personalRecord - days;
  return (
    <Screen geo="home" pulseKey={pulseKey} padTop={64}>
      <div style={{ padding: '0 22px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', fontWeight: 500 }}>Good morning,</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>{ME.username}</div>
        </div>
        <Avatar name={ME.username} size={42} hue={ME.color} />
      </div>

      <div style={{ padding: '14px 0 6px' }}>
        <StreakRing days={days} milestone={milestone} label={days === 1 ? 'clean day' : 'clean days'}
          sub={days === 0 ? 'A fresh start begins now' : `Since ${startLabel}`}
          recordPill={isRecord ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 99,
              background: 'var(--primary-soft)', color: 'var(--primary)', fontSize: 11, fontWeight: 700, marginBottom: 8 }}>
              <Icon name="flame" size={13} color="var(--primary)" sw={1.6} /> PERSONAL BEST
            </div>
          ) : null} />
      </div>

      <div style={{ textAlign: 'center', padding: '2px 32px 18px', fontSize: 13.5, color: 'var(--ink-2)' }}>
        {isRecord
          ? <>You're in record territory — keep going.</>
          : <><strong style={{ color: 'var(--primary)', fontWeight: 700 }}>{milestone - days} days</strong> to your <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>{nextBadgeName}</strong> badge · {toRecord} to your record</>}
      </div>

      <div style={{ padding: '0 22px' }}>
        {checkedIn ? (
          <div className="nh-rise" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '15px',
            borderRadius: 18, background: 'var(--primary-soft)', color: 'var(--primary)', fontWeight: 700, fontSize: 16.5,
          }}>
            <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'nhPop .5s both' }}>
              <Icon name="check" size={16} color="var(--on-primary)" sw={3} />
            </span>
            Checked in today
          </div>
        ) : (
          <Btn kind="primary" size="lg" full onClick={onCheckIn} icon="check">Check in for today</Btn>
        )}
      </div>

      <div style={{ padding: '20px 22px 0' }}>
        <Card pad={16} style={{ display: 'flex', alignItems: 'stretch' }}>
          <StatTile value={days} label="Current" accent />
          <div style={{ width: 1, background: 'var(--border)', margin: '4px 0' }} />
          <StatTile value={personalRecord} label="Personal best" />
          <div style={{ width: 1, background: 'var(--border)', margin: '4px 0' }} />
          <StatTile value={totalStreaks} label="Total streaks" />
        </Card>
      </div>

      <div style={{ padding: '12px 22px 0' }}>
        <Card pad={0} onClick={onOpenHistory} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 16px' }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="history" size={20} color="var(--ink-2)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>Streak history</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{totalStreaks} streaks · best {personalRecord} days</div>
          </div>
          <Icon name="chevR" size={18} color="var(--ink-3)" />
        </Card>
      </div>

      <div style={{ padding: '18px 22px 0', textAlign: 'center' }}>
        <button onClick={onRelapse} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', fontSize: 13.5, fontWeight: 600, padding: 8, textDecoration: 'underline', textUnderlineOffset: 3 }}>
          I relapsed
        </button>
      </div>
    </Screen>
  );
}

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
