import { useState } from 'react'
import { Screen, Header, Icon } from '../../ui/index.js'
import { Logo } from './SplashScreen.jsx'

function GoogleButton({ onClick, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
        width: '100%', padding: '14px 20px', borderRadius: 14,
        background: 'var(--surface)', border: '1.5px solid var(--border)',
        fontSize: 15.5, fontWeight: 600, color: 'var(--ink)',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.6 : 1,
        transition: 'opacity .15s',
        fontFamily: 'var(--font-ui)',
      }}
    >
      {loading ? (
        <span style={{ width: 20, height: 20, borderRadius: '50%', border: '2.5px solid var(--border)', borderTopColor: 'var(--primary)', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
      ) : (
        <svg width="20" height="20" viewBox="0 0 48 48">
          <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.6 20-21 0-1.4-.1-2.7-.5-4z" />
          <path fill="#34A853" d="M6.3 14.7l7 5.1C15.1 16.1 19.2 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3c-7.7 0-14.3 4.4-17.7 11.7z" />
          <path fill="#FBBC05" d="M24 45c5.9 0 10.9-2 14.5-5.4l-6.7-5.5C29.8 35.9 27 37 24 37c-6 0-10.6-3.1-11.8-8.5l-7 5.4C8 40.2 15.4 45 24 45z" />
          <path fill="#EA4335" d="M44.5 20H24v8.5h11.8c-.7 2.5-2.3 4.6-4.5 6l6.7 5.5C41.8 36.8 44.5 31 44.5 24c0-1.4-.1-2.7-.5-4z" />
        </svg>
      )}
      {loading ? 'Signing in…' : 'Continue with Google'}
    </button>
  )
}

export function LoginScreen({ onBack, onDone }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const MOCK_ERRORS = [
    null, null, null,
    'This account has been suspended. Please contact support@noharm.app.',
  ];

  const submit = () => {
    setLoading(true); setError(null);
    setTimeout(() => {
      const e = MOCK_ERRORS[Math.floor(Math.random() * MOCK_ERRORS.length)];
      if (e) { setError(e); setLoading(false); }
      else onDone();
    }, 1100);
  };

  return (
    <Screen geo="auth" padTop={56} padBottom={28}>
      <Header title="Welcome back" onBack={onBack} />
      <div style={{ padding: '20px 24px 0', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <Logo size={64} />
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', textAlign: 'center', marginBottom: 4, fontFamily: 'var(--font-display)' }}>
          Good to see you again
        </div>
        <div style={{ fontSize: 14.5, color: 'var(--ink-3)', textAlign: 'center', marginBottom: 32 }}>
          Your streak is still going strong.
        </div>
        {error && (
          <div style={{ display: 'flex', gap: 10, padding: '12px 14px', borderRadius: 14, background: 'var(--accent-soft)', marginBottom: 20, alignItems: 'flex-start' }}>
            <Icon name="bell" size={18} color="var(--accent-ink)" style={{ marginTop: 1 }} />
            <div style={{ fontSize: 13.5, color: 'var(--accent-ink)', lineHeight: 1.45, fontWeight: 500 }}>{error}</div>
          </div>
        )}
        <div style={{ flex: 1 }} />
        <GoogleButton onClick={submit} loading={loading} />
        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink-3)', marginTop: 16, lineHeight: 1.6 }}>
          We only use Google to verify your identity.<br />We never post anything on your behalf.
        </div>
      </div>
    </Screen>
  );
}
