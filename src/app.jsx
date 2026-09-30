import {
  Banner,
  BottomSheet,
  hashHue,
  NoSelection,
  NoticeSheet,
  Screen,
  SideNav,
  SplitView,
  TabBar,
  Toast,
} from "@components";
import { Btn, Icon, useWide } from "@ui";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { errorMessage } from "./connectors/api.js";
import {
  connect as connectSocket,
  disconnect as disconnectSocket,
  reauth as reauthSocket,
} from "./connectors/socket.js";
import { tokens } from "./connectors/tokens.js";
import { refreshToken, signOut } from "./services/api/auth.js";
import { unregisterDeviceToken } from "./services/api/device.js";
import {
  acceptFriendship,
  blockFriendship,
  rejectFriendship,
  removeFriendship,
  sendFriendRequest,
} from "./services/api/friendship.js";
import { reportUser } from "./services/api/report.js";
import { getUsers } from "./services/api/user.js";
import { milestoneDays, withEarnedState } from "./services/badges.js";
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
import { AdminDashboard } from "./screens/admin/AdminDashboard.jsx";
import { ModerationQueue } from "./screens/moderation/ModerationQueue.jsx";
import { ReportReview } from "./screens/moderation/ReportReview.jsx";
import { Dashboard } from "./screens/home/Dashboard.jsx";
import { StreakHistory } from "./screens/home/StreakHistory.jsx";
import { EditProfile } from "./screens/profile/EditProfile.jsx";
import { ConsentGate } from "./screens/legal/ConsentGate.jsx";
import { CrisisResources } from "./screens/legal/CrisisResources.jsx";
import { LegalDocument } from "./screens/legal/LegalDocument.jsx";
import { DataAndPrivacy } from "./screens/profile/DataAndPrivacy.jsx";
import { ForcedRename } from "./screens/profile/ForcedRename.jsx";
import { MyProfile } from "./screens/profile/MyProfile.jsx";
import { Settings } from "./screens/profile/Settings.jsx";
import { checkinReminder } from "./services/checkinReminder.js";
import { cacheClearAll } from "./store/cache.js";
import { useBadges } from "./store/useBadges.js";
import { useChats } from "./store/useChats.js";
import { useCheckinReminder } from "./store/useCheckinReminder.js";
import { useFriends } from "./store/useFriends.js";
import { useNotifications } from "./store/useNotifications.js";
import { useModerator } from "./store/useModeration.js";
import { useNotices } from "./store/useNotices.js";
import { useNotifPrefs } from "./store/useNotifPrefs.js";
import { useStreak } from "./store/useStreak.js";
import { useUser } from "./store/useUser.js";

// ── Domain constants (see CLAUDE.md for full status code reference) ───────────
import { STATUS_CONSTANTS } from "./services/constants.js";
import { goToLanding, landingApplies, requestedStart } from "./landing.js";

// ── Theme defaults ────────────────────────────────────────────────────────────
const TWEAK_DEFAULTS = {
  direction: "sage",
  mode: "light",
  motion: true,
  accentName: "warm",
};

// Theme choices survive a reload. The pre-paint script in index.html reads this
// same key and applies data-dir/data-mode before first paint, so a dark-mode
// user never gets a white page on load. Keep the key and the allowed values in
// sync with that script.
const TWEAKS_KEY = "nh_tweaks";
const TWEAK_OPTIONS = {
  direction: ["sage", "dawn"],
  mode: ["light", "dark"],
  motion: [true, false],
};

// Stored values are only hints: anything unrecognised falls back to the default
// rather than reaching the DOM as an attribute value.
function loadTweaks() {
  const stored = { ...TWEAK_DEFAULTS };
  try {
    const raw = JSON.parse(localStorage.getItem(TWEAKS_KEY) || "{}");
    for (const [key, allowed] of Object.entries(TWEAK_OPTIONS)) {
      if (allowed.includes(raw[key])) stored[key] = raw[key];
    }
  } catch {}
  return stored;
}

const INITIAL_TWEAKS = loadTweaks();

