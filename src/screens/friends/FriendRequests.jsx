import { useState, Fragment } from 'react'
import { Screen, Header, Icon, Card } from '../../ui/index.js'
import { PersonRow, SegTabs } from './FriendsScreen.jsx'

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
