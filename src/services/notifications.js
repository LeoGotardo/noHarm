const supported = () => "Notification" in window;

export const notif = {
  /**
   * Ask for browser notification permission.
   * @returns {Promise<boolean>} true if granted
   */
  async requestPermission() {
    if (!supported()) return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;
    const result = await Notification.requestPermission();
    return result === "granted";
  },

  get granted() {
    return supported() && Notification.permission === "granted";
  },

  /**
   * Fire a browser notification.
   * Silently skipped when: not supported, permission denied, or tab is focused
   * (focused = in-app toast already visible, no need to duplicate).
   *
   * @param {string} title
   * @param {string} body
   * @param {string} [tag]  - deduplicates notifications with the same tag
   */
  send(title, body, tag) {
    if (!this.granted) return;
    if (document.visibilityState === "visible") return;
    new Notification(title, { body, tag, icon: "/icon.png" });
  },
};
