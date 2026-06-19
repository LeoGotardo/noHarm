import { useState } from 'react'
import { Screen, Header, Icon, Btn, Field } from '../../ui/index.js'
import { Logo } from './SplashScreen.jsx'

export function LoginScreen({ onBack, onDone }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const ERRORS = {
    'banned@noharm.app':  'This account has been suspended. Contact support@noharm.app.',
    'deleted@noharm.app': "This account no longer exists. You're welcome to start fresh.",
    'blocked@noharm.app': "We couldn't sign you in. Please try again.",
  };
  const submit = () => {
    setLoading(true); setError(null);
    setTimeout(() => {
      const e = ERRORS[email.trim().toLowerCase()];
      if (e) { setError(e); setLoading(false); }
      else onDone();
    }, 1000);
  };
  return (
    <Screen geo="auth" padTop={56} padBottom={28}>
      <Header title="Welcome back" onBack={onBack} />
      <div style={{ padding: '20px 24px 0', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}><Logo size={64} /></div>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', textAlign: 'center', marginBottom: 4, fontFamily: 'var(--font-display)' }}>
          Good to see you again
        </div>
        <div style={{ fontSize: 14.5, color: 'var(--ink-3)', textAlign: 'center', marginBottom: 26 }}>
          Your streak is still going strong.
        </div>
        {error && (
          <div style={{ display: 'flex', gap: 10, padding: '12px 14px', borderRadius: 14, background: 'var(--accent-soft)', marginBottom: 16, alignItems: 'flex-start' }}>
            <Icon name="bell" size={18} color="var(--accent-ink)" style={{ marginTop: 1 }} />
            <div style={{ fontSize: 13.5, color: 'var(--accent-ink)', lineHeight: 1.45, fontWeight: 500 }}>{error}</div>
          </div>
        )}
        <Field label="Email" value={email} onChange={v => { setEmail(v); setError(null); }} placeholder="you@email.com" type="email" />
        <div style={{ flex: 1 }} />
        <Btn kind="primary" size="lg" full loading={loading} disabled={!/.+@.+\..+/.test(email)} onClick={submit} style={{ marginTop: 24 }}>
          Continue
        </Btn>
        <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--ink-3)', marginTop: 16, lineHeight: 1.6 }}>
          Try <code style={{ fontFamily: 'monospace' }}>banned@noharm.app</code> to preview an error state.
        </div>
      </div>
    </Screen>
  );
}
