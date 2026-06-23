import { useState, useEffect, useMemo } from 'react'
import { Banner, Toast, BottomSheet, TabBar, Icon, Btn, Screen } from './ui/index.js'
import { SplashScreen } from './screens/auth/SplashScreen.jsx'
import { RegisterScreen } from './screens/auth/RegisterScreen.jsx'
import { LoginScreen } from './screens/auth/LoginScreen.jsx'
import { Dashboard } from './screens/home/Dashboard.jsx'
import { StreakHistory } from './screens/home/StreakHistory.jsx'
import { CheckInModal } from './screens/home/CheckInModal.jsx'
import { FriendsScreen } from './screens/friends/FriendsScreen.jsx'
import { FriendRequests } from './screens/friends/FriendRequests.jsx'
import { FriendSearch } from './screens/friends/FriendSearch.jsx'
import { PublicProfile } from './screens/friends/PublicProfile.jsx'
import { ChatList } from './screens/chat/ChatList.jsx'
import { ChatThread } from './screens/chat/ChatThread.jsx'
import { BadgesScreen } from './screens/badges/BadgesScreen.jsx'
import { BadgeDetail } from './screens/badges/BadgeDetail.jsx'
import { MyProfile } from './screens/profile/MyProfile.jsx'
import { EditProfile } from './screens/profile/EditProfile.jsx'
import { Settings } from './screens/profile/Settings.jsx'
import { useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakToggle } from './dev/TweaksPanel.jsx'
import { tokens } from './connectors/tokens.js'
import { useUser } from './store/useUser.js'
import { useStreak } from './store/useStreak.js'
import { useFriends } from './store/useFriends.js'
import { useChats } from './store/useChats.js'
import { useBadges } from './store/useBadges.js'

const TWEAK_DEFAULTS = {
  direction: 'sage',
  mode: 'light',
  motion: true,
  accentName: 'warm',
};

