import { useState, Fragment } from 'react'
import { Screen, Header, Icon, Card, Field } from '../../ui/index.js'
import { PersonRow } from './FriendsScreen.jsx'

export function FriendSearch({ onBack, pool, onOpenProfile, onSendRequest }) {
  const [q, setQ] = useState('');
  const [sentTo, setSentTo] = useState({});
  const trimmed = q.trim().toLowerCase();
  const results = trimmed.length < 2 ? [] : pool.filter(p => p.username.toLowerCase().includes(trimmed));
  return (
    <Screen geo="friends" padTop={56}>
      <Header title="Add friends" onBack={onBack} />
      <div style={{ padding: '12px 20px 0' }}>
        <Field value={q} onChange={setQ} placeholder="Search by username…"
          right={<Icon name="search" size={18} color="var(--ink-3)" />} />
      </div>
      <div style={{ padding: '16px 20px 0' }}>
        {trimmed.length < 2 ? (
          <div style={{ textAlign: 'center', padding: '50px 30px', color: 'var(--ink-3)' }}>
            <Icon name="search" size={32} color="var(--ink-3)" style={{ margin: '0 auto 14px' }} />
            <div style={{ fontSize: 14, lineHeight: 1.5 }}>Type at least 2 characters to search.<br />Usernames are private — only exact matches show.</div>
          </div>
        ) : results.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 30px', color: 'var(--ink-3)' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-2)' }}>No one found</div>
            <div style={{ fontSize: 13.5, marginTop: 6 }}>No user matches "{q}".</div>
          </div>
        ) : (
          <Card pad={6}>
            {results.map((p, i) => {
              const rel = sentTo[p.id] ? 'pending' : p.rel;
              return (
                <Fragment key={p.id}>
                  {i > 0 && <div style={{ height: 1, background: 'var(--border)', margin: '0 4px' }} />}
                  <div style={{ padding: '0 8px' }}>
                    <PersonRow person={p} onClick={() => onOpenProfile(p.id)}
                      right={
                        rel === 'friend' ? <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="check" size={15} color="var(--primary)" sw={2.4} />Friends</span>
                        : rel === 'pending' ? <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-3)' }}>Requested</span>
                        : <button onClick={e => { e.stopPropagation(); setSentTo(s => ({ ...s, [p.id]: true })); onSendRequest(p.id); }}
                            style={{ padding: '8px 16px', borderRadius: 12, background: 'var(--primary)', border: 'none', color: 'var(--on-primary)', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Icon name="plus" size={15} color="var(--on-primary)" sw={2.4} />Add</button>
                      } />
                  </div>
                </Fragment>
              );
            })}
          </Card>
        )}
      </div>
    </Screen>
  );
}
