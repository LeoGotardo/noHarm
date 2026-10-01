import { Icon } from "@ui";
import { useState } from "react";
import { clampText } from "./utils.js";

// A short, hand-picked set rather than the full Unicode list: no dependency,
// no megabyte of data, and nothing in it that reads wrong in a recovery app.
// The keyboard's own emoji panel still works everywhere for anything else.
const CATEGORIES = [
  {
    key: "smileys",
    label: "Smileys",
    icon: "😊",
    emojis:
      "😀 😃 😄 😁 😆 😅 😂 🙂 😉 😊 😇 🥰 😍 🤩 😘 😋 😜 🤗 🤭 🤔 😐 😌 😴 🥲 😢 😭 😤 😠 😔 😞 😟 😕 🙁 😣 😖 😫 😩 🥺 😳 😬 😮‍💨 😶 🫠 🫡 🤞 😎 🤓 🥳",
  },
  {
    key: "gestures",
    label: "Gestures",
    icon: "👍",
    emojis:
      "👍 👎 👏 🙌 🙏 🤝 💪 ✊ 👊 🤜 🤛 👋 ✌️ 🤟 👌 🫶 🤲 👐 ☝️ 👆 👇 👉 👈 🫂 🧘 🚶 🏃 🧗",
  },
  {
    key: "hearts",
    label: "Hearts",
    icon: "❤️",
    emojis:
      "❤️ 🧡 💛 💚 💙 💜 🤎 🖤 🤍 💖 💗 💓 💞 💕 💘 💝 ❣️ ❤️‍🩹 💔 ♥️",
  },
  {
    key: "nature",
    label: "Nature",
    icon: "🌱",
    emojis:
      "🌱 🌿 🍀 🌳 🌲 🌻 🌸 🌼 🌷 🌹 🍃 🌈 ☀️ 🌤️ ⛅ 🌧️ ⛈️ 🌙 ⭐ 🌟 ✨ 🌊 🔥 💧 🦋 🐢 🐶 🐱",
  },
  {
    key: "celebrate",
    label: "Celebrate",
    icon: "🎉",
    emojis:
      "🎉 🎊 🥳 🏆 🥇 🏅 🎖️ 🎯 🚀 📈 ✅ ☑️ 💯 🔝 🙌 🎂 🎁 🎈 👑 💎 ⚡ 🌅 🗓️ ⏳ 🔑 🛡️ 🧭 ⚓",
  },
  {
    key: "things",
    label: "Daily life",
    icon: "☕",
    emojis:
      "☕ 🍵 🥤 💧 🍎 🥗 🍲 🍳 🛏️ 🛁 🏋️ 🚴 📚 ✍️ 🎧 🎵 🎨 🎮 📱 💬 📞 🏠 🌍 ✈️ 🕯️ 🧩 ☮️ 🕊️",
  },
].map((c) => ({ ...c, emojis: c.emojis.split(" ") }));

const RECENT_KEY = "nh_emoji_recent";
const RECENT_MAX = 16;

// Per-device convenience only, so every access is guarded: a private window
// or blocked storage gets a picker without a Recent row, not a crash.
function readRecent() {
  try {
    const v = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((e) => typeof e === "string") : [];
  } catch {
    return [];
  }
}

function pushRecent(emoji) {
  const next = [emoji, ...readRecent().filter((e) => e !== emoji)].slice(
    0,
    RECENT_MAX,
  );
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {}
  return next;
}

/**
 * Insert `emoji` into a controlled input/textarea at its caret, replacing any
 * selection, and put the caret after it. `max` (code points) keeps the result
 * inside the field's limit — an emoji that would not fit is dropped whole.
 */
export function insertAtCursor(el, value, emoji, setValue, max) {
  const start = el?.selectionStart ?? value.length;
  const end = el?.selectionEnd ?? value.length;
  const next = value.slice(0, start) + emoji + value.slice(end);
  if (max != null && clampText(next, max) !== next) return;
  setValue(next);
  const caret = start + emoji.length;
  requestAnimationFrame(() => {
    if (!el) return;
    try {
      el.setSelectionRange(caret, caret);
    } catch {}
  });
}

/** The smiley toggle that sits beside a text field. */
export function EmojiButton({ open, onToggle, size = 22, style }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={open ? "Close emoji picker" : "Add emoji"}
      aria-expanded={open}
      // Keep focus (and the mobile keyboard) on the field while toggling.
      onMouseDown={(e) => e.preventDefault()}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 6,
        display: "flex",
        borderRadius: 99,
        color: open ? "var(--primary)" : "var(--ink-3)",
        flexShrink: 0,
        ...style,
      }}
    >
      <Icon name="emoji" size={size} />
    </button>
  );
}

/**
 * An inline panel of emoji — it takes room in the layout instead of floating,
 * so it never lands off-screen inside a sheet or under the keyboard.
 */
export function EmojiPicker({ onPick, style }) {
  const [recent, setRecent] = useState(readRecent);
  const tabs = recent.length
    ? [{ key: "recent", label: "Recent", icon: "🕘", emojis: recent }, ...CATEGORIES]
    : CATEGORIES;
  const [tab, setTab] = useState(tabs[0].key);
  const current = tabs.find((t) => t.key === tab) ?? tabs[0];

  const pick = (emoji) => {
    onPick(emoji);
    // The Recent tab keeps its order while open: reshuffling under the
    // finger makes the next tap hit a different emoji.
    if (tab !== "recent") setRecent(pushRecent(emoji));
    else pushRecent(emoji);
  };

  return (
    <div
      role="dialog"
      aria-label="Emoji picker"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        role="tablist"
        style={{
          display: "flex",
          gap: 2,
          padding: "6px 6px 0",
          borderBottom: "1px solid var(--border)",
          overflowX: "auto",
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={t.key === current.key}
            title={t.label}
            aria-label={t.label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setTab(t.key)}
            style={{
              background: "none",
              border: "none",
              borderBottom: `2px solid ${
                t.key === current.key ? "var(--primary)" : "transparent"
              }`,
              padding: "6px 10px 8px",
              fontSize: 18,
              lineHeight: 1,
              cursor: "pointer",
              opacity: t.key === current.key ? 1 : 0.55,
              flexShrink: 0,
            }}
          >
            {t.icon}
          </button>
        ))}
      </div>
      <div
        className="nh-scroll"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(40px, 1fr))",
          padding: 6,
          maxHeight: 184,
          overflowY: "auto",
        }}
      >
        {current.emojis.map((e) => (
          <button
            key={e}
            type="button"
            aria-label={e}
            onMouseDown={(ev) => ev.preventDefault()}
            onClick={() => pick(e)}
            style={{
              background: "none",
              border: "none",
              borderRadius: 10,
              height: 40,
              fontSize: 24,
              lineHeight: 1,
              cursor: "pointer",
            }}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}
