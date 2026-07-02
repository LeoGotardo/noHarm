import { Banner, BottomSheet, hashHue, Screen, TabBar, Toast } from "@components";
import { Btn, Icon } from "@ui";
import { useEffect, useMemo, useState } from "react";
import { errorMessage } from "./connectors/api.js";
import { tokens } from "./connectors/tokens.js";
import { signOut } from "./services/api/auth.js";
import { unregisterDeviceToken } from "./services/api/device.js";
import {
  acceptFriendship,
  blockFriendship,
  rejectFriendship,
  removeFriendship,
  sendFriendRequest,
} from "./services/api/friendship.js";
import { getUsers } from "./services/api/user.js";
import {
  TweakRadio,
  TweakSection,
  TweaksPanel,
  TweakToggle,
  useTweaks,
} from "./dev/TweaksPanel.jsx";
import { LoginScreen } from "./screens/auth/LoginScreen.jsx";
import { RegisterScreen } from "./screens/auth/RegisterScreen.jsx";
import { SplashScreen } from "./screens/auth/SplashScreen.jsx";
import { BadgeDetail } from "./screens/badges/BadgeDetail.jsx";
import { BadgesScreen } from "./screens/badges/BadgesScreen.jsx";
import { ChatList } from "./screens/chat/ChatList.jsx";
import { ChatThread } from "./screens/chat/ChatThread.jsx";
import { FriendRequests } from "./screens/friends/FriendRequests.jsx";
import { FriendSearch } from "./screens/friends/FriendSearch.jsx";
import { FriendsScreen } from "./screens/friends/FriendsScreen.jsx";
import { PublicProfile } from "./screens/friends/PublicProfile.jsx";
import { CheckInModal } from "./screens/home/CheckInModal.jsx";
import { Dashboard } from "./screens/home/Dashboard.jsx";
import { StreakHistory } from "./screens/home/StreakHistory.jsx";
import { EditProfile } from "./screens/profile/EditProfile.jsx";
import { MyProfile } from "./screens/profile/MyProfile.jsx";
import { Settings } from "./screens/profile/Settings.jsx";
import { checkinReminder } from "./services/checkinReminder.js";
import { useBadges } from "./store/useBadges.js";
import { useChats } from "./store/useChats.js";
import { useCheckinReminder } from "./store/useCheckinReminder.js";
import { useFriends } from "./store/useFriends.js";
import { useNotifications } from "./store/useNotifications.js";
import { useNotifPrefs } from "./store/useNotifPrefs.js";
import { useStreak } from "./store/useStreak.js";
import { useUser } from "./store/useUser.js";

// ── Domain constants (see CLAUDE.md for full status code reference) ───────────
const STATUS_CONSTANTS = import.meta.env.VITE_STATUS_CONSTANTS;

// ── Theme defaults ────────────────────────────────────────────────────────────
const TWEAK_DEFAULTS = {
  direction: "sage",
  mode: "light",
  motion: true,
  accentName: "warm",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function todayLabel() {
  return new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function burstConfetti() {
  const root = document.querySelector(".nh-root");
  if (!root || root.getAttribute("data-reduce-motion") === "yes") return;
  const screen = document.getElementById("nh-screen");
  if (!screen) return;
  const host = document.createElement("div");
  host.style.cssText =
    "position:absolute;inset:0;z-index:88;pointer-events:none;overflow:hidden";
  const colors = ["var(--primary)", "var(--accent)", "var(--primary-soft)"];
  for (let i = 0; i < 26; i++) {
    const p = document.createElement("span");
    const left = 30 + Math.random() * 40;
    const size = 6 + Math.random() * 7;
    const dx = (Math.random() - 0.5) * 240;
    const dy = 260 + Math.random() * 180;
    const rot = Math.random() * 720;
    p.style.cssText = `position:absolute;top:38%;left:${left}%;width:${size}px;height:${size}px;border-radius:${Math.random() > 0.5 ? "50%" : "2px"};background:${colors[i % 3]};opacity:.95;`;
    p.animate(
      [
        { transform: "translate(0,0) rotate(0)", opacity: 1 },
        {
          transform: `translate(${dx}px,${dy}px) rotate(${rot}deg)`,
          opacity: 0,
        },
      ],
      {
        duration: 1100 + Math.random() * 500,
        easing: "cubic-bezier(.2,.7,.4,1)",
        fill: "forwards",
      },
    );
    host.appendChild(p);
  }
  screen.appendChild(host);
  setTimeout(() => host.remove(), 1900);
}

// ── Local overlay components ──────────────────────────────────────────────────

function StartStreakSheet({
  open,
  date,
  loading,
  onChangeDate,
  onConfirm,
  onClose,
}) {
  return (
    <BottomSheet open={open} onClose={onClose}>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "var(--primary-soft)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <Icon name="flame" size={26} color="var(--primary)" sw={1.4} />
        </div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "var(--ink)",
            fontFamily: "var(--font-display)",
          }}
        >
          When did you start?
        </div>
        <div
          style={{
            fontSize: 14.5,
            color: "var(--ink-2)",
            marginTop: 10,
            lineHeight: 1.55,
            padding: "0 4px",
          }}
        >
          Pick the date you began your recovery. If it was today, just leave it
          as is.
        </div>
      </div>
      <div style={{ marginTop: 20 }}>
        <input
          type="date"
          value={date}
          max={todayISO()}
          onChange={(e) => onChangeDate(e.target.value)}
          style={{
            width: "100%",
            padding: "14px 16px",
            borderRadius: 14,
            border: "1.5px solid var(--border)",
            background: "var(--surface-2)",
            color: "var(--ink)",
            fontSize: 16,
            fontFamily: "var(--font-body)",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          marginTop: 16,
        }}
      >
        <Btn kind="primary" full onClick={onConfirm} disabled={loading}>
          {loading ? "Starting…" : "Begin my streak"}
        </Btn>
        <Btn kind="ghost" full onClick={onClose}>
          Cancel
        </Btn>
      </div>
    </BottomSheet>
  );
}

