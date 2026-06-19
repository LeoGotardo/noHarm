import { useState, Fragment } from 'react'
import { BADGES } from './data.jsx'
import { Screen, Header, Avatar, Icon, Btn, Card, Field, BottomSheet, BadgeMedallion } from './ui.jsx'

export function PersonRow({ person, right, onClick, sub }) {
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '11px 4px', cursor: onClick ? 'pointer' : 'default' }}>
      <Avatar name={person.username} size={48} hue={person.hue} online={person.online} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15.5, fontWeight: 600, color: 'var(--ink)' }}>{person.username}</div>
        <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
          {sub ?? (
            <>
              <Icon name="flame" size={13} color="var(--primary)" sw={1.6} />
              <span>{person.streak} day streak</span>
              {person.online === false && person.lastSeen && <span>· {person.lastSeen}</span>}
            </>
          )}
        </div>
      </div>
      {right}
    </div>
  );
}

export function SegTabs({ tabs, active, onChange, counts = {} }) {
  return (
    <div style={{ display: 'flex', gap: 6, padding: '4px', background: 'var(--surface-2)', borderRadius: 14, margin: '0 20px' }}>
      {tabs.map(t => {
        const on = active === t.id;
        return (
          <button key={t.id} onClick={() => onChange(t.id)} style={{
            flex: 1, padding: '9px 8px', borderRadius: 11, border: 'none', cursor: 'pointer',
            background: on ? 'var(--surface)' : 'transparent', color: on ? 'var(--ink)' : 'var(--ink-3)',
            fontWeight: on ? 700 : 600, fontSize: 13.5, fontFamily: 'var(--font-body)',
            boxShadow: on ? '0 2px 8px -4px rgba(0,0,0,0.2)' : 'none', transition: 'all .18s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            {t.label}
            {counts[t.id] ? <span style={{ minWidth: 18, height: 18, padding: '0 5px', borderRadius: 99, background: on ? 'var(--accent)' : 'var(--ink-3)', color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{counts[t.id]}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

export function FriendsScreen({ friends, requestCount, onOpenRequests, onOpenSearch, onOpenProfile, onMessage }) {
  return (
    <Screen geo="friends" padTop={56}>
      <Header large title="Friends" sub={`${friends.length} in your circle`}
        right={<button onClick={onOpenSearch} style={{ width: 42, height: 42, borderRadius: 13, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Icon name="plus" size={22} color="var(--ink)" /></button>} />

      <div style={{ padding: '16px 20px 0' }}>
        {requestCount > 0 && (
          <Card pad={0} onClick={onOpenRequests} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 16px', marginBottom: 14, borderColor: 'var(--primary)' }}>
            <div style={{ position: 'relative', width: 40, height: 40, borderRadius: 12, background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="friends" size={21} color="var(--primary)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ink)' }}>{requestCount} friend request{requestCount > 1 ? 's' : ''}</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Tap to review</div>
            </div>
            <span style={{ minWidth: 22, height: 22, padding: '0 6px', borderRadius: 99, background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{requestCount}</span>
          </Card>
        )}

        {friends.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 24px' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <Icon name="friends" size={34} color="var(--ink-3)" />
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>Recovery is easier together</div>
            <div style={{ fontSize: 14, color: 'var(--ink-3)', marginTop: 8, lineHeight: 1.5, marginBottom: 20 }}>Add a friend to share milestones and check in on each other.</div>
            <Btn kind="primary" onClick={onOpenSearch} icon="search">Find friends</Btn>
          </div>
        ) : (
          <Card pad={6}>
            {friends.map((f, i) => (
              <Fragment key={f.id}>
                {i > 0 && <div style={{ height: 1, background: 'var(--border)', margin: '0 4px' }} />}
                <div style={{ padding: '0 8px' }}>
                  <PersonRow person={f} onClick={() => onOpenProfile(f.id)}
                    right={<button onClick={e => { e.stopPropagation(); onMessage(f.id); }} style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--primary-soft)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <Icon name="chat" size={19} color="var(--primary)" /></button>} />
                </div>
              </Fragment>
            ))}
          </Card>
        )}
      </div>
    </Screen>
  );
}

export function FriendRequests({ onBack, received, sent, onAccept, onDecline, onCancel, onOpenProfile }) {
  const [tab, setTab] = useState('received');
  const list = tab === 'received' ? received : sent;
  return (
    <Screen geo="friends" padTop={56}>
      <Header title="Requests" onBack={onBack} />
      <div style={{ paddingTop: 8 }}>
        <SegTabs tabs={[{ id: 'received', label: 'Received' }, { id: 'sent', label: 'Sent' }]} active={tab} onChange={setTab}
          counts={{ received: received.length }} />
      </div>
      <div style={{ padding: '16px 20px 0' }}>
        {list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--ink-3)' }}>
            <Icon name={tab === 'received' ? 'bell' : 'send'} size={34} color="var(--ink-3)" style={{ margin: '0 auto 14px' }} />
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-2)' }}>{tab === 'received' ? 'No new requests' : 'No pending requests'}</div>
            <div style={{ fontSize: 13.5, marginTop: 6 }}>{tab === 'received' ? "You're all caught up." : 'Requests you send will appear here.'}</div>
          </div>
        ) : (
          <Card pad={6}>
            {list.map((p, i) => (
              <Fragment key={p.id}>
                {i > 0 && <div style={{ height: 1, background: 'var(--border)', margin: '0 4px' }} />}
                <div style={{ padding: '0 8px' }}>
                  <PersonRow person={p} onClick={() => onOpenProfile(p.id)} sub={`${p.streak} day streak · ${p.when}`}
                    right={tab === 'received' ? (
                      <div style={{ display: 'flex', gap: 7 }}>
                        <button onClick={e => { e.stopPropagation(); onDecline(p.id); }} style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--surface-2)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          <Icon name="close" size={18} color="var(--ink-2)" sw={2.2} /></button>
                        <button onClick={e => { e.stopPropagation(); onAccept(p.id); }} style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--primary)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          <Icon name="check" size={19} color="var(--on-primary)" sw={2.6} /></button>
                      </div>
                    ) : (
                      <button onClick={e => { e.stopPropagation(); onCancel(p.id); }} style={{ padding: '8px 14px', borderRadius: 11, background: 'var(--surface-2)', border: 'none', color: 'var(--ink-2)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                    )} />
                </div>
              </Fragment>
            ))}
          </Card>
        )}
      </div>
    </Screen>
  );
}

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

export function PublicProfile({ onBack, person, relation, onMessage, onAdd, onAccept, onRemove, onBlock }) {
  const [menu, setMenu] = useState(false);
  const [rel, setRel] = useState(relation);
  const earnedBadges = BADGES.filter(b => b.milestone <= person.streak);
  return (
    <Screen geo="profile" padTop={56}>
      <Header title="" onBack={onBack}
        right={<button onClick={() => setMenu(true)} style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Icon name="gear" size={19} color="var(--ink-2)" /></button>} />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 24px 0', position: 'relative', zIndex: 1 }}>
        <Avatar name={person.username} size={104} hue={person.hue} online={person.online} />
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', marginTop: 14 }}>{person.username}</div>
        <div style={{ fontSize: 13.5, color: 'var(--ink-3)', marginTop: 3 }}>
          {rel === 'friend' ? (person.online ? 'Online now' : `Active ${person.lastSeen || 'recently'}`) : 'Friend to see activity'}
        </div>

        <Card style={{ width: '100%', marginTop: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '18px 16px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--display-weight)', fontSize: 30, color: 'var(--primary)', lineHeight: 1 }}>{person.streak}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 5 }}>day streak</div>
          </div>
          <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--border)', margin: '4px 0' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--display-weight)', fontSize: 30, color: 'var(--ink)', lineHeight: 1 }}>{earnedBadges.length}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 5 }}>badges earned</div>
          </div>
        </Card>

        {rel === 'friend' && earnedBadges.length > 0 && (
          <div style={{ width: '100%', marginTop: 14 }}>
            <div style={{ display: 'flex', gap: 14, padding: '4px 2px', overflowX: 'auto' }} className="nh-scroll">
              {earnedBadges.map(b => (
                <div key={b.id} style={{ flexShrink: 0, textAlign: 'center' }}>
                  <BadgeMedallion milestone={b.milestone} earned size={62} />
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ width: '100%', marginTop: 22 }}>
          {rel === 'friend' && <Btn kind="primary" size="lg" full icon="chat" onClick={onMessage}>Message</Btn>}
          {rel === 'none' && <Btn kind="primary" size="lg" full icon="plus" onClick={() => { setRel('pending_out'); onAdd && onAdd(); }}>Add friend</Btn>}
          {rel === 'pending_out' && <Btn kind="quiet" size="lg" full disabled>Request sent</Btn>}
          {rel === 'pending_in' && (
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn kind="outline" size="lg" full onClick={() => setRel('none')}>Decline</Btn>
              <Btn kind="primary" size="lg" full icon="check" onClick={() => { setRel('friend'); onAccept && onAccept(); }}>Accept</Btn>
            </div>
          )}
          {rel === 'blocked' && <Btn kind="quiet" size="lg" full disabled>Blocked</Btn>}
        </div>
      </div>

      <BottomSheet open={menu} onClose={() => setMenu(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', padding: '0 4px 8px' }}>{person.username}</div>
          {rel === 'friend' && (
            <SheetAction icon="trash" label="Remove friend" onClick={() => { setMenu(false); setRel('none'); onRemove && onRemove(); }} />
          )}
          <SheetAction icon="block" label="Block this user" danger onClick={() => { setMenu(false); setRel('blocked'); onBlock && onBlock(); }} />
          <div style={{ fontSize: 12.5, color: 'var(--ink-3)', padding: '8px 6px 0', lineHeight: 1.5 }}>
            Blocking removes them from your friends and hides your activity from each other.
          </div>
        </div>
      </BottomSheet>
    </Screen>
  );
}

export function SheetAction({ icon, label, onClick, danger }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 13, padding: '14px 8px', background: 'none', border: 'none', cursor: 'pointer',
      width: '100%', textAlign: 'left', borderRadius: 12, color: danger ? 'var(--accent-ink)' : 'var(--ink)', fontSize: 15.5, fontWeight: 600,
    }}>
      <Icon name={icon} size={21} color={danger ? 'var(--accent-ink)' : 'var(--ink-2)'} />{label}
    </button>
  );
}
