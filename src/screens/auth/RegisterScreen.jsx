import { useState } from 'react'
import { Screen, Header, Avatar, Icon, Field, Banner } from '../../ui/index.js'
import { signUp } from '../../services/api/auth.js'

function GoogleButton({ onClick, loading, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
        width: '100%', padding: '14px 20px', borderRadius: 14,
        background: disabled ? 'var(--surface)' : 'var(--primary)',
        border: disabled ? '1.5px solid var(--border)' : 'none',
        fontSize: 15.5, fontWeight: 600,
        color: disabled ? 'var(--ink-3)' : 'var(--on-primary)',
        cursor: (loading || disabled) ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.7 : 1,
        transition: 'background .2s, color .2s, opacity .15s',
        fontFamily: 'var(--font-ui)',
      }}
    >
      {loading ? (
        <span style={{ width: 20, height: 20, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
      ) : (
        <svg width="20" height="20" viewBox="0 0 48 48" style={{ opacity: disabled ? 0.4 : 1 }}>
          <path fill={disabled ? 'var(--ink-3)' : '#fff'} d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.6 20-21 0-1.4-.1-2.7-.5-4z" />
        </svg>
      )}
      {loading ? 'Creating your space…' : 'Sign up with Google'}
    </button>
  )
}

export function RegisterScreen({ onBack, onDone }) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const tooShort = username.length > 0 && username.length < 3;
  const canSubmit = username.length >= 3 && !tooShort && !loading;

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signUp(username.trim());
      if (result?.success === false) {
        if (result.errorCode === 'auth/popup-closed-by-user' || result.errorCode === 'auth/cancelled-popup-request') return;
        setError('Google sign-in failed. Please try again.');
        return;
      }
      onDone();
    } catch (e) {
      const msg = e?.body?.detail ?? e?.message ?? null;
      if (e?.status === 409) setError('That username is already taken. Please choose another.');
      else if (e?.status === 422) setError('Invalid username. Use only letters, numbers, _ or -.');
      else setError(msg ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen geo="auth" padTop={56} padBottom={28}>
      <Header title="Create account" onBack={onBack} />
      <div style={{ padding: '14px 24px 0', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 26 }}>
          <div style={{ position: 'relative' }}>
            <Avatar name={username || 'A'} size={88} hue={154} />
            <span style={{ position: 'absolute', right: -2, bottom: -2, width: 28, height: 28, borderRadius: '50%', background: 'var(--surface)', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 48 48">
                <path fill="var(--ink-3)" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.6 20-21 0-1.4-.1-2.7-.5-4z" />
              </svg>
            </span>
          </div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-3)', textAlign: 'center', marginBottom: 24, lineHeight: 1.5 }}>
          Your profile photo will come from Google.
        </div>
        {error && (
          <div style={{ display: 'flex', gap: 10, padding: '12px 14px', borderRadius: 14, background: 'var(--accent-soft)', marginBottom: 16, alignItems: 'flex-start' }}>
            <Icon name="bell" size={18} color="var(--accent-ink)" style={{ marginTop: 1 }} />
            <div style={{ fontSize: 13.5, color: 'var(--accent-ink)', lineHeight: 1.45, fontWeight: 500 }}>{error}</div>
          </div>
        )}
        <Field
          label="Username"
          value={username}
          onChange={setUsername}
          placeholder="3–50 characters"
          error={tooShort ? 'At least 3 characters.' : null}
          hint={!tooShort && username.length > 0 ? 'This is how friends will find you.' : null}
          right={username.length >= 3 ? <Icon name="check" size={18} color="var(--primary)" sw={2.4} /> : null}
        />
        <div style={{ flex: 1 }} />
        <GoogleButton onClick={submit} loading={loading} disabled={!canSubmit} />
        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink-3)', marginTop: 14, lineHeight: 1.5 }}>
          By continuing you agree this is a safe, judgment-free space.
        </div>
      </div>
    </Screen>
  );
}
