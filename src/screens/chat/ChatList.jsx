import { Fragment } from 'react'
import { Screen, Header, Avatar, Icon, Card } from '../../ui/index.js'
import { PEOPLE } from '../../data/mock.js'

export function ChatList({ chats, onOpen, onOpenProfile }) {
  const active = chats.filter(c => c.status !== 'ended');
  const ended = chats.filter(c => c.status === 'ended');

  function Row({ c }) {
    const p = PEOPLE[c.with] || { username: c.with, hue: 200 };
    const pending = c.status === 'pending';
    return (
      <div onClick={() => onOpen(c.id)} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '12px 8px', cursor: 'pointer' }}>
        <Avatar name={p.username} size={52} hue={p.hue} online={p.online} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 15.5, fontWeight: c.unread ? 700 : 600, color: 'var(--ink)' }}>{p.username}</span>
            {pending && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-ink)', background: 'var(--accent-soft)', padding: '2px 7px', borderRadius: 99 }}>PENDING</span>}
          </div>
          <div style={{ fontSize: 13.5, color: c.unread ? 'var(--ink-2)' : 'var(--ink-3)', fontWeight: c.unread ? 600 : 400, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {c.last}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{c.lastTime}</span>
          {c.unread ? <span style={{ minWidth: 20, height: 20, padding: '0 6px', borderRadius: 99, background: 'var(--primary)', color: 'var(--on-primary)', fontSize: 11.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{c.unread}</span> : null}
        </div>
      </div>
    );
  }

  return (
    <Screen geo="chat" padTop={56}>
      <Header large title="Messages" sub={`${active.length} conversation${active.length !== 1 ? 's' : ''}`} />
      <div style={{ padding: '16px 20px 0' }}>
        {chats.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 24px' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <Icon name="chat" size={32} color="var(--ink-3)" />
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>No conversations yet</div>
            <div style={{ fontSize: 14, color: 'var(--ink-3)', marginTop: 8, lineHeight: 1.5 }}>Message a friend to start a supportive chat.</div>
          </div>
        ) : (
          <>
            <Card pad={6}>
              {active.map((c, i) => (
                <Fragment key={c.id}>
                  {i > 0 && <div style={{ height: 1, background: 'var(--border)', margin: '0 8px' }} />}
                  <Row c={c} />
                </Fragment>
              ))}
            </Card>
            {ended.length > 0 && (
              <>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: 0.6, padding: '20px 6px 8px' }}>Ended</div>
                <Card pad={6} style={{ opacity: 0.72 }}>
                  {ended.map(c => <Row key={c.id} c={c} />)}
                </Card>
              </>
            )}
          </>
        )}
      </div>
    </Screen>
  );
}
