import { Btn } from "@ui";
import { useEffect, useState } from "react";
import { errorMessage } from "../connectors/api.js";
import { BottomSheet } from "./BottomSheet.jsx";

/**
 * "Are you sure?" for anything that changes a relationship with another
 * person — block, unblock, remove a friend, decline or cancel a request,
 * ignore a conversation — and for anything that cannot be taken back.
 *
 * One tap on a row is too cheap a way to end something with a person: a
 * block hides everything two people shared, and unblocking someone lets
 * back in exactly the person the block was for. The sheet says what will
 * happen to *the other person's* view, not only to yours, because that is the
 * part people do not picture.
 *
 * `onConfirm` may be async. The sheet stays up, busy, until it settles; a
 * rejection is shown inline and keeps it open, a resolve closes it. The
 * confirm button goes through `Btn`, so a double tap is one call.
 */
export function ConfirmSheet({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel = "Confirm",
  confirmIcon,
  cancelLabel = "Cancel",
  danger = false,
  portal,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setBusy(false);
      setError(null);
    }
  }, [open]);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm?.();
      onClose?.();
    } catch (e) {
      setError(errorMessage(e, "That didn't work. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <BottomSheet open={open} onClose={busy ? undefined : onClose} portal={portal}>
      <div
        role="alertdialog"
        aria-label={title}
        style={{ display: "flex", flexDirection: "column", gap: 10 }}
      >
        <div
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: "var(--ink)",
            padding: "0 4px",
          }}
        >
          {title}
        </div>
        {body && (
          <div
            style={{
              fontSize: 14,
              color: "var(--ink-2)",
              padding: "0 4px 6px",
              lineHeight: 1.55,
            }}
          >
            {body}
          </div>
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
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <Btn kind="outline" size="lg" full disabled={busy} onClick={onClose}>
            {cancelLabel}
          </Btn>
          <Btn
            kind={danger ? "danger" : "primary"}
            size="lg"
            full
            icon={confirmIcon}
            loading={busy}
            onClick={confirm}
          >
            {confirmLabel}
          </Btn>
        </div>
      </div>
    </BottomSheet>
  );
}

/**
 * The copy for each relationship action, in one place so a block reads the
 * same from a profile, a post and a comment. `name` is the other person.
 */
export const CONFIRM_COPY = {
  block: (name) => ({
    title: `Block ${name}?`,
    body: `${name} won't be able to see your profile, posts or comments, or message you, and you won't see theirs. If you're friends, the friendship ends. They aren't told.`,
    confirmLabel: "Block",
    confirmIcon: "block",
    danger: true,
  }),
  unblock: (name) => ({
    title: `Unblock ${name}?`,
    body: `${name} will be able to see your profile, posts and comments again, and you'll see theirs. Your friendship doesn't come back — either of you would have to send a new request.`,
    confirmLabel: "Unblock",
    danger: false,
  }),
  removeFriend: (name) => ({
    title: `Remove ${name} as a friend?`,
    body: `You'll stop seeing each other's streak and friends-only posts. ${name} isn't told, and either of you can send a new request later.`,
    confirmLabel: "Remove",
    confirmIcon: "trash",
    danger: true,
  }),
  declineRequest: (name) => ({
    title: `Decline ${name}'s request?`,
    body: `${name} isn't told, but the request goes away and they would have to send a new one.`,
    confirmLabel: "Decline",
    danger: true,
  }),
  cancelRequest: (name) => ({
    title: `Cancel your request to ${name}?`,
    body: "You can send a new one later.",
    confirmLabel: "Cancel request",
    cancelLabel: "Keep it",
    danger: true,
  }),
  ignoreChat: (name) => ({
    title: `Ignore ${name}'s message?`,
    body: `The conversation request goes away without opening. ${name} isn't told. To stop them contacting you at all, block them instead.`,
    confirmLabel: "Ignore",
    danger: true,
  }),
};
