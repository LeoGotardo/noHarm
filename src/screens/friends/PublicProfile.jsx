import { useState } from 'react'
import { Screen, Header, Avatar, Icon, Btn, Card, BadgeMedallion, BottomSheet } from '../../ui/index.js'
import { BADGES } from '../../data/mock.js'

function SheetAction({ icon, label, onClick, danger }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 13, padding: '14px 8px',
      background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
      borderRadius: 12, color: danger ? 'var(--accent-ink)' : 'var(--ink)', fontSize: 15.5, fontWeight: 600,
    }}>
      <Icon name={icon} size={21} color={danger ? 'var(--accent-ink)' : 'var(--ink-2)'} />{label}
    </button>
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
          {rel === 'friend'       && <Btn kind="primary" size="lg" full icon="chat" onClick={onMessage}>Message</Btn>}
          {rel === 'none'         && <Btn kind="primary" size="lg" full icon="plus" onClick={() => { setRel('pending_out'); onAdd && onAdd(); }}>Add friend</Btn>}
          {rel === 'pending_out'  && <Btn kind="quiet" size="lg" full disabled>Request sent</Btn>}
          {rel === 'pending_in'   && (
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
