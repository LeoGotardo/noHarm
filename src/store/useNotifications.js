import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { useEffect, useRef } from "react";
import {
  registerDeviceToken,
  unregisterDeviceToken,
} from "../services/api/device.js";
import { notif } from "../services/notifications.js";
import { push } from "../services/push.js";
import { onAdminAlert } from "../services/ws/admin.js";
import { onMessage } from "../services/ws/chat.js";
import { onFriendAccept, onFriendRequest } from "../services/ws/friendship.js";

const isNative = Capacitor.isNativePlatform();

// Unique ID ranges per notification type to avoid collisions with checkinReminder (1001)
const ID = {
  message: (chatId) => 2000 + (Math.abs(hashStr(chatId)) % 999),
  friendRequest: 3001,
  friendAccept: 3002,
  // 4000s are the system's own alerts, kept clear of the 2000s and 3000s so a
  // scheduled reminder can never replace an SSH alert by collision.
  admin: 4001,
};

function hashStr(str = "") {
  let h = 0;
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return h;
}

/** Show an immediate local notification on native. */
async function localNotif(id, title, body) {
  try {
    await LocalNotifications.schedule({ notifications: [{ id, title, body }] });
  } catch {}
}

/**
 * Wire up real-time notifications from WebSocket events.
 *
 * Both native and web listen to the same WS events.
 * Native fires LocalNotifications; web fires the browser Notification API.
 * The native FCM path (background/closed app) is handled separately via push.register().
 *
 * Prefs are read at event time through a ref — toggling a pref takes effect
 * immediately without re-subscribing.
 *
 * @param {string|null} meId  - current user id; null when logged out
 * @param {object}      prefs - from useNotifPrefs()
 */
export function useNotifications(meId, prefs = {}) {
  // The listeners below are subscribed once per account and read the switches
  // when an event arrives, so they need the current values, not the ones from
  // the render that subscribed them.
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;

  // ── Native: keep the server's copy of this device in step with Settings ──
  // A push sent while the app is closed never reaches this code, so the
  // switches only mean something if the server knows them. Master off
  // unregisters the token — which also stops badge pushes — and anything else
  // re-registers it with the three categories; the endpoint is an upsert.
  const { master, messages, friendRequests, community } = prefs;
  useEffect(() => {
    if (!meId || !isNative) return;

    let cancelled = false;

    if (!master) {
      const stored = localStorage.getItem("nh_fcm");
      if (stored) {
        unregisterDeviceToken(stored)
          .then(() => localStorage.removeItem("nh_fcm"))
          .catch(() => {});
      }
      return;
    }

    const registration = push.register(async (token) => {
      if (cancelled) return;
      try {
        await registerDeviceToken(token, {
          messages: !!messages,
          friends: !!friendRequests,
          community: !!community,
        });
        // Persist so logout can unregister this device from FCM
        localStorage.setItem("nh_fcm", token);
      } catch {}
    });

    return () => {
      cancelled = true;
      registration.then((unregister) => unregister()).catch(() => {});
    };
  }, [meId, master, messages, friendRequests, community]);

  useEffect(() => {
    if (!meId) return;

    const cleanups = [];

    async function setup() {
      // ── WS listeners — fire for both native and web ───────────────────────
      try {
        const send = isNative
          ? (id, title, body) => localNotif(id, title, body)
          : (_, title, body, tag) => notif.send(title, body, tag);

        cleanups.push(
          onMessage(({ message }) => {
            if (message.sender === meId) return;
            if (!prefsRef.current.master || !prefsRef.current.messages) return;
            send(
              ID.message(message.chat),
              "New message",
              message.message,
              `chat-${message.chat}`,
            );
          }),

          onFriendRequest(({ username }) => {
            if (!prefsRef.current.master || !prefsRef.current.friendRequests) return;
            send(
              ID.friendRequest,
              "Friend request",
              `${username ?? "Someone"} wants to connect`,
              "friend-request",
            );
          }),

          onFriendAccept(() => {
            if (!prefsRef.current.master || !prefsRef.current.friendRequests) return;
            send(
              ID.friendAccept,
              "Friend request accepted",
              "Your request was accepted",
              "friend-accept",
            );
          }),

          // System alerts, for the backend's administrators. No
          // check here: the backend emits only to those uids' rooms, so an
          // ordinary account simply never receives one.
          //
          // Deliberately not behind the notification preferences. Those are a
          // user choosing how much this app interrupts them about friends and
          // messages; an SSH login to the server is not that, and an admin who
          // muted message notifications has not asked to stop hearing about it.
          onAdminAlert(({ title, body }) => {
            if (!title) return;
            send(ID.admin, title, body ?? "", "admin-alert");
          }),
        );
      } catch {}
    }

    setup();

    return () => {
      cleanups.forEach((fn) => {
        try {
          fn();
        } catch {}
      });
    };
  }, [meId]);

  return {
    /** Must be called from a user gesture. @returns {Promise<boolean>} */
    async requestPermission() {
      if (isNative) return push.requestPermission();
      return notif.requestPermission();
    },
    get granted() {
      return isNative ? true : notif.granted;
    },
  };
}
