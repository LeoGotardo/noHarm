import { useState, useEffect, useCallback } from 'react'
import { getChats, getChat } from '../services/api/chat.js'
import { tokens } from '../connectors/tokens.js'
import { getMessages } from '../services/api/message.js'
import { onMessage, onMessagesRead } from '../services/ws/chat.js'
import { cacheRead, cacheWrite } from './cache.js'

const emptyChats = { chats: [], total: 0 }
const emptyMsgs  = { messages: [], total: 0 }

export function useChats() {
  const [chats, setChats]   = useState(() => cacheRead('chats')?.data ?? emptyChats)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tokens.getAccess()) { setLoading(false); return }
    getChats()
      .then(data => { console.log('[useChats] chats:', data); setChats(data); cacheWrite('chats', data) })
      .finally(() => setLoading(false))

    try {
      // Update last message preview in chat list without full refetch
      const unsub = onMessage(({ message }) => {
        setChats(prev => ({
          ...prev,
          chats: prev.chats.map(c =>
            c.id === message.chat
              ? { ...c, lastMessage: message }
              : c
          ),
        }))
      })
      return unsub
    } catch {}
  }, [])

  return { chats, loading }
}

/** Load messages for a single open chat thread. */
export function useChatThread(chatId) {
  const cacheKey = `messages_${chatId}`
  const [messages, setMessages] = useState(() => cacheRead(cacheKey)?.data ?? emptyMsgs)
  const [loading, setLoading]   = useState(true)

  const fetchMessages = useCallback(async () => {
    const data = await getMessages(chatId)
    console.log(`[useChatThread] messages (chat ${chatId}):`, data)
    setMessages(data)
    cacheWrite(cacheKey, data)
  }, [chatId])

  useEffect(() => {
    fetchMessages().finally(() => setLoading(false))

    try {
      const unsubs = [
        // Append incoming message to thread
        onMessage(({ message }) => {
          if (message.chat !== chatId) return
          setMessages(prev => ({
            messages: [...prev.messages, message],
            total: prev.total + 1,
          }))
          cacheWrite(cacheKey, messages)
        }),
        // Mark all messages as read when other user reads
        onMessagesRead(({ chatId: cid }) => {
          if (cid !== chatId) return
          setMessages(prev => ({
            ...prev,
            messages: prev.messages.map(m => ({ ...m, status: 8 })),
          }))
        }),
      ]
      return () => unsubs.forEach(u => u())
    } catch {}
  }, [chatId])

  return { messages, loading, refetch: fetchMessages }
}
