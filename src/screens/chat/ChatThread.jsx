import { useState, useRef, useEffect } from 'react'
import { Avatar, Icon, Btn, GeoBackground } from '../../ui/index.js'
import { PEOPLE } from '../../data/mock.js'

function Bubble({ msg, mine }) {
  return (
    <div style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', animation: 'nhRise .32s both' }}>
      <div style={{ maxWidth: '76%' }}>
        <div style={{
          padding: '10px 14px', borderRadius: 20, fontSize: 15, lineHeight: 1.4,
          background: mine ? 'var(--primary)' : 'var(--surface)',
          color: mine ? 'var(--on-primary)' : 'var(--ink)',
          borderBottomRightRadius: mine ? 6 : 20, borderBottomLeftRadius: mine ? 20 : 6,
          border: mine ? 'none' : '1px solid var(--border)',
          boxShadow: mine ? '0 4px 14px -8px var(--primary)' : '0 2px 8px -6px rgba(0,0,0,0.2)',
        }}>{msg.text}</div>
        <div style={{ fontSize: 10.5, color: 'var(--ink-3)', marginTop: 4, textAlign: mine ? 'right' : 'left', padding: '0 6px', display: 'flex', gap: 4, justifyContent: mine ? 'flex-end' : 'flex-start', alignItems: 'center' }}>
          {msg.time}
          {mine && (msg.read
            ? <span style={{ display: 'inline-flex', color: 'var(--primary)' }}><Icon name="check" size={13} color="var(--primary)" sw={2.6} /></span>
            : <span style={{ display: 'inline-flex', color: 'var(--ink-3)' }}><Icon name="check" size={13} color="var(--ink-3)" sw={2.2} /></span>)}
        </div>
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
      <div style={{ padding: '13px 16px', borderRadius: 20, borderBottomLeftRadius: 6, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', gap: 5 }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--ink-3)', animation: `nhTypeDot 1.2s ease-in-out ${i * 0.18}s infinite` }} />
        ))}
      </div>
    </div>
  );
}

function pickReply(text) {
  const t = text.toLowerCase();
  if (t.includes('relapse') || t.includes('hard') || t.includes('struggl')) return "I hear you. One moment at a time — I'm here.";
  if (t.includes('day') || t.includes('streak')) return "That's real progress. Proud of you. 💚";
  if (t.includes('thank')) return "Always. We've got each other.";
  const generic = ["I'm glad you reached out.", "Tell me more — I'm listening.", "You've got this, Alex.", "Sending strength your way."];
  return generic[Math.floor(Math.random() * generic.length)];
}

export function ChatThread({ onBack, chat, onOpenProfile }) {
  const p = PEOPLE[chat.with] || { username: chat.with, hue: 200 };
  const pending = chat.status === 'pending';
  const ended = chat.status === 'ended';
  const [msgs, setMsgs] = useState(chat.messages);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [accepted, setAccepted] = useState(!pending);
  const scrollRef = useRef(null);
  const scrollDown = () => { const el = scrollRef.current; if (el) el.scrollTop = el.scrollHeight; };
  useEffect(() => { scrollDown(); }, [msgs, typing]);

  const send = () => {
    if (!input.trim() || ended || !accepted) return;
    const text = input.trim();
    setInput('');
    setMsgs(m => [...m, { id: 'x' + Date.now(), from: 'me', text, time: 'now', read: false }]);
    setTimeout(() => setTyping(true), 700);
    setTimeout(() => {
      setTyping(false);
      setMsgs(m => [...m.map(x => x.from === 'me' ? { ...x, read: true } : x),
        { id: 'r' + Date.now(), from: chat.with, text: pickReply(text), time: 'now' }]);
    }, 2300);
  };

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--bg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <GeoBackground screen="chat" />
      <div style={{ position: 'relative', zIndex: 2, paddingTop: 44, background: 'var(--banner-bg)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 14px 10px' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}><Icon name="back" size={24} color="var(--ink)" sw={2.2} /></button>
          <div onClick={() => onOpenProfile(chat.with)} style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, cursor: 'pointer' }}>
            <Avatar name={p.username} size={38} hue={p.hue} online={p.online} />
            <div>
              <div style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--ink)' }}>{p.username}</div>
              <div style={{ fontSize: 11.5, color: typing ? 'var(--primary)' : 'var(--ink-3)' }}>
                {typing ? 'typing…' : ended ? 'conversation ended' : p.online ? 'online' : 'offline'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="nh-scroll" style={{ position: 'relative', zIndex: 1, flex: 1, overflowY: 'auto', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink-3)', fontWeight: 600, padding: '4px 0 8px' }}>{msgs[0]?.day || 'Today'}</div>
        {msgs.map(m => <Bubble key={m.id} msg={m} mine={m.from === 'me'} />)}
        {typing && <TypingBubble />}
        {ended && <div style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--ink-3)', padding: '14px 20px', lineHeight: 1.5 }}>This conversation has ended. You can no longer send messages here.</div>}
      </div>

      <div style={{ position: 'relative', zIndex: 2, background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '10px 14px 26px' }}>
        {ended ? (
          <div style={{ textAlign: 'center', color: 'var(--ink-3)', fontSize: 13.5, fontWeight: 600, padding: '8px' }}>Messaging unavailable</div>
        ) : pending && !accepted ? (
          <div>
            <div style={{ fontSize: 13.5, color: 'var(--ink-2)', textAlign: 'center', marginBottom: 10, lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--ink)' }}>{p.username}</strong> wants to start a conversation.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn kind="outline" full onClick={onBack}>Ignore</Btn>
              <Btn kind="primary" full icon="check" onClick={() => setAccepted(true)}>Accept</Btn>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 9 }}>
            <div style={{ flex: 1, background: 'var(--surface-2)', borderRadius: 22, border: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="Message…" style={{ flex: 1, border: 'none', background: 'none', outline: 'none', padding: '12px 16px', fontSize: 15, color: 'var(--ink)', fontFamily: 'var(--font-body)' }} />
            </div>
            <button onClick={send} disabled={!input.trim()} style={{ width: 46, height: 46, borderRadius: '50%', background: input.trim() ? 'var(--primary)' : 'var(--surface-2)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() ? 'pointer' : 'default', flexShrink: 0, transition: 'background .2s' }}>
              <Icon name="send" size={20} color={input.trim() ? 'var(--on-primary)' : 'var(--ink-3)'} fill={input.trim() ? 'var(--on-primary)' : 'none'} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
