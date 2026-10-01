import {
  BottomSheet,
  clampText,
  EmojiButton,
  EmojiPicker,
  insertAtCursor,
  textLength,
} from "@components";
import { Btn, Icon } from "@ui";
import { useEffect, useRef, useState } from "react";
import { errorMessage } from "../../connectors/api.js";
import { POST_MAX, VISIBILITY } from "../../services/api/post.js";

/**
 * Write a post.
 *
 * The audience is picked every time and starts at Friends: the Terms promise
 * that the choice is made per post, and the narrower audience is the one a
 * person does not regret by accident. What is written survives closing the
 * sheet until it is posted — losing a paragraph about a hard day to a stray
 * tap on the backdrop is worse than a draft that waits.
 *
 * `onSubmit(content, visibility)` does the request; a rejection keeps the
 * sheet open with the reason inline.
 */
export function ComposeSheet({ open, onClose, onSubmit, onOpenCrisis }) {
  const [text, setText] = useState("");
  const [visibility, setVisibility] = useState("friends");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const field = useRef(null);

  useEffect(() => {
    if (!open) return;
    setVisibility("friends");
    setEmojiOpen(false);
    setError(null);
    setSending(false);
    // After the sheet's entrance, so the keyboard does not fight the slide.
    const t = setTimeout(() => field.current?.focus(), 250);
    return () => clearTimeout(t);
  }, [open]);

  const trimmed = text.trim();
  const left = POST_MAX - textLength(text);

  const send = async () => {
    if (!trimmed || sending) return;
    setSending(true);
    setError(null);
    try {
      await onSubmit(trimmed, visibility);
      setText("");
      onClose?.();
    } catch (e) {
      setError(errorMessage(e, "Couldn't post that. Please try again."));
    } finally {
      setSending(false);
    }
  };

  return (
    <BottomSheet open={open} onClose={sending ? undefined : onClose} portal>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "var(--ink)",
            padding: "0 4px",
          }}
        >
          New post
        </div>

        <div
          role="radiogroup"
          aria-label="Who can see this"
          style={{ display: "flex", gap: 8 }}
        >
          {Object.values(VISIBILITY).map((v) => {
            const on = visibility === v.value;
            return (
              <button
                key={v.value}
                role="radio"
                aria-checked={on}
                onClick={() => setVisibility(v.value)}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  padding: "10px 12px",
                  borderRadius: 13,
                  cursor: "pointer",
                  background: on ? "var(--primary-soft)" : "var(--surface-2)",
                  border: `1.5px solid ${on ? "var(--primary)" : "var(--border)"}`,
                  color: on ? "var(--primary)" : "var(--ink-2)",
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "var(--font-body)",
                }}
              >
                <Icon
                  name={v.value === "friends" ? "friends" : "globe"}
                  size={17}
                  color="currentColor"
                />
                {v.label}
              </button>
            );
          })}
        </div>

        <textarea
          ref={field}
          value={text}
          onChange={(e) => setText(clampText(e.target.value, POST_MAX))}
          placeholder="What's on your mind today?"
          aria-label="Post text"
          rows={6}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "13px 15px",
            fontSize: 15.5,
            lineHeight: 1.5,
            fontFamily: "var(--font-body)",
            color: "var(--ink)",
            background: "var(--surface-2)",
            border: "1.5px solid var(--border)",
            borderRadius: 14,
            outline: "none",
            resize: "none",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            fontSize: 12.5,
            color: "var(--ink-3)",
            padding: "0 4px",
            lineHeight: 1.5,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <EmojiButton
              open={emojiOpen}
              onToggle={() => setEmojiOpen((o) => !o)}
              size={20}
              style={{ padding: 2, marginLeft: -2 }}
            />
            {VISIBILITY[visibility].hint}
          </span>
          <span
            style={{
              flexShrink: 0,
              fontVariantNumeric: "tabular-nums",
              color: left < 50 ? "var(--accent-ink)" : undefined,
            }}
          >
            {left}
          </span>
        </div>

        {emojiOpen && (
          <EmojiPicker
            onPick={(emoji) =>
              insertAtCursor(field.current, text, emoji, setText, POST_MAX)
            }
          />
        )}

        {error && (
          <div
            role="alert"
            style={{
              fontSize: 12.5,
              color: "var(--accent-ink)",
              padding: "0 4px",
              lineHeight: 1.5,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <Btn kind="outline" size="lg" full onClick={onClose} disabled={sending}>
            Cancel
          </Btn>
          <Btn
            kind="primary"
            size="lg"
            full
            icon="send"
            onClick={send}
            loading={sending}
            disabled={!trimmed}
          >
            Post
          </Btn>
        </div>

        {onOpenCrisis && <CrisisLink onClick={onOpenCrisis} />}
      </div>
    </BottomSheet>
  );
}

/**
 * The quiet way out, under anything someone might write in a bad moment. The
 * feed is not a crisis line and nobody is watching it; this says where one is.
 */
export function CrisisLink({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "4px",
        fontSize: 12.5,
        color: "var(--ink-3)",
        fontFamily: "var(--font-body)",
      }}
    >
      <Icon name="crisis" size={15} color="var(--ink-3)" />
      Need to talk to someone right now?{" "}
      <span style={{ textDecoration: "underline", fontWeight: 600 }}>
        Crisis resources
      </span>
    </button>
  );
}
