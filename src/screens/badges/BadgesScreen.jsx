import { Screen, Header, Card, Icon, BadgeMedallion } from '../../ui/index.js'

export function BadgesScreen({ badges, currentDays, onOpen }) {
  const earned = badges.filter(b => b.earned);
  const next = badges.find(b => !b.earned);
  return (
    <Screen geo="badges" padTop={56}>
      <Header large title="Badges" sub={`${earned.length} of ${badges.length} earned`} />

      {next && (
        <div style={{ padding: '14px 20px 0' }}>
          <Card style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <BadgeMedallion milestone={next.milestone} earned={false} size={64} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: 'var(--ink-3)', fontWeight: 600 }}>Next badge</div>
              <div style={{ fontSize: 16.5, fontWeight: 700, color: 'var(--ink)' }}>{next.name}</div>
              <div style={{ marginTop: 9 }}>
                <div style={{ height: 7, borderRadius: 99, background: 'var(--ring-track)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, (currentDays / next.milestone) * 100)}%`, background: 'var(--primary)', borderRadius: 99, transition: 'width 1s cubic-bezier(.3,.8,.3,1)' }} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6 }}>{next.milestone - currentDays} days to go</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 14 }}>All milestones</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
          {badges.map((b, i) => (
            <button key={b.id} onClick={() => onOpen(b.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, padding: 0, animation: 'nhPop .5s both', animationDelay: `${i * 0.05}s` }}>
              <BadgeMedallion milestone={b.milestone} earned={!!b.earned} size={82} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: b.earned ? 'var(--ink)' : 'var(--ink-3)' }}>{b.name}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>{b.earned ? b.earned.split(',')[0] : 'Locked'}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </Screen>
  );
}