export default function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const dir  = t.direction;
  const mode = t.mode;

  // ── Data hooks ──────────────────────────────────────────────────────────────
  const { me, refetch: refetchMe } = useUser()
  const { streak, record, days, checkedIn, needsCheckin, missedDays, lastCheckinDate, checkIn, relapse: doRelapse, performCheckin, loading: streakLoading } = useStreak()
  const { friends: friendshipData, requestsReceived: reqRecvData, requestsSent: reqSentData, refetch: refetchFriends } = useFriends()
  const { chats: chatData } = useChats()
  const { badges: badgeData } = useBadges()

  // ── Derived data ─────────────────────────────────────────────────────────────
  const chatList  = chatData.chats  ?? []
  const badgeList = badgeData.badges ?? []

  // Accepted friends (status 5)
  const friends      = friendshipData.friendships?.filter(f => f.status === 5) ?? []
  const reqReceived  = reqRecvData.friendships ?? []
  const reqSent      = reqSentData.friendships ?? []

  // Unread count: messages with status 7 (unread) sent by someone else
  const chatUnread = useMemo(() =>
    chatList.reduce((n, c) => {
      const msgs = c.messages?.messages ?? []
      return n + msgs.filter(m => m.status === 7 && m.sender !== me?.id).length
    }, 0)
  , [chatList, me])

  // Badge milestone: API stores milestone as ISO datetime; days since epoch ÷ 86400
  // Compare by converting streak days to epoch days from streak start
  const liveBadges = badgeList.map(b => {
    const milestoneDays = typeof b.milestone === 'number'
      ? b.milestone
      : Math.floor(new Date(b.milestone).getTime() / 86_400_000)
    const earned = days >= milestoneDays
    return { ...b, earned: earned ? (b.given_at ?? todayLabel()) : null }
  })
  const badgeCount = liveBadges.filter(b => b.earned).length
  const nextBadge  = liveBadges.find(b => !b.earned) ?? liveBadges[liveBadges.length - 1]
  const milestone  = nextBadge?.milestone ?? 0

  // Format streak start as readable label
  const startLabel = streak?.start
    ? new Date(streak.start).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '—'

  const personalRecord = record ? Math.floor((new Date(record.end ?? Date.now()) - new Date(record.start)) / 86_400_000) : 0

  // ── Navigation ───────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState(() => tokens.getAccess() ? 'app' : 'splash');
  const [tab,   setTab]   = useState('home');
  const [stack, setStack] = useState([]);
  const push    = (screen, props = {}) => setStack(s => [...s, { screen, props }]);
  const pop     = () => setStack(s => s.slice(0, -1));
  const resetTo = (newTab) => { setTab(newTab); setStack([]); };

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [pulseKey,    setPulseKey]    = useState(0);
  const [relapseOpen, setRelapseOpen] = useState(false);
  const [toast,       setToast]       = useState(null);
  const [banner,      setBanner]      = useState(null);
  const showToast = (text, icon = 'check') => {
    setToast({ text, icon });
    setTimeout(() => setToast(null), 2200);
  };

  // ── Actions ───────────────────────────────────────────────────────────────────
  const onCheckIn = async () => {
    await checkIn()
    setPulseKey(k => k + 1)
    if (t.motion) burstConfetti()
    showToast('Checked in — day ' + days + ' ✓')
  }

  const onRelapseConfirm = async () => {
    setRelapseOpen(false)
    await doRelapse()
    setPulseKey(k => k + 1)
    showToast('A new streak begins. Be gentle with yourself.', 'heart')
  }

  const onCheckinConfirm = async (relapses) => {
    await performCheckin(relapses)
    setPulseKey(k => k + 1)
    if (relapses.length === 0) {
      if (t.motion) burstConfetti()
      showToast(`Checked in — day ${days} ✓`)
    } else {
      showToast('A new streak begins. Be gentle with yourself.', 'heart')
    }
  }

  const openProfile = (id) => {
    const isFriend  = friends.some(f => f.sender === id || f.reciver === id)
    const isSent    = reqSent.some(r => r.reciver === id)
    const isRecv    = reqReceived.some(r => r.sender === id)
    const rel = isFriend ? 'friend' : isSent ? 'pending_out' : isRecv ? 'pending_in' : 'none'
    // person shape: PublicProfile will receive userId and fetch details itself
    push('publicProfile', { userId: id, relation: rel })
  }

  const openChat = (chatId) => {
    const c = chatList.find(x => x.id === chatId)
    if (!c) return
    push('chatThread', { chat: c })
  }

  const messagePerson = (userId) => {
    const c = chatList.find(x => x.sender === userId || x.reciver === userId)
    resetTo('chat')
    setTimeout(() => push('chatThread', { chat: c ?? { id: null, sender: me?.id, reciver: userId, messages: { messages: [], total: 0 } } }), 30)
  }

  // ── Demo banner ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'app') return;
    const t1 = setTimeout(() => {
      setBanner({ icon: 'chat', title: 'Friend', body: 'Check in with your streak!', to: 'chat' });
    }, 4200);
    return () => clearTimeout(t1);
  }, [phase]);
  useEffect(() => {
    if (banner) { const x = setTimeout(() => setBanner(null), 5200); return () => clearTimeout(x); }
  }, [banner]);

  // ── Routing ───────────────────────────────────────────────────────────────────
  let body;
  if (phase === 'splash') {
    body = <SplashScreen onGetStarted={() => setPhase('register')} onLogin={() => setPhase('login')} />;
  } else if (phase === 'register') {
    body = <RegisterScreen onBack={() => setPhase('splash')} onDone={() => { setPhase('app'); resetTo('home'); }} />;
  } else if (phase === 'login') {
    body = <LoginScreen onBack={() => setPhase('splash')} onDone={() => { setPhase('app'); resetTo('home'); }} />;
  } else if (phase === 'deleted') {
    body = <DeletedScreen onRestart={() => setPhase('splash')} />;
  } else {
    const top = stack[stack.length - 1];
    if (top) {
      switch (top.screen) {
        case 'history':
          body = <StreakHistory onBack={pop} currentDays={days} currentStart={startLabel} empty={days === 0} />; break;
        case 'requests':
          body = <FriendRequests onBack={pop} received={reqReceived} sent={reqSent} meId={me?.id}
            onAccept={async (id) => { await refetchFriends(); showToast('Friend added'); }}
            onDecline={async (id) => { await refetchFriends(); }}
            onCancel={async (id) => { await refetchFriends(); }}
            onOpenProfile={openProfile} />; break;
        case 'search':
          body = <FriendSearch onBack={pop} pool={[]} onOpenProfile={openProfile}
            onSendRequest={async (id) => { showToast('Request sent'); }} />; break;
        case 'publicProfile':
          body = <PublicProfile onBack={pop} userId={top.props.userId} relation={top.props.relation}
            onMessage={() => { pop(); messagePerson(top.props.userId); }}
            onAdd={async () => { showToast('Request sent'); }}
            onAccept={async () => { await refetchFriends(); showToast('Friend added'); }}
            onRemove={async () => { await refetchFriends(); showToast('Friend removed'); }}
            onBlock={async () => { await refetchFriends(); showToast('User blocked'); }} />; break;
        case 'chatThread':
          body = <ChatThread onBack={pop} chat={top.props.chat} meId={me?.id} onOpenProfile={id => openProfile(id)} />; break;
        case 'badgeDetail':
          body = <BadgeDetail onBack={pop} badge={top.props.badge} currentDays={days} justUnlocked={top.props.justUnlocked} />; break;
        case 'edit':
          body = <EditProfile me={me} onBack={pop} onSave={() => { pop(); refetchMe(); showToast('Profile updated'); }} />; break;
        case 'settings':
          body = <Settings onBack={pop} mode={mode}
            onToggleMode={() => setTweak('mode', mode === 'dark' ? 'light' : 'dark')}
            onLogout={() => { setStack([]); setPhase('splash'); }}
            onDeleted={() => { setStack([]); setPhase('deleted'); }} />; break;
        default: body = null;
      }
    } else {
      switch (tab) {
        case 'home':
          body = <Dashboard me={me} days={days} checkedIn={checkedIn} milestone={milestone} startLabel={startLabel}
            personalRecord={personalRecord} totalStreaks={0} nextBadgeName={nextBadge?.name ?? ''}
            pulseKey={pulseKey} onCheckIn={onCheckIn} onRelapse={() => setRelapseOpen(true)}
            onOpenHistory={() => push('history')} onProfile={() => resetTo('profile')} />; break;
        case 'friends':
          body = <FriendsScreen friends={friends} meId={me?.id} requestCount={reqReceived.length}
            onOpenRequests={() => push('requests')} onOpenSearch={() => push('search')}
            onOpenProfile={openProfile} onMessage={messagePerson} />; break;
        case 'chat':
          body = <ChatList chats={chatList} meId={me?.id} onOpen={openChat} onOpenProfile={openProfile} />; break;
        case 'badges':
          body = <BadgesScreen badges={liveBadges} currentDays={days}
            onOpen={id => { const b = liveBadges.find(x => x.id === id); push('badgeDetail', { badge: b }); }} />; break;
        case 'profile':
          body = <MyProfile me={me} earnedBadges={liveBadges.filter(b => b.earned)}
            days={days} personalRecord={personalRecord} badgeCount={badgeCount}
            totalBadges={badgeList.length} joined={me?.created_at ?? ''}
            onEdit={() => push('edit')} onSettings={() => push('settings')}
            onOpenBadges={() => resetTo('badges')} />; break;
        default: body = null;
      }
    }
  }

  const showTabs   = phase === 'app' && stack.length === 0;
  const showBanner = banner && phase === 'app';

  return (
    <div className="nh-root" data-dir={dir} data-mode={mode}
      data-reduce-motion={t.motion ? 'no' : 'yes'}>
      <div id="nh-screen" style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div key={phase + tab + (stack.length ? stack[stack.length - 1].screen : '')}
          style={{ position: 'absolute', inset: 0, animation: 'nhScreenIn .34s cubic-bezier(.2,.8,.3,1) both' }}>
          {body}
        </div>

        {showBanner && (
          <Banner icon={banner.icon} title={banner.title} body={banner.body}
            onTap={() => { setBanner(null); resetTo(banner.to); if (banner.chatId) setTimeout(() => openChat(banner.chatId), 40); }}
            onClose={() => setBanner(null)} />
        )}
        {toast && <Toast text={toast.text} icon={toast.icon} />}

        {showTabs && <TabBar active={tab} onChange={resetTo}
          badges={{ friends: reqReceived.length || undefined, chat: chatUnread || undefined }} />}

        <CheckInModal
          open={phase === 'app' && needsCheckin}
          missedDays={missedDays}
          lastCheckinDate={lastCheckinDate}
          onConfirm={onCheckinConfirm}
          loading={streakLoading}
        />

        <BottomSheet open={relapseOpen} onClose={() => setRelapseOpen(false)}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Icon name="heart" size={26} color="var(--primary)" />
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>A setback isn't the end</div>
            <div style={{ fontSize: 14.5, color: 'var(--ink-2)', marginTop: 10, lineHeight: 1.55, padding: '0 4px' }}>
              Logging this resets your counter to zero, but your {days}-day effort still counts. What matters is that you're still here.
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
            <Btn kind="primary" full onClick={onRelapseConfirm}>Reset & start fresh</Btn>
            <Btn kind="ghost" full onClick={() => setRelapseOpen(false)}>Not now</Btn>
          </div>
        </BottomSheet>
      </div>

      <TweaksPanel>
        <TweakSection label="Visual direction" />
        <TweakRadio label="Theme" value={t.direction} options={['sage', 'dawn']}
          onChange={v => setTweak('direction', v)} />
        <TweakRadio label="Appearance" value={t.mode} options={['light', 'dark']}
          onChange={v => setTweak('mode', v)} />
        <TweakSection label="Motion" />
        <TweakToggle label="Background & celebration motion" value={t.motion}
          onChange={v => setTweak('motion', v)} />
        <div style={{ fontSize: 11.5, color: 'rgba(0,0,0,0.45)', padding: '2px 2px 8px', lineHeight: 1.5 }}>
          Sage = humanist sans, muted green. Dawn = soft serif numerals, warm clay.
        </div>
      </TweaksPanel>
    </div>
  );
}

