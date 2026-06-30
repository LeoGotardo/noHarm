import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { useEffect } from "react";
import { registerDeviceToken } from "../services/api/device.js";
import { notif } from "../services/notifications.js";
import { push } from "../services/push.js";
import { onMessage } from "../services/ws/chat.js";
import { onFriendAccept, onFriendRequest } from "../services/ws/friendship.js";

const isNative = Capacitor.isNativePlatform();

// Unique ID ranges per notification type to avoid collisions with checkinReminder (1001)
const ID = {
  message: (chatId) => 2000 + (Math.abs(hashStr(chatId)) % 999),
  friendRequest: 3001,
  friendAccept: 3002,
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
 * Prefs are read at event time — toggling a pref takes effect immediately
 * without re-subscribing.
 *
 * @param {string|null} meId  - current user id; null when logged out
 * @param {object}      prefs - from useNotifPrefs()
 */
export function useNotifications(meId, prefs = {}) {
  useEffect(() => {
    if (!meId) return;

    let cancelled = false;
    const cleanups = [];

    async function setup() {
      // ── Native: register FCM token for background/closed-app pushes ──────
      if (isNative) {
        const unregister = await push.register(async (token) => {
          if (cancelled) return;
          try {
            await registerDeviceToken(token);
          } catch {}
        });
        cleanups.push(unregister);
      }

      // ── WS listeners — fire for both native and web ───────────────────────
      try {
        const send = isNative
          ? (id, title, body) => localNotif(id, title, body)
          : (_, title, body, tag) => notif.send(title, body, tag);

        cleanups.push(
          onMessage(({ message }) => {
            if (message.sender === meId) return;
            if (!prefs.master || !prefs.messages) return;
            send(
              ID.message(message.chat),
              "New message",
              message.message,
              `chat-${message.chat}`,
            );
          }),

          onFriendRequest(({ username }) => {
            if (!prefs.master || !prefs.friendRequests) return;
            send(
              ID.friendRequest,
              "Friend request",
              `${username ?? "Someone"} wants to connect`,
              "friend-request",
            );
          }),

          onFriendAccept(() => {
            if (!prefs.master || !prefs.friendRequests) return;
            send(
              ID.friendAccept,
              "Friend request accepted",
              "Your request was accepted",
              "friend-accept",
            );
          }),
        );
      } catch {}
    }

    setup();

    return () => {
      cancelled = true;
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
