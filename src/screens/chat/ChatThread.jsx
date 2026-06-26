import { useState, useRef, useEffect } from 'react'
import { Avatar, Icon, Btn, GeoBackground } from '@ui'
import { hashHue } from '@components'
import { getUser } from '../../services/api/user.js'
import { sendMessage as apiSend } from '../../services/api/message.js'
import { startChat, acceptChat } from '../../services/api/chat.js'
import { joinChat, leaveChat, markRead, onTypingIndicator } from '../../services/ws/chat.js'
import { useChatThread } from '../../store/useChats.js'
import { Bubble } from './Bubble.jsx'
import { TypingBubble } from './TypingBubble.jsx'

export function ChatThread({ onBack, chat: initialChat, meId, onOpenProfile }) {
  const [chat, setChat]         = useState(initialChat)
  const [otherUser, setOtherUser] = useState(null)
  const [input, setInput]       = useState('')
  const [sending, setSending]   = useState(false)
  const [typing, setTyping]     = useState(false)
  const scrollRef = useRef(null)

  const otherId = chat.sender === meId ? chat.reciver : chat.sender
  const { messages: msgData, loading, refetch } = useChatThread(chat.id)
  const msgList = msgData?.messages ?? []

  const scrollDown = () => { const el = scrollRef.current; if (el) el.scrollTop = el.scrollHeight }
  useEffect(() => { scrollDown() }, [msgList.length, typing])

  useEffect(() => {
    if (!otherId) return
    getUser(otherId).then(setOtherUser).catch(() => {})
  }, [otherId])

  useEffect(() => {
    if (!chat.id) return
    try { joinChat(chat.id) } catch {}
    try { markRead(chat.id) } catch {}
    let unsub
    try {
      unsub = onTypingIndicator(({ chatId, userId, isTyping }) => {
        if (chatId === chat.id && userId !== meId) setTyping(isTyping)
      })
    } catch {}
    return () => {
      try { leaveChat(chat.id) } catch {}
      if (unsub) try { unsub() } catch {}
    }
  }, [chat.id])

  const send = async () => {
    if (!input.trim() || sending) return
    const content = input.trim()
    setInput('')
    setSending(true)
    try {
      let chatId = chat.id
      if (!chatId) {
        const newChat = await startChat(otherId)
        setChat(newChat)
        chatId = newChat.id
        try { joinChat(chatId) } catch {}
      }
      await apiSend(chatId, content)
      await refetch()
    } catch {}
    setSending(false)
  }

  const accept = async () => {
    if (!chat.id) return
    try {
      const updated = await acceptChat(chat.id)
      setChat(updated)
    } catch {}
  }

  const username = otherUser?.username ?? '…'
  const hue      = hashHue(otherUser?.username ?? otherId ?? '')
  const src      = otherUser?.profile_picture ?? null
  const ended    = chat.status === 0
  const pending  = chat.status === 4
  const iReceived = pending && chat.reciver === meId

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--bg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <GeoBackground screen="chat" />
      <div style={{ position: 'relative', zIndex: 2, paddingTop: 44, background: 'var(--banner-bg)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 14px 10px' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
            <Icon name="back" size={24} color="var(--ink)" sw={2.2} />
          </button>
          <div onClick={() => onOpenProfile(otherId)} style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, cursor: 'pointer' }}>
            <Avatar name={username} size={38} hue={hue} src={src} />
            <div>
              <div style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--ink)' }}>{username}</div>
              <div style={{ fontSize: 11.5, color: typing ? 'var(--primary)' : 'var(--ink-3)' }}>
                {typing ? 'typing…' : ended ? 'conversation ended' : pending ? 'pending' : 'online'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="nh-scroll" style={{ position: 'relative', zIndex: 1, flex: 1, overflowY: 'auto', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading && <div style={{ textAlign: 'center', padding: '24px', fontSize: 13, color: 'var(--ink-3)' }}>Loading…</div>}
        {!loading && msgList.length === 0 && !ended && (
          <div style={{ textAlign: 'center', padding: '40px 20px', fontSize: 13.5, color: 'var(--ink-3)', lineHeight: 1.5 }}>
            This is the beginning of your conversation with <strong style={{ color: 'var(--ink)' }}>{username}</strong>.
          </div>
        )}
        {msgList.map(m => <Bubble key={m.id} msg={m} mine={m.sender === meId} />)}
        {typing && <TypingBubble />}
        {ended && (
          <div style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--ink-3)', padding: '14px 20px', lineHeight: 1.5 }}>
            This conversation has ended. You can no longer send messages here.
          </div>
        )}
      </div>

      <div style={{ position: 'relative', zIndex: 2, background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '10px 14px 26px' }}>
        {ended ? (
          <div style={{ textAlign: 'center', color: 'var(--ink-3)', fontSize: 13.5, fontWeight: 600, padding: '8px' }}>
            Messaging unavailable
          </div>
        ) : iReceived ? (
          <div>
            <div style={{ fontSize: 13.5, color: 'var(--ink-2)', textAlign: 'center', marginBottom: 10, lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--ink)' }}>{username}</strong> wants to start a conversation.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn kind="outline" full onClick={onBack}>Ignore</Btn>
              <Btn kind="primary" full icon="check" onClick={accept}>Accept</Btn>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 9 }}>
            <div style={{ flex: 1, background: 'var(--surface-2)', borderRadius: 22, border: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="Message…"
                style={{ flex: 1, border: 'none', background: 'none', outline: 'none', padding: '12px 16px', fontSize: 15, color: 'var(--ink)', fontFamily: 'var(--font-body)' }}
              />
            </div>
            <button
              onClick={send}
              disabled={!input.trim() || sending}
              style={{ width: 46, height: 46, borderRadius: '50%', background: input.trim() ? 'var(--primary)' : 'var(--surface-2)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() ? 'pointer' : 'default', flexShrink: 0, transition: 'background .2s' }}
            >
              <Icon name="send" size={20} color={input.trim() ? 'var(--on-primary)' : 'var(--ink-3)'} fill={input.trim() ? 'var(--on-primary)' : 'none'} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