function DeletedScreen({ onRestart }) {
  return (
    <Screen geo="splash" padTop={0} padBottom={0} noScroll>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 36px', textAlign: 'center' }}>
        <div style={{ width: 76, height: 76, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22 }}>
          <Icon name="heart" size={36} color="var(--primary)" />
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--display-weight)', fontSize: 26, color: 'var(--ink)' }}>Your account is gone</div>
        <div style={{ fontSize: 15, color: 'var(--ink-2)', marginTop: 12, lineHeight: 1.55 }}>
          We're sorry to see you go. Recovery isn't linear — if you ever want to begin again, the door is open.
        </div>
        <Btn kind="primary" size="lg" onClick={onRestart} style={{ marginTop: 28 }}>Start over</Btn>
      </div>
    </Screen>
  );
}

function todayLabel() {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function burstConfetti() {
  const root = document.querySelector('.nh-root');
  if (!root || root.getAttribute('data-reduce-motion') === 'yes') return;
  const screen = document.getElementById('nh-screen');
  if (!screen) return;
  const host = document.createElement('div');
  host.style.cssText = 'position:absolute;inset:0;z-index:88;pointer-events:none;overflow:hidden';
  const colors = ['var(--primary)', 'var(--accent)', 'var(--primary-soft)'];
  for (let i = 0; i < 26; i++) {
    const p = document.createElement('span');
    const left = 30 + Math.random() * 40, size = 6 + Math.random() * 7;
    const dx = (Math.random() - 0.5) * 240, dy = 260 + Math.random() * 180, rot = Math.random() * 720;
    p.style.cssText = `position:absolute;top:38%;left:${left}%;width:${size}px;height:${size}px;border-radius:${Math.random()>.5?'50%':'2px'};background:${colors[i%3]};opacity:.95;`;
    p.animate([
      { transform: 'translate(0,0) rotate(0)', opacity: 1 },
      { transform: `translate(${dx}px,${dy}px) rotate(${rot}deg)`, opacity: 0 },
    ], { duration: 1100 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.4,1)', fill: 'forwards' });
    host.appendChild(p);
  }
  screen.appendChild(host);
  setTimeout(() => host.remove(), 1900);
}
