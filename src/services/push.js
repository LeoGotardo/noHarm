import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";

const isNative = Capacitor.isNativePlatform();

export const push = {
  get isNative() {
    return isNative;
  },

  /** Request push notification permission. Returns true if granted. */
  async requestPermission() {
    if (!isNative) return false;
    const { receive } = await PushNotifications.requestPermissions();
    return receive === "granted";
  },

  /**
   * Register device with FCM and get the token.
   * @param {(token: string) => void} onToken  called once with the FCM token
   * @param {(err: any) => void}      onError  called if registration fails
   * @returns {Promise<() => void>} cleanup function
   */
  async register(onToken, onError = console.error) {
    if (!isNative) return () => {};

    const regListener = await PushNotifications.addListener(
      "registration",
      ({ value }) => {
        onToken(value);
      },
    );
    const errListener = await PushNotifications.addListener(
      "registrationError",
      onError,
    );

    await PushNotifications.register();

    return () => {
      regListener.remove();
      errListener.remove();
    };
  },

  /**
   * Listen for notifications received while the app is in the foreground.
   * (Background/closed notifications are shown natively by the OS.)
   * @param {(notification: object) => void} handler
   * @returns {Promise<() => void>} cleanup
   */
  async onForeground(handler) {
    if (!isNative) return () => {};
    const listener = await PushNotifications.addListener(
      "pushNotificationReceived",
      handler,
    );
    return () => listener.remove();
  },

  /**
   * Listen for the user tapping a push notification.
   * @param {(action: object) => void} handler
   * @returns {Promise<() => void>} cleanup
   */
  async onTap(handler) {
    if (!isNative) return () => {};
    const listener = await PushNotifications.addListener(
      "pushNotificationActionPerformed",
      handler,
    );
    return () => listener.remove();
  },
};