function RelapseSheet({ open, days, loading, onConfirm, onClose }) {
  return (
    <BottomSheet open={open} onClose={onClose}>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "var(--primary-soft)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <Icon name="heart" size={26} color="var(--primary)" />
        </div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "var(--ink)",
            fontFamily: "var(--font-display)",
          }}
        >
          A setback isn't the end
        </div>
        <div
          style={{
            fontSize: 14.5,
            color: "var(--ink-2)",
            marginTop: 10,
            lineHeight: 1.55,
            padding: "0 4px",
          }}
        >
          Logging this resets your counter to zero, but your {days}-day effort
          still counts. What matters is that you're still here.
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          marginTop: 24,
        }}
      >
        <Btn kind="primary" full onClick={onConfirm} disabled={loading}>
          Reset & start fresh
        </Btn>
        <Btn kind="ghost" full onClick={onClose}>
          Not now
        </Btn>
      </div>
    </BottomSheet>
  );
}

function DeletedScreen({ onRestart }) {
  return (
    <Screen geo="splash" padTop={0} padBottom={0} noScroll>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "0 36px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: "50%",
            background: "var(--surface-2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 22,
          }}
        >
          <Icon name="heart" size={36} color="var(--primary)" />
        </div>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: "var(--display-weight)",
            fontSize: 26,
            color: "var(--ink)",
          }}
        >
          Your account is gone
        </div>
        <div
          style={{
            fontSize: 15,
            color: "var(--ink-2)",
            marginTop: 12,
            lineHeight: 1.55,
          }}
        >
          We're sorry to see you go. Recovery isn't linear — if you ever want to
          begin again, the door is open.
        </div>
        <Btn
          kind="primary"
          size="lg"
          onClick={onRestart}
          style={{ marginTop: 28 }}
        >
          Start over
        </Btn>
      </div>
    </Screen>
  );
}

// ── Root component ────────────────────────────────────────────────────────────

