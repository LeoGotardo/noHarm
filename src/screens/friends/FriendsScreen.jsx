import { Fragment, useState, useEffect } from 'react'
import { Screen, Header, Avatar, Icon, Btn, Card } from '../../ui/index.js'
import { getUser } from '../../services/api/user.js'
import { cacheRead, cacheWrite } from '../../store/cache.js'

function hashHue(str = '') {
  let h = 0
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff
  return Math.abs(h) % 360
}

async function enrichFriendship(friendship, meId) {
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
    online: false,
    streak: null,
  }
}

export function PersonRow({ person, right, onClick, sub }) {
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '11px 4px', cursor: onClick ? 'pointer' : 'default' }}>
      <Avatar name={person.username} size={48} hue={person.hue} online={person.online} src={person.profile_picture} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15.5, fontWeight: 600, color: 'var(--ink)' }}>{person.username}</div>
        <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
          {sub ?? (person.streak != null ? (
            <>
              <Icon name="flame" size={13} color="var(--primary)" sw={1.6} />
              <span>{person.streak} day streak</span>
              {person.online === false && person.lastSeen && <span>· {person.lastSeen}</span>}
            </>
          ) : (
            <span>{person.online ? 'Online now' : 'Offline'}</span>
          ))}
        </div>
      </div>
      {right}
    </div>
  )
}

export function SegTabs({ tabs, active, onChange, counts = {} }) {
  return (
    <div style={{ display: 'flex', gap: 6, padding: '4px', background: 'var(--surface-2)', borderRadius: 14, margin: '0 20px' }}>
      {tabs.map(t => {
        const on = active === t.id
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
        )
      })}
    </div>
  )
}

export function FriendsScreen({ friends, meId, requestCount, onOpenRequests, onOpenSearch, onOpenProfile, onMessage }) {
  const [enriched, setEnriched] = useState([])

  useEffect(() => {
    if (!meId || !friends.length) { setEnriched([]); return }
    Promise.all(friends.map(f => enrichFriendship(f, meId))).then(setEnriched)
  }, [friends, meId])

  return (
    <Screen geo="friends" padTop={56}>
      <Header large title="Friends" sub={`${enriched.length} in your circle`}
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

        {enriched.length === 0 ? (
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
            {enriched.map((f, i) => (
              <Fragment key={f.id}>
                {i > 0 && <div style={{ height: 1, background: 'var(--border)', margin: '0 4px' }} />}
                <div style={{ padding: '0 8px' }}>
                  <PersonRow person={f} onClick={() => onOpenProfile(f.id)}
                    right={<button onClick={e => { e.stopPropagation(); onMessage(f.id) }} style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--primary-soft)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <Icon name="chat" size={19} color="var(--primary)" /></button>} />
                </div>
              </Fragment>
            ))}
          </Card>
        )}
      </div>
    </Screen>
  )
}
