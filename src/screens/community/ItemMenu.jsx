import { BottomSheet, CONFIRM_COPY, ConfirmSheet } from "@components";
import { Btn } from "@ui";
import { useEffect, useState } from "react";
import { ReportSheet } from "../friends/ReportSheet.jsx";
import { SheetAction } from "../friends/SheetAction.jsx";

/**
 * The "…" menu on a post or a comment.
 *
 * `target` is `{ kind: "post" | "comment", item }`, or null when closed. What
 * it offers depends on whose it is:
 *
 * - your own: delete, behind one confirmation — there is no undo, and for a
 *   post the comments other people wrote go with it;
 * - someone else's: report, then block (confirmed first). A comment on your post can also be
 *   deleted by you (`can_delete`), which is the author keeping their own
 *   thread without waiting for a moderator.
 *
 * `onReport(target, reason, details)` rethrows on failure so the report sheet
 * stays open; `onDelete(target)` resolves to whether it worked, and it and
 * `onBlock(target)` report their own errors.
 */
export function ItemMenu({ target, onClose, onDelete, onReport, onBlock }) {
  const [confirming, setConfirming] = useState(false);
  const [reporting, setReporting] = useState(null);
  const [blocking, setBlocking] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (target) setConfirming(false);
  }, [target]);

  const item = target?.item;
  const isPost = target?.kind === "post";
  const mine = !!item?.is_mine;
  const canDelete = mine || (!isPost && !!item?.can_delete);
  const noun = isPost ? "post" : "comment";
  const username = item?.author?.username ?? "this person";

  const del = async () => {
    setBusy(true);
    try {
      // Resolves true once it is gone; false leaves the sheet up, the caller
      // having already said why.
      if (await onDelete?.(target)) onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <BottomSheet open={!!target} onClose={busy ? undefined : onClose} portal>
        {confirming ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "var(--ink)",
                padding: "0 4px",
              }}
            >
              Delete this {noun}?
            </div>
            <div
              style={{
                fontSize: 13.5,
                color: "var(--ink-2)",
                padding: "0 4px 6px",
                lineHeight: 1.5,
              }}
            >
              {isPost
                ? "It will be gone for everyone, along with its comments and likes. This can't be undone."
                : "It will be gone for everyone. This can't be undone."}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn
                kind="outline"
                size="lg"
                full
                disabled={busy}
                onClick={() => setConfirming(false)}
              >
                Keep it
              </Btn>
              <Btn
                kind="danger"
                size="lg"
                full
                icon="trash"
                loading={busy}
                onClick={del}
              >
                Delete
              </Btn>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {canDelete && (
              <SheetAction
                icon="trash"
                label={mine ? `Delete ${noun}` : "Delete comment from your post"}
                danger
                onClick={() => setConfirming(true)}
              />
            )}
            {!mine && (
              <>
                <SheetAction
                  icon="flag"
                  label={`Report this ${noun}`}
                  onClick={() => {
                    setReporting(target);
                    onClose();
                  }}
                />
                <SheetAction
                  icon="block"
                  label={`Block ${username}`}
                  danger
                  onClick={() => {
                    setBlocking(target);
                    onClose();
                  }}
                />
                <div
                  style={{
                    fontSize: 12.5,
                    color: "var(--ink-3)",
                    padding: "8px 6px 0",
                    lineHeight: 1.5,
                  }}
                >
                  Blocking hides their posts and comments from you, and yours
                  from them. Reporting is private — they are never told.
                </div>
              </>
            )}
          </div>
        )}
      </BottomSheet>

      <ConfirmSheet
        open={!!blocking}
        onClose={() => setBlocking(null)}
        {...CONFIRM_COPY.block(blocking?.item?.author?.username ?? "")}
        onConfirm={() => onBlock?.(blocking)}
        portal
      />

      <ReportSheet
        open={!!reporting}
        onClose={() => setReporting(null)}
        username={reporting?.item?.author?.username ?? ""}
        title={`Report this ${reporting?.kind === "post" ? "post" : "comment"}`}
        portal
        onSubmit={(reason, details) => onReport?.(reporting, reason, details)}
      />
    </>
  );
}
