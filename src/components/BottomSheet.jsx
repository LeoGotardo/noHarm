import { createPortal } from "react-dom";
import { useBackHandler } from "@ui/backButton.js";
import { useWide } from "@ui/useBreakpoint.js";

/**
 * A sheet on a phone, a dialog on a desktop.
 *
 * The same component answers both because the content never changes — only
 * where it comes from. A sheet slides up from the thumb; stretched across a
 * 1400px monitor it reads as a page that broke, and the eye has to travel the
 * whole width to find the buttons.
 *
 * `portal` lifts the sheet out of the screen into `#nh-screen`, beside the tab
 * bar, for a sheet opened from a **tab root**. `#nh-stage` animates with a
 * transform, which makes it a stacking context: nothing inside it can rise
 * above the tab bar, whatever its z-index, and a sheet opened from the feed
 * slid up behind the bar with its buttons under it. Pushed screens hide the
 * bar and do not need it; app-level sheets already live in `#nh-screen`.
 */
export function BottomSheet({ open, onClose, children, portal }) {
  const wide = useWide();
  // Android's back closes the sheet before it leaves the screen. Without
  // `onClose` (a sheet that has to be answered) it is swallowed instead.
  useBackHandler(open, onClose);
  if (!open) return null;
  const host = portal ? document.getElementById("nh-screen") : null;
  const sheet = (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 90,
        display: "flex",
        flexDirection: "column",
        justifyContent: wide ? "center" : "flex-end",
        alignItems: wide ? "center" : "stretch",
        padding: wide ? 24 : 0,
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.42)",
          animation: "nhFade .3s both",
        }}
      />
      <div
        role={wide ? "dialog" : undefined}
        aria-modal={wide ? "true" : undefined}
        style={{
          position: "relative",
          background: "var(--surface)",
          // A dialog is a card: rounded on all four corners, and capped so a
          // short confirmation does not become a banner.
          borderRadius: wide ? 26 : "28px 28px 0 0",
          width: wide ? "100%" : undefined,
          maxWidth: wide ? 460 : undefined,
          maxHeight: wide ? "min(80vh, 720px)" : undefined,
          overflowY: wide ? "auto" : undefined,
          padding: wide ? "26px 26px 26px" : "12px 22px 36px",
          border: wide ? "1px solid var(--border)" : undefined,
          boxShadow: wide
            ? "0 24px 70px -12px rgba(0,0,0,0.42)"
            : "0 -10px 40px -8px rgba(0,0,0,0.3)",
          animation: wide
            ? "nhDialogIn .28s cubic-bezier(.2,.8,.3,1) both"
            : "nhSheetIn .42s cubic-bezier(.2,.85,.3,1) both",
        }}
      >
        {/* The drag handle is a touch affordance and says nothing to a mouse. */}
        {!wide && (
          <div
            style={{
              width: 40,
              height: 5,
              borderRadius: 99,
              background: "var(--border)",
              margin: "0 auto 18px",
            }}
          />
        )}
        {children}
      </div>
    </div>
  );
  return host ? createPortal(sheet, host) : sheet;
}
