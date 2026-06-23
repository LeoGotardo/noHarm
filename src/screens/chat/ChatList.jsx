import { Fragment, useState, useEffect, useRef } from 'react'
import { Screen, Header, Avatar, Icon, Card } from '../../ui/index.js'
import { getUser } from '../../services/api/user.js'

function hashHue(str = '') {
  let h = 0
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff
  return Math.abs(h) % 360
}

function fmtTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function ChatList({ chats, meId, onOpen, onOpenProfile }) {
  const [users, setUsers] = useState({})
  const fetched = useRef(new Set())

  useEffect(() => {
    chats.forEach(c => {
      const id = c.sender === meId ? c.reciver : c.sender
      if (!id || fetched.current.has(id)) return
      fetched.current.add(id)
      getUser(id).then(u => setUsers(prev => ({ ...prev, [id]: u }))).catch(() => {})
    })
  }, [chats, meId])

  const active = chats.filter(c => c.status !== 0)
  const ended  = chats.filter(c => c.status === 0)

  function Row({ c }) {
    const otherId  = c.sender === meId ? c.reciver : c.sender
    const u        = users[otherId]
    const username = u?.username ?? '…'
    const hue      = hashHue(u?.username ?? otherId ?? '')
    const src      = u?.profile_picture ?? null
    const pending  = c.status === 4
    const lastMsg  = c.lastMessage ?? c.messages?.messages?.slice(-1)[0]
    const lastText = lastMsg?.message ?? ''
    const lastTime = fmtTime(lastMsg?.send_at ?? lastMsg?.created_at)
    const unread   = (c.messages?.messages ?? []).filter(m => m.status === 7 && m.sender !== meId).length

    return (
      <div onClick={() => onOpen(c.id)} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '12px 8px', cursor: 'pointer' }}>
        <div onClick={e => { e.stopPropagation(); onOpenProfile(otherId) }} style={{ cursor: 'pointer' }}>
          <Avatar name={username} size={52} hue={hue} src={src} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 15.5, fontWeight: unread ? 700 : 600, color: 'var(--ink)' }}>{username}</span>
            {pending && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-ink)', background: 'var(--accent-soft)', padding: '2px 7px', borderRadius: 99 }}>PENDING</span>}
          </div>
          <div style={{ fontSize: 13.5, color: unread ? 'var(--ink-2)' : 'var(--ink-3)', fontWeight: unread ? 600 : 400, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {lastText || (pending ? 'Wants to start a conversation' : 'No messages yet')}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{lastTime}</span>
          {unread > 0 && <span style={{ minWidth: 20, height: 20, padding: '0 6px', borderRadius: 99, background: 'var(--primary)', color: 'var(--on-primary)', fontSize: 11.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unread}</span>}
        </div>
      </div>
    )
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
                  {ended.map((c, i) => (
                    <Fragment key={c.id}>
                      {i > 0 && <div style={{ height: 1, background: 'var(--border)', margin: '0 8px' }} />}
                      <Row c={c} />
                    </Fragment>
                  ))}
                </Card>
              </>
            )}
          </>
        )}
      </div>
    </Screen>
  )
}