export default function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const { direction: dir, mode, motion } = t;

  // ── Remote data ───────────────────────────────────────────────────────────
  const { me, refetch: refetchMe } = useUser();
  const {
    streak,
    record,
    days,
    checkedIn,
    needsCheckin,
    missedDays,
    lastCheckinDate,
    checkIn,
    relapse: doRelapse,
    performCheckin,
    startFrom,
    loading: streakLoading,
  } = useStreak();
  const {
    friends: friendshipData,
    requestsReceived: reqRecvData,
    requestsSent: reqSentData,
    refetch: refetchFriends,
  } = useFriends();
  const { chats: chatData } = useChats();
  const { badges: badgeData } = useBadges();

  // ── Derived data ──────────────────────────────────────────────────────────
  const chatList = chatData.chats ?? [];
  const badgeList = badgeData.badges ?? [];

  const friends =
    friendshipData.friendships?.filter(
      (f) => f.status === STATUS_CONSTANTS.accepted,
    ) ?? [];
  const reqReceived = reqRecvData.friendships ?? [];
  const reqSent = reqSentData.friendships ?? [];

  // Pool of users for friend search (paginated list, filtered client-side)
  const [userPool, setUserPool] = useState([]);

  // Resolve the friendship id linking the current user to `userId`, if any
  const findFriendshipId = (userId) => {
    const f = friends.find((x) => x.sender === userId || x.reciver === userId);
    if (f) return f.id;
    const rin = reqReceived.find((x) => x.sender === userId);
    if (rin) return rin.id;
    const rout = reqSent.find((x) => x.reciver === userId);
    if (rout) return rout.id;
    return null;
  };

  const searchPool = useMemo(
    () =>
      userPool
        .filter((u) => u.id !== me?.id)
        .map((u) => {
          const isFriend = friends.some(
            (f) => f.sender === u.id || f.reciver === u.id,
          );
          const isPending =
            reqSent.some((r) => r.reciver === u.id) ||
            reqReceived.some((r) => r.sender === u.id);
          return {
            id: u.id,
            username: u.username,
            profile_picture: u.profile_picture ?? null,
            hue: hashHue(u.username),
            rel: isFriend ? "friend" : isPending ? "pending" : "none",
          };
        }),
    [userPool, friends, reqSent, reqReceived, me],
  );

  // Count unread messages sent by the other user across all chats
  const chatUnread = useMemo(
    () =>
      chatList.reduce((n, c) => {
        const msgs = c.messages?.messages ?? [];
        return (
          n +
          msgs.filter(
            (m) => m.status === STATUS_CONSTANTS.unread && m.sender !== me?.id,
          ).length
        );
      }, 0),
    [chatList, me],
  );

  // Merge API badge list with earned status derived from current streak days
  const liveBadges = badgeList.map((b) => {
    const milestoneDays =
      typeof b.milestone === "number"
        ? b.milestone
        : Math.floor(new Date(b.milestone).getTime() / 86_400_000);
    const earned = days >= milestoneDays;
    return { ...b, earned: earned ? (b.given_at ?? todayLabel()) : null };
  });
  const badgeCount = liveBadges.filter((b) => b.earned).length;
  const nextBadge =
    liveBadges.find((b) => !b.earned) ?? liveBadges[liveBadges.length - 1];
  const milestone = nextBadge?.milestone ?? 0;

  const startLabel = streak?.start
    ? new Date(streak.start).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "—";
  const personalRecord = record
    ? Math.floor(
        (new Date(record.end ?? Date.now()) - new Date(record.start)) /
          86_400_000,
      )
    : 0;

  // ── Navigation ────────────────────────────────────────────────────────────
  // phase: 'splash' | 'register' | 'login' | 'app' | 'deleted'
  // stack: overlay screens pushed on top of the active tab root
  const [phase, setPhase] = useState(() =>
    tokens.getAccess() ? "app" : "splash",
  );
  const { prefs: notifPrefs, set: setNotifPref } = useNotifPrefs();
  const { requestPermission: enableNotifications, granted: notifGranted } =
    useNotifications(phase === "app" ? me?.id : null, notifPrefs);
  const reminderEnabled =
    phase === "app" &&
    notifGranted &&
    notifPrefs.master &&
    notifPrefs.checkinReminder;
  useCheckinReminder(reminderEnabled);
  const [tab, setTab] = useState("home");
  const [stack, setStack] = useState([]);

  const push = (screen, props = {}) =>
    setStack((s) => [...s, { screen, props }]);
  const pop = () => setStack((s) => s.slice(0, -1));
  const resetTo = (newTab) => {
    setTab(newTab);
    setStack([]);
  };

  const openProfile = (userId) => {
    const isFriend = friends.some(
      (f) => f.sender === userId || f.reciver === userId,
    );
    const isSent = reqSent.some((r) => r.reciver === userId);
    const isRecv = reqReceived.some((r) => r.sender === userId);
    const relation = isFriend
      ? "friend"
      : isSent
        ? "pending_out"
        : isRecv
          ? "pending_in"
          : "none";
    push("publicProfile", {
      userId,
      relation,
      friendshipId: findFriendshipId(userId),
    });
  };

  const openChat = (chatId) => {
    const chat = chatList.find((x) => x.id === chatId);
    if (!chat) return;
    push("chatThread", { chat });
  };

  const messagePerson = (userId) => {
    const chat = chatList.find(
      (x) => x.sender === userId || x.reciver === userId,
    );
    resetTo("chat");
    // Small delay so the tab transition renders before the stack push
    setTimeout(
      () =>
        push("chatThread", {
          chat: chat ?? {
            id: null,
            sender: me?.id,
            reciver: userId,
            messages: { messages: [], total: 0 },
          },
        }),
      30,
    );
  };

  // ── UI state ──────────────────────────────────────────────────────────────
  const [pulseKey, setPulseKey] = useState(0);
  const [relapseOpen, setRelapseOpen] = useState(false);
  const [startOpen, setStartOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [toast, setToast] = useState(null);
  const [banner, setBanner] = useState(null);

  const showToast = (text, icon = "check") => {
    setToast({ text, icon });
    setTimeout(() => setToast(null), 2200);
  };

  useEffect(() => {
    if (banner) {
      const t = setTimeout(() => setBanner(null), 5200);
      return () => clearTimeout(t);
    }
  }, [banner]);

  // Load the user directory once in-app, for friend search
  useEffect(() => {
    if (phase !== "app") return;
    getUsers()
      .then((r) => setUserPool(r.items ?? r.users ?? []))
      .catch(() => {});
  }, [phase]);

  // ── Streak actions ────────────────────────────────────────────────────────
  const onCheckIn = async () => {
    try {
      await checkIn();
    } catch (e) {
      showToast(errorMessage(e, "Couldn't check in"), "bell");
      return;
    }
    setPulseKey((k) => k + 1);
    if (motion) burstConfetti();
    showToast(`Checked in — day ${days} ✓`);
    if (reminderEnabled) checkinReminder.reschedule();
  };

  const onCheckinConfirm = async (relapses) => {
    try {
      await performCheckin(relapses);
    } catch (e) {
      showToast(errorMessage(e, "Couldn't check in"), "bell");
      return;
    }
    setPulseKey((k) => k + 1);
    if (relapses.length === 0) {
      if (motion) burstConfetti();
      showToast(`Checked in — day ${days} ✓`);
    } else {
      showToast("A new streak begins. Be gentle with yourself.", "heart");
    }
    if (reminderEnabled) checkinReminder.reschedule();
  };

  const onRelapseConfirm = async () => {
    setRelapseOpen(false);
    try {
      await doRelapse();
    } catch (e) {
      showToast(errorMessage(e, "Couldn't save that right now"), "bell");
      return;
    }
    setPulseKey((k) => k + 1);
    showToast("A new streak begins. Be gentle with yourself.", "heart");
  };

  const onStartConfirm = async () => {
    setStartOpen(false);
    try {
      await startFrom(startDate || todayISO());
    } catch (e) {
      showToast(errorMessage(e, "Couldn't start your streak"), "bell");
      return;
    }
    setPulseKey((k) => k + 1);
    if (motion) burstConfetti();
    showToast("Your streak has begun. One day at a time.", "heart");
  };

  // ── Screen routing ────────────────────────────────────────────────────────
  let body;
  if (phase === "splash") {
    body = (
      <SplashScreen
        onGetStarted={() => setPhase("register")}
        onLogin={() => setPhase("login")}
      />
    );
  } else if (phase === "register") {
    body = (
      <RegisterScreen
        onBack={() => setPhase("splash")}
        onDone={() => {
          setPhase("app");
          resetTo("home");
        }}
      />
    );
  } else if (phase === "login") {
    body = (
      <LoginScreen
        onBack={() => setPhase("splash")}
        onDone={() => {
          setPhase("app");
          resetTo("home");
        }}
      />
    );
  } else if (phase === "deleted") {
    body = <DeletedScreen onRestart={() => setPhase("splash")} />;
  } else {
    const top = stack[stack.length - 1];
    if (top) {
      // Overlay screens (pushed over the active tab)
      switch (top.screen) {
        case "history":
          body = (
            <StreakHistory
              onBack={pop}
              currentDays={days}
              currentStart={startLabel}
              empty={days === 0}
            />
          );
          break;
        case "requests":
          body = (
            <FriendRequests
              onBack={pop}
              received={reqReceived}
              sent={reqSent}
              meId={me?.id}
              onAccept={async (fid) => {
                try {
                  await acceptFriendship(fid);
                  await refetchFriends();
                  showToast("Friend added");
                } catch (e) {
                  showToast(errorMessage(e, "Couldn't accept request"), "bell");
                }
              }}
              onDecline={async (fid) => {
                try {
                  await rejectFriendship(fid);
                  await refetchFriends();
                } catch (e) {
                  showToast(errorMessage(e, "Couldn't decline request"), "bell");
                }
              }}
              onCancel={async (fid) => {
                try {
                  await removeFriendship(fid);
                  await refetchFriends();
                } catch (e) {
                  showToast(errorMessage(e, "Couldn't cancel request"), "bell");
                }
              }}
              onOpenProfile={openProfile}
            />
          );
          break;
        case "search":
          body = (
            <FriendSearch
              onBack={pop}
              pool={searchPool}
              onOpenProfile={openProfile}
              onSendRequest={async (userId) => {
                try {
                  await sendFriendRequest(userId);
                  showToast("Request sent");
                  await refetchFriends();
                } catch (e) {
                  showToast(errorMessage(e, "Couldn't send request"), "bell");
                }
              }}
            />
          );
          break;
        case "publicProfile":
          body = (
            <PublicProfile
              onBack={pop}
              userId={top.props.userId}
              relation={top.props.relation}
              onMessage={() => {
                pop();
                messagePerson(top.props.userId);
              }}
              onAdd={async () => {
                try {
                  await sendFriendRequest(top.props.userId);
                  showToast("Request sent");
                  await refetchFriends();
                } catch (e) {
                  showToast(errorMessage(e, "Couldn't send request"), "bell");
                }
              }}
              onAccept={async () => {
                try {
                  if (top.props.friendshipId)
                    await acceptFriendship(top.props.friendshipId);
                  await refetchFriends();
                  showToast("Friend added");
                } catch (e) {
                  showToast(errorMessage(e, "Couldn't accept request"), "bell");
                }
              }}
              onReject={async () => {
                try {
                  if (top.props.friendshipId)
                    await rejectFriendship(top.props.friendshipId);
                  await refetchFriends();
                } catch (e) {
                  showToast(errorMessage(e, "Couldn't decline request"), "bell");
                }
              }}
              onRemove={async () => {
                try {
                  if (top.props.friendshipId)
                    await removeFriendship(top.props.friendshipId);
                  await refetchFriends();
                  showToast("Friend removed");
                } catch (e) {
                  showToast(errorMessage(e, "Couldn't remove friend"), "bell");
                }
              }}
              onBlock={async () => {
                try {
                  if (top.props.friendshipId)
                    await blockFriendship(top.props.friendshipId);
                  await refetchFriends();
                  showToast("User blocked");
                } catch (e) {
                  showToast(errorMessage(e, "Couldn't block user"), "bell");
                }
              }}
            />
          );
          break;
        case "chatThread":
          body = (
            <ChatThread
              onBack={pop}
              chat={top.props.chat}
              meId={me?.id}
              onOpenProfile={openProfile}
            />
          );
          break;
        case "badgeDetail":
          body = (
            <BadgeDetail
              onBack={pop}
              badge={top.props.badge}
              currentDays={days}
              justUnlocked={top.props.justUnlocked}
            />
          );
          break;
        case "edit":
          body = (
            <EditProfile
              me={me}
              onBack={pop}
              onSave={() => {
                pop();
                refetchMe();
                showToast("Profile updated");
              }}
            />
          );
          break;
        case "settings":
          body = (
            <Settings
              onBack={pop}
              mode={mode}
              onToggleMode={() =>
                setTweak("mode", mode === "dark" ? "light" : "dark")
              }
              onLogout={async () => {
                // Unregister this device from FCM before dropping the session
                const fcm = localStorage.getItem("nh_fcm");
                if (fcm) {
                  try {
                    await unregisterDeviceToken(fcm);
                  } catch {}
                  localStorage.removeItem("nh_fcm");
                }
                try {
                  await signOut();
                } catch {
                  tokens.clear();
                }
                setStack([]);
                setPhase("splash");
              }}
              onDeleted={() => {
                localStorage.removeItem("nh_fcm");
                tokens.clear();
                setStack([]);
                setPhase("deleted");
              }}
              notifGranted={notifGranted}
              onEnableNotifications={enableNotifications}
              notifPrefs={notifPrefs}
              onNotifPrefChange={setNotifPref}
            />
          );
          break;
        default:
          body = null;
      }
    } else {
      // Tab root screens
      switch (tab) {
        case "home":
          body = (
            <Dashboard
              me={me}
              days={days}
              hasStreak={!!streak}
              checkedIn={checkedIn}
              milestone={milestone}
              startLabel={startLabel}
              personalRecord={personalRecord}
              totalStreaks={0}
              nextBadgeName={nextBadge?.name ?? ""}
              pulseKey={pulseKey}
              onCheckIn={onCheckIn}
              onRelapse={() => setRelapseOpen(true)}
              onOpenHistory={() => push("history")}
              onProfile={() => resetTo("profile")}
              onStartStreak={() => {
                setStartDate(todayISO());
                setStartOpen(true);
              }}
            />
          );
          break;
        case "friends":
          body = (
            <FriendsScreen
              friends={friends}
              meId={me?.id}
              requestCount={reqReceived.length}
              onOpenRequests={() => push("requests")}
              onOpenSearch={() => push("search")}
              onOpenProfile={openProfile}
              onMessage={messagePerson}
            />
          );
          break;
        case "chat":
          body = (
            <ChatList
              chats={chatList}
              meId={me?.id}
              onOpen={openChat}
              onOpenProfile={openProfile}
            />
          );
          break;
        case "badges":
          body = (
            <BadgesScreen
              badges={liveBadges}
              currentDays={days}
              onOpen={(id) =>
                push("badgeDetail", {
                  badge: liveBadges.find((b) => b.id === id),
                })
              }
            />
          );
          break;
        case "profile":
          body = (
            <MyProfile
              me={me}
              earnedBadges={liveBadges.filter((b) => b.earned)}
              days={days}
              personalRecord={personalRecord}
              badgeCount={badgeCount}
              totalBadges={badgeList.length}
              joined={me?.created_at ?? ""}
              onEdit={() => push("edit")}
              onSettings={() => push("settings")}
              onOpenBadges={() => resetTo("badges")}
            />
          );
          break;
        default:
          body = null;
      }
    }
  }

  const showTabs = phase === "app" && stack.length === 0;
  const showBanner = banner && phase === "app";

  return (
    <div
      className="nh-root"
      data-dir={dir}
      data-mode={mode}
      data-reduce-motion={motion ? "no" : "yes"}
    >
      <div
        id="nh-screen"
        style={{ position: "absolute", inset: 0, overflow: "hidden" }}
      >
        {/* Animated screen container — key change triggers nhScreenIn */}
        <div
          key={
            phase + tab + (stack.length ? stack[stack.length - 1].screen : "")
          }
          style={{
            position: "absolute",
            inset: 0,
            animation: "nhScreenIn .34s cubic-bezier(.2,.8,.3,1) both",
          }}
        >
          {body}
        </div>

        {showBanner && (
          <Banner
            icon={banner.icon}
            title={banner.title}
            body={banner.body}
            onTap={() => {
              setBanner(null);
              resetTo(banner.to);
              if (banner.chatId) setTimeout(() => openChat(banner.chatId), 40);
            }}
            onClose={() => setBanner(null)}
          />
        )}

        {toast && <Toast text={toast.text} icon={toast.icon} />}

        {showTabs && (
          <TabBar
            active={tab}
            onChange={resetTo}
            badges={{
              friends: reqReceived.length || undefined,
              chat: chatUnread || undefined,
            }}
          />
        )}

        <CheckInModal
          open={phase === "app" && needsCheckin}
          missedDays={missedDays}
          lastCheckinDate={lastCheckinDate}
          onConfirm={onCheckinConfirm}
          loading={streakLoading}
        />

        <StartStreakSheet
          open={startOpen}
          date={startDate}
          loading={streakLoading}
          onChangeDate={setStartDate}
          onConfirm={onStartConfirm}
          onClose={() => setStartOpen(false)}
        />

        <RelapseSheet
          open={relapseOpen}
          days={days}
          loading={streakLoading}
          onConfirm={onRelapseConfirm}
          onClose={() => setRelapseOpen(false)}
        />
      </div>

      <TweaksPanel>
        <TweakSection label="Visual direction" />
        <TweakRadio
          label="Theme"
          value={dir}
          options={["sage", "dawn"]}
          onChange={(v) => setTweak("direction", v)}
        />
        <TweakRadio
          label="Appearance"
          value={mode}
          options={["light", "dark"]}
          onChange={(v) => setTweak("mode", v)}
        />
        <TweakSection label="Motion" />
        <TweakToggle
          label="Background & celebration motion"
          value={motion}
          onChange={(v) => setTweak("motion", v)}
        />
        <div
          style={{
            fontSize: 11.5,
            color: "rgba(0,0,0,0.45)",
            padding: "2px 2px 8px",
            lineHeight: 1.5,
          }}
        >
          Sage = humanist sans, muted green. Dawn = soft serif numerals, warm
          clay.
        </div>
      </TweaksPanel>
    </div>
  );
}
