import { useState, useEffect, Fragment } from 'react'
import { Screen, Header, Icon, Card } from '../../ui/index.js'
import { getUser } from '../../services/api/user.js'
import { cacheRead, cacheWrite } from '../../store/cache.js'
import { PersonRow, SegTabs } from './FriendsScreen.jsx'

function fmtDate(iso) {
  if (!iso) return ''
  const diff = Math.floor((Date.now() - new Date(iso)) / 86_400_000)
  if (diff === 0) return 'today'
  if (diff === 1) return '1d ago'
  return `${diff}d ago`
}

async function enrichRequest(friendship, meId) {
  // For received: sender is the other person. For sent: reciver is the other person.
  const otherId = friendship.sender === meId ? friendship.reciver : friendship.sender
  const cacheKey = `user_${otherId}`
  const cached = cacheRead(cacheKey)
  const user = cached?.data ?? await getUser(otherId).then(u => { cacheWrite(cacheKey, u); return u }).catch(() => null)
  return {
    friendshipId: friendship.id,
    id: otherId,
    username: user?.username ?? otherId.slice(0, 8),
    profile_picture: user?.profile_picture ?? null,
    hue: hashHue(user?.username),
    streak: null,
    when: fmtDate(friendship.send_at ?? friendship.created_at),
  }
}

function hashHue(str = '') {
  let h = 0
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff
  return Math.abs(h) % 360
}

export function FriendRequests({ onBack, received, sent, meId, onAccept, onDecline, onCancel, onOpenProfile }) {
  const [tab, setTab]             = useState('received')
  const [enrichedRecv, setEnrichedRecv] = useState([])
  const [enrichedSent, setEnrichedSent] = useState([])

  useEffect(() => {
    if (!meId) return
    Promise.all(received.map(f => enrichRequest(f, meId))).then(setEnrichedRecv)
  }, [received, meId])

  useEffect(() => {
    if (!meId) return
    Promise.all(sent.map(f => enrichRequest(f, meId))).then(setEnrichedSent)
  }, [sent, meId])

  const list = tab === 'received' ? enrichedRecv : enrichedSent

  return (
    <Screen geo="friends" padTop={56}>
      <Header title="Requests" onBack={onBack} />
      <div style={{ paddingTop: 8 }}>
        <SegTabs tabs={[{ id: 'received', label: 'Received' }, { id: 'sent', label: 'Sent' }]} active={tab} onChange={setTab}
          counts={{ received: enrichedRecv.length }} />
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
              <Fragment key={p.friendshipId}>
                {i > 0 && <div style={{ height: 1, background: 'var(--border)', margin: '0 4px' }} />}
                <div style={{ padding: '0 8px' }}>
                  <PersonRow person={p} onClick={() => onOpenProfile(p.id)}
                    sub={p.when}
                    right={tab === 'received' ? (
                      <div style={{ display: 'flex', gap: 7 }}>
                        <button onClick={e => { e.stopPropagation(); onDecline(p.friendshipId) }} style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--surface-2)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          <Icon name="close" size={18} color="var(--ink-2)" sw={2.2} /></button>
                        <button onClick={e => { e.stopPropagation(); onAccept(p.friendshipId) }} style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--primary)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          <Icon name="check" size={19} color="var(--on-primary)" sw={2.6} /></button>
                      </div>
                    ) : (
                      <button onClick={e => { e.stopPropagation(); onCancel(p.friendshipId) }} style={{ padding: '8px 14px', borderRadius: 11, background: 'var(--surface-2)', border: 'none', color: 'var(--ink-2)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                    )} />
                </div>
              </Fragment>
            ))}
          </Card>
        )}
      </div>
    </Screen>
  )
}
