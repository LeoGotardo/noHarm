import { useState } from 'react'
import { Avatar, Icon, Field } from '@ui'
import { Screen, Header, Banner, GoogleButton, GoogleLogoMono } from '@components'
import { signUp } from '../../services/api/auth.js'

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
              <GoogleLogoMono size={14} color="var(--ink-3)" />
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
        <GoogleButton onClick={submit} loading={loading} disabled={!canSubmit} variant="signup" />
        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink-3)', marginTop: 14, lineHeight: 1.5 }}>
          By continuing you agree this is a safe, judgment-free space.
        </div>
      </div>
    </Screen>
  );
}
