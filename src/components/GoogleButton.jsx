// Google brand SVGs kept inline — multicolor logo requires per-path fills
// that no single icon library supports; monochrome reuses the same path.
const G_PATH =
  "M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.6 20-21 0-1.4-.1-2.7-.5-4z";

export const GoogleLogoFull = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <path fill="#4285F4" d={G_PATH} />
    <path
      fill="#34A853"
      d="M6.3 14.7l7 5.1C15.1 16.1 19.2 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3c-7.7 0-14.3 4.4-17.7 11.7z"
    />
    <path
      fill="#FBBC05"
      d="M24 45c5.9 0 10.9-2 14.5-5.4l-6.7-5.5C29.8 35.9 27 37 24 37c-6 0-10.6-3.1-11.8-8.5l-7 5.4C8 40.2 15.4 45 24 45z"
    />
    <path
      fill="#EA4335"
      d="M44.5 20H24v8.5h11.8c-.7 2.5-2.3 4.6-4.5 6l6.7 5.5C41.8 36.8 44.5 31 44.5 24c0-1.4-.1-2.7-.5-4z"
    />
  </svg>
);

export const GoogleLogoMono = ({ color = "currentColor", size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <path fill={color} d={G_PATH} />
  </svg>
);

/**
 * @param {'signin'|'signup'} variant
 *   signin — white/outlined, multicolor Google logo (standard OAuth button)
 *   signup — primary CTA, monochrome logo, supports disabled state
 */
export function GoogleButton({
  onClick,
  loading = false,
  disabled = false,
  label,
  loadingLabel,
  variant = "signin",
}) {
  const isSignup = variant === "signup";
  const isDisabled = loading || disabled;

  const bg = isSignup
    ? disabled
      ? "var(--surface)"
      : "var(--primary)"
    : "var(--surface)";
  const border = isSignup && !disabled ? "none" : "1.5px solid var(--border)";
  const color = isSignup
    ? disabled
      ? "var(--ink-3)"
      : "var(--on-primary)"
    : "var(--ink)";
  const spinnerBorder = isSignup ? "rgba(255,255,255,0.3)" : "var(--border)";
  const spinnerTop = isSignup ? "#fff" : "var(--primary)";

  const defaultLabel = isSignup
    ? "Sign up with Google"
    : "Continue with Google";
  const defaultLoadingLabel = isSignup ? "Creating your space…" : "Signing in…";

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        width: "100%",
        padding: "14px 20px",
        borderRadius: 14,
        background: bg,
        border,
        fontSize: 15.5,
        fontWeight: 600,
        color,
        cursor: isDisabled ? "not-allowed" : "pointer",
        opacity: loading ? (isSignup ? 0.7 : 0.6) : 1,
        transition: "background .2s, color .2s, opacity .15s",
        fontFamily: "var(--font-ui)",
      }}
    >
      {loading ? (
        <span
          style={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            border: `2.5px solid ${spinnerBorder}`,
            borderTopColor: spinnerTop,
            display: "inline-block",
            animation: "spin 0.7s linear infinite",
          }}
        />
      ) : isSignup ? (
        <GoogleLogoMono color={disabled ? "var(--ink-3)" : "#fff"} />
      ) : (
        <GoogleLogoFull />
      )}
      {loading
        ? (loadingLabel ?? defaultLoadingLabel)
        : (label ?? defaultLabel)}
    </button>
  );
}