// How many directory entries to pull per page while building the search pool.
const USER_PAGE_SIZE = 100;

// ── Helpers ───────────────────────────────────────────────────────────────────
function todayISO() {
  return new Date().toISOString().slice(0, 10);
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

// Mirrors the backend's ACCOUNT_DELETION_GRACE_DAYS — see Settings.jsx. Shown,
// never enforced here.
const GRACE_DAYS = Number(import.meta.env.VITE_DELETION_GRACE_DAYS) || 30;

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
          Your account is deleted
        </div>
        <div
          style={{
            fontSize: 15,
            color: "var(--ink-2)",
            marginTop: 12,
            lineHeight: 1.55,
          }}
        >
          We're sorry to see you go. Recovery isn't linear — if you change your
          mind in the next {GRACE_DAYS} days, signing in brings your streak,
          badges and friends back. After that it is erased for good.
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
  const [t, setTweak] = useTweaks(INITIAL_TWEAKS);
  const { direction: dir, mode, motion } = t;

  // Structural breakpoint only — every size, gutter and column width is a CSS
  // custom property in theme.css. See src/ui/useBreakpoint.js.
  const wide = useWide();

  // Mirror the theme onto <html> so the page behind .nh-root resolves --bg.
  // Screens fade in (nhScreenIn), and during that fade the document background
  // is visible; without this it falls back to the light token and dark mode
  // flashes white on every screen change.
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-dir", dir);
    html.setAttribute("data-mode", mode);
  }, [dir, mode]);

  useEffect(() => {
    try {
      localStorage.setItem(
        TWEAKS_KEY,
        JSON.stringify({ direction: dir, mode, motion }),
      );
    } catch {}
  }, [dir, mode, motion]);

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
    refetch: refetchStreak,
  } = useStreak();
  const {
    friends: friendshipData,
    requestsReceived: reqRecvData,
    requestsSent: reqSentData,
    refetch: refetchFriends,
  } = useFriends();
  const { chats: chatData, markChatRead } = useChats(me?.id);
  const { badges: badgeData, userBadges, refetch: refetchBadges } = useBadges();

  // ── Derived data ──────────────────────────────────────────────────────────
  const chatList = chatData.chats ?? [];
  const badgeList = badgeData.badges ?? [];

  const friends =
    friendshipData.friendships?.filter(
      (f) => f.status === STATUS_CONSTANTS.accepted,
    ) ?? [];
  const reqReceived = reqRecvData.friendships ?? [];
  const reqSent = reqSentData.friendships ?? [];

  // Pool of users for friend search. The directory is paginated and there is no
  // server-side search, so the pool starts at the first page and grows on
  // demand while the user is searching (see loadMoreUsers).
  const [userPool, setUserPool] = useState([]);
  const [userPoolDone, setUserPoolDone] = useState(false);
  const poolCursor = useRef({ page: 0, loading: false, done: false });

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
            role: u.role ?? null,
            hue: hashHue(u.username),
            rel: isFriend ? "friend" : isPending ? "pending" : "none",
          };
        }),
    [userPool, friends, reqSent, reqReceived, me],
  );

  // Count unread messages sent by the other user across all chats
  // Sum of unread across all chats (backend already excludes my own messages).
  const chatUnread = useMemo(
    () => chatList.reduce((n, c) => n + (c.unread_count ?? 0), 0),
    [chatList],
  );

  // The tab bar and the side rail show the same counts; they differ only in
  // where they sit.
  const navBadges = {
    friends: reqReceived.length || undefined,
    chat: chatUnread ? (chatUnread > 99 ? "99+" : chatUnread) : undefined,
  };

  // Earned state is what the backend granted (GET /user-badges/), never a
  // comparison against `milestone` — the grant rule belongs to the server.
  const liveBadges = withEarnedState(badgeList, userBadges);
  const badgeCount = liveBadges.filter((b) => b.earned).length;
  const nextBadge =
    liveBadges.find((b) => !b.earned) ?? liveBadges[liveBadges.length - 1];
  // `milestone` is an integer day count. Null only if a badge ever arrives
  // with something else in it — screens then hide the countdown, not print NaN.
  const milestone = nextBadge ? milestoneDays(nextBadge) : null;

  const startLabel = streak?.start_at
    ? new Date(streak.start_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "—";
  // GET /streaks/record returns the closed streak itself, so the fields are
  // `start_at` / `end_at` — the short names read as undefined and made this NaN.
  const personalRecord = record?.start_at
    ? Math.floor(
        (new Date(record.end_at ?? Date.now()) - new Date(record.start_at)) /
          86_400_000,
      )
    : 0;

  // ── Navigation ────────────────────────────────────────────────────────────
  // phase: 'splash' | 'register' | 'login' | 'app' | 'deleted'
  // stack: overlay screens pushed on top of the active tab root
  // A session wins; otherwise a `?start=` link from the landing page picks the
  // first screen (see src/landing.js), and the installed app starts on the
  // splash.
  const [phase, setPhase] = useState(() =>
    tokens.getAccess() ? "app" : (requestedStart() ?? "splash"),
  );

  // The query has done its job once read; left in the address bar it would
  // reopen the same screen on every reload.
  useEffect(() => {
    if (requestedStart()) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  // Where "back to the start" goes. On the web that is the landing page — the
  // splash's two buttons are the landing's own, so showing both would be the
  // same question asked twice. The installed app has no landing and keeps the
  // splash.
  const toFront = useCallback(() => {
    if (landingApplies()) goToLanding();
    else setPhase("splash");
  }, []);

  // What the socket connector does when the server refuses the handshake. It
  // stays out of connectors/socket.js on purpose: api.js already imports that
  // module, so reaching back for refresh/sign-out from inside it would close an
  // import cycle. Defined above the first connect() below — the initialiser
  // runs during this render.
  const socketAuthHandlers = useMemo(
    () => ({
      // invalid_token: the access token expired mid-session. Refresh, then hand
      // the new one to the socket; the connector retries once and no more.
      onAuthExpired: async () => {
        const fresh = await refreshToken();
        reauthSocket(fresh.accessToken);
      },
      // account_unavailable, or a refresh that failed: this session is over.
      // Back to the splash rather than the "account is gone" screen — banned
      // and blocked land here too, and only one of the three is a deletion.
      onSessionEnd: () => {
        tokens.clear();
        cacheClearAll();
        setStack([]);
        toFront();
      },
    }),
    [toFront],
  );

  // Open the realtime socket during the FIRST render (before any subscribe
  // effect below runs) so restored sessions have a live socket for every WS
  // listener to attach to. Without this the socket object never existed and all
  // onMessage / presence / friend subscriptions silently no-op'd.
  useState(() => {
    const token = tokens.getAccess();
    if (token) connectSocket(token, socketAuthHandlers);
    return null;
  });

  // React to login/logout during the session: connect on entering the app,
  // tear down when the session ends (logout reloads the page; delete does not).
  useEffect(() => {
    if (phase === "app") {
      const token = tokens.getAccess();
      if (token) connectSocket(token, socketAuthHandlers);
    } else if (phase === "splash" || phase === "deleted") {
      disconnectSocket();
    }
  }, [phase, socketAuthHandlers]);
  // What moderation has said to this account and the user has not seen yet.
  // Shown over everything on open — a warning is said once, and saying it in
  // the middle of a check-in would be worse than not saying it.
  const { notice, acknowledge: acknowledgeNotice } = useNotices(phase === "app");

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

  // Whether this account can moderate. There is no "am I an admin" endpoint —
  // every moderation route answers 404 to everyone else rather than 403, so
  // the probe *is* the answer (see store/useModeration.js). Run only once
  // Settings is open: every user would pay the request otherwise, for a row
  // almost none of them can use.
  const { isModerator } = useModerator(
    phase === "app" && stack.some((entry) => entry.screen === "settings"),
  );
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
  // Bumped when a report is decided, so the queue behind it refetches instead
  // of showing the row that was just closed.
  const [queueKey, setQueueKey] = useState(0);
  const [relapseOpen, setRelapseOpen] = useState(false);
  const [startOpen, setStartOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [toast, setToast] = useState(null);
  const [banner, setBanner] = useState(null);

  // Escape is the desktop's back gesture. It unwinds one layer at a time, and
  // only layers the user is allowed to dismiss: the check-in modal and a
  // moderation notice are answered, not escaped.
  useEffect(() => {
    if (phase !== "app") return;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (startOpen) return setStartOpen(false);
      if (relapseOpen) return setRelapseOpen(false);
      setStack((s) => (s.length ? s.slice(0, -1) : s));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, startOpen, relapseOpen]);

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

  /**
   * Pull the next page of the user directory into the search pool.
   * @returns {Promise<boolean>} true while more pages remain
   */
  const loadMoreUsers = useCallback(async () => {
    const cursor = poolCursor.current;
    if (cursor.done || cursor.loading) return !cursor.done;
    cursor.loading = true;
    try {
      const next = cursor.page + 1;
      const res = await getUsers(true, next, USER_PAGE_SIZE);
      const items = res.items ?? res.users ?? [];
      cursor.page = next;
      setUserPool((prev) => [...prev, ...items]);
      const lastPage =
        items.length < USER_PAGE_SIZE ||
        (res.totalPages != null && next >= res.totalPages);
      if (lastPage) {
        cursor.done = true;
        setUserPoolDone(true);
      }
      return !cursor.done;
    } catch {
      cursor.done = true;
      setUserPoolDone(true);
      return false;
    } finally {
      cursor.loading = false;
    }
  }, []);

  // Seed the first page as soon as the app opens, so search feels instant for
  // the common case.
  useEffect(() => {
    if (phase !== "app") return;
    poolCursor.current = { page: 0, loading: false, done: false };
    setUserPool([]);
    setUserPoolDone(false);
    loadMoreUsers();
  }, [phase, loadMoreUsers]);

  // ── Streak actions ────────────────────────────────────────────────────────
  const onCheckIn = async () => {
    try {
      await checkIn();
    } catch (e) {
      showToast(errorMessage(e, "Couldn't check in"), "bell");
      return;
    }
    setPulseKey((k) => k + 1);
    // The server grants badges during the check-in; without this the grid and
    // the "next badge" card keep the pre-check-in answer for up to an hour.
    refetchBadges();
    if (motion) burstConfetti();
    showToast(`Checked in — day ${days + 1} ✓`);
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
    refetchBadges();
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
    refetchBadges();
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
    // A backdated start grants every milestone already passed, in one go.
    refetchBadges();
    if (motion) burstConfetti();
    showToast("Your streak has begun. One day at a time.", "heart");
  };

  // ── Screen routing ────────────────────────────────────────────────────────
  let body;
  // Moderation reset this account's username and the app shows one screen
  // until a new one is chosen. Read in several places below, so it is named
  // once rather than spelled out at each of them.
  const mustRename = phase === "app" && !!me?.must_change_username;
  // Something was republished — or this account never answered — and the app
  // shows the consent screen and nothing else until it does. Ahead of the
  // rename below: picking a username is using the service, and the terms are
  // what govern that.
  const owesConsent =
    phase === "app" && (me?.pending_consents?.length ?? 0) > 0;
  // Set below; read again by the screen-animation key, which must not treat a
  // pane swap as a page change.
  let chatPane = false;
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
        onBack={toFront}
        onDone={() => {
          // Reboot so store hooks fetch fresh for the just-authed account.
          cacheClearAll();
          window.location.reload();
        }}
      />
    );
  } else if (phase === "login") {
    body = (
      <LoginScreen
        onBack={toFront}
        onDone={() => {
          // Reboot so store hooks fetch fresh for the just-authed account.
          cacheClearAll();
          window.location.reload();
        }}
      />
    );
  } else if (phase === "deleted") {
    body = <DeletedScreen onRestart={toFront} />;
  } else if (owesConsent) {
    // Instead of the app rather than beside it, for the same reason the rename
    // screen is: a prompt someone can dismiss leaves an account using the
    // service under terms it never accepted, which is the state this exists to
    // make impossible.
    body = <ConsentGate onDone={refetchMe} />;
  } else if (mustRename) {
    // Moderation took the username away and the account owes a new one. This
    // is not a nag beside the app, it is instead of it: a screen the user can
    // dismiss leaves accounts sitting under a generated handle for ever, and
    // the whole point of the sanction was that the old name stopped being in
    // use. Everything else about the account is untouched, which is why this
    // is a screen and not a sign-out.
    body = <ForcedRename me={me} onDone={refetchMe} />;
  } else {
    const top = stack[stack.length - 1];

    // Overlay screens (pushed over the active tab). A function of a stack
    // entry rather than of `stack`, because the desktop two-pane layout needs
    // an overlay and a tab root rendered at the same time.
    const renderOverlay = (top) => {
      let body = null;
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
              poolComplete={userPoolDone}
              onLoadMore={loadMoreUsers}
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
              // Rethrows on failure: the report sheet keeps itself open and
              // shows the reason, so the reporter does not lose what they wrote.
              //
              // The chat id goes with it when the two have one. The backend
              // copies that conversation's last messages as evidence — only
              // the id travels, never the text, so a report cannot quote words
              // the other person never wrote. Without it a moderator has the
              // reporter's sentence and nothing else.
              onReport={async (reason, details) => {
                const chat = chatList.find(
                  (x) =>
                    x.sender === top.props.userId ||
                    x.reciver === top.props.userId,
                );
                await reportUser(top.props.userId, reason, details, chat?.id);
                showToast("Report sent — thank you", "flag");
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
              onRead={(chatId) => markChatRead(chatId)}
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
                // Drop this account's cached data, then reboot so every store
                // hook re-initialises empty (no stale data on next login).
                cacheClearAll();
                window.location.reload();
              }}
              onDeleted={() => {
                localStorage.removeItem("nh_fcm");
                tokens.clear();
                cacheClearAll();
                setStack([]);
                setPhase("deleted");
              }}
              notifGranted={notifGranted}
              onEnableNotifications={enableNotifications}
              notifPrefs={notifPrefs}
              onNotifPrefChange={setNotifPref}
              isModerator={isModerator}
              onOpenModeration={() => push("moderation")}
              onOpenAdmin={() => push("admin")}
              onOpenCrisis={() => push("crisis")}
              onOpenPrivacy={() => push("privacy")}
            />
          );
          break;
        case "privacy":
          body = (
            <DataAndPrivacy
              onBack={pop}
              onOpenDocument={(docKey, version) =>
                push("legalDoc", { docKey, version })
              }
              onConsentChange={async () => {
                // Withdrawing deletes every streak and giving it back starts
                // from zero, so the home screen is wrong either way until both
                // of these have run.
                await refetchMe();
                await refetchStreak();
              }}
            />
          );
          break;
        case "legalDoc":
          body = (
            <LegalDocument
              docKey={top.props.docKey}
              version={top.props.version}
              onBack={pop}
            />
          );
          break;
        case "crisis":
          body = <CrisisResources onBack={pop} />;
          break;
        case "admin":
          body = <AdminDashboard onBack={pop} />;
          break;
        case "moderation":
          body = (
            <ModerationQueue
              onBack={pop}
              meId={me?.id}
              reloadKey={queueKey}
              onOpenReport={(report) => push("reportReview", { report })}
            />
          );
          break;
        case "reportReview":
          body = (
            <ReportReview
              onBack={pop}
              report={top.props.report}
              onToast={(text) => showToast(text, "flag")}
              // A decided report must not still be sitting in the list the
              // moderator comes back to.
              onDecided={() => setQueueKey((k) => k + 1)}
            />
          );
          break;
        default:
          body = null;
      }
      return body;
    };

    // Tab root screens
    const renderTab = () => {
      let body = null;
      switch (tab) {
        case "home":
          body = (
            <Dashboard
              me={me}
              days={days}
              streakStart={streak?.start_at ?? null}
              hasStreak={!!streak}
              checkedIn={checkedIn}
              milestone={milestone}
              startLabel={startLabel}
              personalRecord={personalRecord}
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
              // The tracker is the only thing the health-data consent covers,
              // and `POST /streaks/start` answers 403 without it. The server
              // is the authority here, as it is for `pending_consents`.
              healthConsent={me?.health_data_consent !== false}
              onOpenPrivacy={() => push("privacy")}
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
              selectedId={
                stack[stack.length - 1]?.screen === "chatThread"
                  ? stack[stack.length - 1].props?.chat?.id
                  : null
              }
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
      return body;
    };

    // Two panes, on a desktop only, and only for chat. A conversation list you
    // cannot see while reading a message is the single place the phone layout
    // costs the most on a big screen.
    //
    // Two screens are deliberately left as full overlays. `publicProfile` is
    // pushed from four different places (friends, chat list, search, requests),
    // so there is no one list it belongs beside — and a profile is a
    // destination, not a row you scan past. `reportReview` is not a pane
    // because opening a report *claims* it and leaving releases it (see
    // moderation in CLAUDE.md); a queue permanently beside a claimed report
    // invites exactly the half-open state that lock is there to prevent.
    chatPane =
      wide &&
      tab === "chat" &&
      (!top || (top.screen === "chatThread" && stack.length === 1));

    if (chatPane) {
      body = (
        <SplitView
          master={renderTab()}
          detail={
            top ? (
              renderOverlay(top)
            ) : (
              <NoSelection
                title="No conversation open"
                sub="Pick someone on the left to read and reply here."
              />
            )
          }
          detailKey={top?.props?.chat?.id ?? "none"}
        />
      );
    } else {
      body = top ? renderOverlay(top) : renderTab();
    }
  }

  // The bottom bar hides behind a pushed screen because a phone cannot show
  // both; the side rail stays, because a desktop can — and a rail that
  // disappeared every time you opened a chat would be worse than none.
  // Neither full-screen gate has navigation over it. Both are shown *instead*
  // of the app, and a tab bar on top of one is a control that changes a screen
  // nobody can see — on a desktop the rail sits beside a screen that is
  // supposed to be the only thing there.
  const showNav =
    phase === "app" &&
    !owesConsent &&
    !mustRename &&
    (wide || stack.length === 0);
  const showBanner = banner && phase === "app";

  return (
    <div
      className="nh-root"
      data-dir={dir}
      data-mode={mode}
      data-reduce-motion={motion ? "no" : "yes"}
      /* --nav-offset is how much of the left edge the side rail is actually
         occupying right now. --nav-w is a width and stays 240px on a desktop
         whether or not a rail is drawn; this is what everything else aligns
         to, so a toast on the login screen is not pushed by absent furniture. */
      style={{ "--nav-offset": showNav && wide ? "var(--nav-w)" : "0px" }}
    >
      <div
        id="nh-screen"
        style={{ position: "absolute", inset: 0, overflow: "hidden" }}
      >
        {/* Animated screen container — key change triggers nhScreenIn */}
        <div
          id="nh-stage"
          key={
            // In two-pane mode the pushed screen is not a new page — it lands
            // in the pane beside the list, which must not re-animate. SplitView
            // keys the detail itself.
            phase + tab + (chatPane || !stack.length ? "" : stack[stack.length - 1].screen)
          }
          style={{
            position: "absolute",
            inset: 0,
            left: "var(--nav-offset)",
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

        {showNav &&
          (wide ? (
            <SideNav active={tab} onChange={resetTo} badges={navBadges} />
          ) : (
            <TabBar active={tab} onChange={resetTo} badges={navBadges} />
          ))}

        {/* Ahead of the check-in modal on purpose: being asked "all clean
            today?" while an unread warning waits is the wrong order. */}
        {phase === "app" && notice && (
          <NoticeSheet notice={notice} onAcknowledge={acknowledgeNotice} />
        )}

        {/* Not while the rename screen is up. Asking "all clean today?" of
            someone who cannot use the app until they rename themselves is the
            same wrong order the notice already avoids. */}
        <CheckInModal
          open={
            phase === "app" && !notice && !owesConsent && !mustRename && needsCheckin
          }
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
