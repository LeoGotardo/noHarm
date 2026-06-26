import { Fragment, useState, useEffect, useRef } from 'react'
import { Card, SectionLabel, Divider } from '@ui'
import { Screen, Header, EmptyState } from '@components'
import { getUser } from '../../services/api/user.js'
import { ChatRow } from './ChatRow.jsx'

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

  return (
    <Screen geo="chat" padTop={56}>
      <Header large title="Messages" sub={`${active.length} conversation${active.length !== 1 ? 's' : ''}`} />
      <div style={{ padding: '16px 20px 0' }}>
        {chats.length === 0 ? (
          <EmptyState
            icon="chat" iconSize={32} round
            title="No conversations yet"
            sub="Message a friend to start a supportive chat."
          />
        ) : (
          <>
            <Card pad={6}>
              {active.map((c, i) => (
                <Fragment key={c.id}>
                  {i > 0 && <Divider margin="0 8px" />}
                  <ChatRow c={c} meId={meId} users={users} onOpen={onOpen} onOpenProfile={onOpenProfile} />
                </Fragment>
              ))}
            </Card>
            {ended.length > 0 && (
              <>
                <SectionLabel style={{ padding: '20px 6px 8px' }}>Ended</SectionLabel>
                <Card pad={6} style={{ opacity: 0.72 }}>
                  {ended.map((c, i) => (
                    <Fragment key={c.id}>
                      {i > 0 && <Divider margin="0 8px" />}
                      <ChatRow c={c} meId={meId} users={users} onOpen={onOpen} onOpenProfile={onOpenProfile} />
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
