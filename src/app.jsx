import { useState, useEffect } from 'react'
import {
  ME, BADGES, FRIENDS, REQUESTS_RECEIVED, REQUESTS_SENT,
  CHATS, PEOPLE, STREAK_HISTORY, STREAK_START_LABEL,
  PERSONAL_RECORD, TOTAL_STREAKS,
} from './data/mock.js'
import { Banner, Toast, BottomSheet, TabBar, Icon, Btn, Screen } from './ui/index.js'
import { SplashScreen } from './screens/auth/SplashScreen.jsx'
import { RegisterScreen } from './screens/auth/RegisterScreen.jsx'
import { LoginScreen } from './screens/auth/LoginScreen.jsx'
import { Dashboard } from './screens/home/Dashboard.jsx'
import { StreakHistory } from './screens/home/StreakHistory.jsx'
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

const TWEAK_DEFAULTS = {
  direction: 'sage',
  mode: 'light',
  motion: true,
  accentName: 'warm',
};

export default function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const dir = t.direction;
  const mode = t.mode;

  const BASE_DAYS = 47;
  const [days, setDays] = useState(BASE_DAYS);
  const [checkedIn, setCheckedIn] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);

  const nextBadge = BADGES.find(b => b.milestone > days) || BADGES[BADGES.length - 1];
  const milestone = nextBadge.milestone;

  const liveBadges = BADGES.map(b => ({
    ...b,
    earned: b.milestone <= days ? (b.earned || todayLabel()) : null,
  }));
  const badgeCount = liveBadges.filter(b => b.earned).length;

  const [phase, setPhase] = useState('splash');
  const [tab, setTab] = useState('home');
  const [stack, setStack] = useState([]);
  const push = (screen, props = {}) => setStack(s => [...s, { screen, props }]);
  const pop = () => setStack(s => s.slice(0, -1));
  const resetTo = (newTab) => { setTab(newTab); setStack([]); };

  const [relapseOpen, setRelapseOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [banner, setBanner] = useState(null);
  const showToast = (text, icon = 'check') => { setToast({ text, icon }); setTimeout(() => setToast(null), 2200); };

  const [reqReceived, setReqReceived] = useState(REQUESTS_RECEIVED);
  const [reqSent, setReqSent] = useState(REQUESTS_SENT);
  const [friends, setFriends] = useState(FRIENDS);
  const [chatUnread, setChatUnread] = useState(CHATS.reduce((n, c) => n + c.unread, 0));

  const onCheckIn = () => {
    setCheckedIn(true);
    setPulseKey(k => k + 1);
    if (t.motion) burstConfetti();
    showToast('Checked in — day ' + days + ' ✓');
  };
  const onRelapseConfirm = () => {
    setRelapseOpen(false);
    setDays(0);
    setCheckedIn(false);
    setPulseKey(k => k + 1);
    showToast('A new streak begins. Be gentle with yourself.', 'heart');
  };

  useEffect(() => {
    if (phase !== 'app') return;
    const t1 = setTimeout(() => {
      setBanner({ icon: 'chat', title: 'maya_rivera', body: "That's huge, Alex. Proud of you 💚", to: 'chat', chatId: 'c_maya' });
    }, 4200);
    return () => clearTimeout(t1);
  }, [phase]);
  useEffect(() => { if (banner) { const x = setTimeout(() => setBanner(null), 5200); return () => clearTimeout(x); } }, [banner]);

  const openProfile = (id) => {
    const p = PEOPLE[id]; if (!p) return;
    const isFriend = friends.some(f => f.id === id);
    const isSent = reqSent.some(r => r.id === id);
    const isRecv = reqReceived.some(r => r.id === id);
    const rel = isFriend ? 'friend' : isSent ? 'pending_out' : isRecv ? 'pending_in' : 'none';
    push('publicProfile', { person: p, relation: rel });
  };
  const openChat = (chatId) => {
    const c = CHATS.find(x => x.id === chatId); if (!c) return;
    push('chatThread', { chat: c });
    if (c.unread) setChatUnread(n => Math.max(0, n - c.unread));
  };
  const messagePerson = (personId) => {
    let c = CHATS.find(x => x.with === personId);
    if (!c) { c = { id: 'new_' + personId, with: personId, status: 'active', unread: 0, messages: [] }; CHATS.push(c); }
    resetTo('chat');
    setTimeout(() => push('chatThread', { chat: c }), 30);
  };

  let body;
  if (phase === 'splash') {
    body = <SplashScreen onGetStarted={() => setPhase('register')} onLogin={() => setPhase('login')} />;
  } else if (phase === 'register') {
    body = <RegisterScreen onBack={() => setPhase('splash')} onDone={() => { setPhase('app'); resetTo('home'); }} />;
  } else if (phase === 'login') {
    body = <LoginScreen onBack={() => setPhase('splash')} onDone={() => { setPhase('app'); resetTo('home'); }} />;
  } else if (phase === 'deleted') {
    body = <DeletedScreen onRestart={() => { setDays(BASE_DAYS); setCheckedIn(false); setPhase('splash'); }} />;
  } else {
    const top = stack[stack.length - 1];
    if (top) {
      switch (top.screen) {
        case 'history':
          body = <StreakHistory onBack={pop} streaks={STREAK_HISTORY} currentDays={days} currentStart={STREAK_START_LABEL} empty={days === 0} />; break;
        case 'requests':
          body = <FriendRequests onBack={pop} received={reqReceived} sent={reqSent}
            onAccept={id => { const p = reqReceived.find(r => r.id === id); setReqReceived(l => l.filter(r => r.id !== id)); if (p) setFriends(f => [...f, { ...p, online: false }]); showToast('Friend added'); }}
            onDecline={id => setReqReceived(l => l.filter(r => r.id !== id))}
            onCancel={id => setReqSent(l => l.filter(r => r.id !== id))}
            onOpenProfile={openProfile} />; break;
        case 'search':
          body = <FriendSearch onBack={pop} pool={reqSent.length > 0 ? reqSent.map(r => ({ ...r, rel: 'pending' })).concat(friends.map(f => ({ ...f, rel: 'friend' }))) : [
            { id: 'noor', username: 'noor_h', hue: 40, streak: 5, avatar: null, rel: 'none' },
            { id: 'sam', username: 'sam_99', hue: 285, streak: 41, avatar: null, rel: 'none' },
            { id: 'maya', username: 'maya_rivera', hue: 12, streak: 63, avatar: null, rel: 'friend' },
            { id: 'river', username: 'river.b', hue: 200, streak: 33, avatar: null, rel: 'pending' },
          ]} onOpenProfile={openProfile}
            onSendRequest={id => { const p = PEOPLE[id]; if (p) setReqSent(l => [...l, { ...p, when: 'just now' }]); showToast('Request sent'); }} />; break;
        case 'publicProfile':
          body = <PublicProfile onBack={pop} person={top.props.person} relation={top.props.relation}
            onMessage={() => { pop(); messagePerson(top.props.person.id); }}
            onAdd={() => { const p = top.props.person; setReqSent(l => [...l, { ...p, when: 'just now' }]); showToast('Request sent'); }}
            onAccept={() => { const p = top.props.person; setReqReceived(l => l.filter(r => r.id !== p.id)); setFriends(f => [...f, { ...p, online: false }]); showToast('Friend added'); }}
            onRemove={() => { setFriends(f => f.filter(x => x.id !== top.props.person.id)); showToast('Friend removed'); }}
            onBlock={() => { setFriends(f => f.filter(x => x.id !== top.props.person.id)); showToast('User blocked'); }} />; break;
        case 'chatThread':
          body = <ChatThread onBack={pop} chat={top.props.chat} onOpenProfile={id => openProfile(id)} />; break;
        case 'badgeDetail':
          body = <BadgeDetail onBack={pop} badge={top.props.badge} currentDays={days} justUnlocked={top.props.justUnlocked} />; break;
        case 'edit':
          body = <EditProfile onBack={pop} onSave={() => { pop(); showToast('Profile updated'); }} />; break;
        case 'settings':
          body = <Settings onBack={pop} mode={mode} onToggleMode={() => setTweak('mode', mode === 'dark' ? 'light' : 'dark')}
            onLogout={() => { setStack([]); setPhase('splash'); }} onDeleted={() => { setStack([]); setPhase('deleted'); }} />; break;
        default: body = null;
      }
    } else {
      switch (tab) {
        case 'home':
          body = <Dashboard days={days} checkedIn={checkedIn} milestone={milestone} startLabel={STREAK_START_LABEL}
            personalRecord={PERSONAL_RECORD} totalStreaks={TOTAL_STREAKS} nextBadgeName={nextBadge.name} pulseKey={pulseKey}
            onCheckIn={onCheckIn} onRelapse={() => setRelapseOpen(true)} onOpenHistory={() => push('history')} />; break;
        case 'friends':
          body = <FriendsScreen friends={friends} requestCount={reqReceived.length}
            onOpenRequests={() => push('requests')} onOpenSearch={() => push('search')}
            onOpenProfile={openProfile} onMessage={messagePerson} />; break;
        case 'chat':
          body = <ChatList chats={CHATS} onOpen={openChat} onOpenProfile={openProfile} />; break;
        case 'badges':
          body = <BadgesScreen badges={liveBadges} currentDays={days}
            onOpen={id => { const b = liveBadges.find(x => x.id === id); push('badgeDetail', { badge: b }); }} />; break;
        case 'profile':
          body = <MyProfile days={days} personalRecord={PERSONAL_RECORD} badgeCount={badgeCount} totalBadges={BADGES.length}
            joined={ME.joined} onEdit={() => push('edit')} onSettings={() => push('settings')} onOpenBadges={() => resetTo('badges')} />; break;
        default: body = null;
      }
    }
  }

  const showTabs = phase === 'app' && stack.length === 0;
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

        {showTabs && <TabBar active={tab} onChange={resetTo} badges={{ friends: reqReceived.length || undefined, chat: chatUnread || undefined }} />}

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
