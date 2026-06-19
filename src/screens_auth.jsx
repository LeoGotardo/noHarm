import { useState } from 'react'
import { Screen, Header, Avatar, Icon, Btn, Field } from './ui.jsx'

export function Logo({ size = 76, withText = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" fill="none" stroke="var(--primary)" strokeWidth="4" opacity="0.28" />
          <circle cx="50" cy="50" r="44" fill="none" stroke="var(--primary)" strokeWidth="5.5"
            strokeLinecap="round" strokeDasharray="276" strokeDashoffset="96" transform="rotate(-90 50 50)" />
          <path d="M34 51 L45 62 L68 38" fill="none" stroke="var(--primary)" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {withText && (
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--display-weight)', fontSize: 34, color: 'var(--ink)', letterSpacing: -0.5 }}>
          No<span style={{ color: 'var(--primary)' }}>Harm</span>
        </div>
      )}
    </div>
  );
}

export function SplashScreen({ onGetStarted, onLogin }) {
  return (
    <Screen geo="splash" padTop={0} padBottom={0} noScroll>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 32px', textAlign: 'center' }}>
        <div className="nh-rise"><Logo size={92} withText /></div>
        <div className="nh-rise" style={{ animationDelay: '.08s', marginTop: 22, fontSize: 19, lineHeight: 1.45, color: 'var(--ink-2)', fontWeight: 500, maxWidth: 290 }}>
          One clean day at a time.<br />Track your streak, lean on friends, celebrate every milestone.
        </div>
      </div>
      <div className="nh-rise" style={{ animationDelay: '.16s', padding: '0 24px 30px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Btn kind="primary" size="lg" full onClick={onGetStarted}>Get started</Btn>
        <Btn kind="ghost" full onClick={onLogin}>I already have an account</Btn>
      </div>
    </Screen>
  );
}

export function RegisterScreen({ onBack, onDone }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [pic, setPic] = useState('');
  const [loading, setLoading] = useState(false);
  const taken = ['maya_rivera', 'theo_k', 'admin', 'alex'].includes(username.trim().toLowerCase());
  const tooShort = username.length > 0 && username.length < 3;
  const validEmail = /.+@.+\..+/.test(email);
  const canSubmit = username.length >= 3 && !taken && validEmail && !loading;
  const submit = () => { setLoading(true); setTimeout(() => onDone(), 1100); };
  return (
    <Screen geo="auth" padTop={56} padBottom={28}>
      <Header title="Create account" onBack={onBack} />
      <div style={{ padding: '14px 24px 0', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 26 }}>
          <button onClick={() => setPic(pic ? '' : 'x')} style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}>
            <Avatar name={username || 'A'} size={88} hue={154} />
            <span style={{ position: 'absolute', right: -2, bottom: -2, width: 30, height: 30, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid var(--bg)' }}>
              <Icon name="camera" size={15} color="var(--on-primary)" sw={2} />
            </span>
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Field label="Username" value={username} onChange={setUsername} placeholder="3–50 characters"
            error={taken ? 'That username is already taken.' : tooShort ? 'At least 3 characters.' : null}
            hint={!taken && !tooShort ? 'This is how friends will find you.' : null}
            right={username.length >= 3 && !taken ? <Icon name="check" size={18} color="var(--primary)" sw={2.4} /> : null} />
          <Field label="Email" value={email} onChange={setEmail} placeholder="you@email.com" type="email"
            hint="Used for sign-in. We never share it." />
        </div>
        <div style={{ flex: 1 }} />
        <Btn kind="primary" size="lg" full disabled={!canSubmit} loading={loading} onClick={submit} style={{ marginTop: 26 }}>
          {loading ? 'Creating your space…' : 'Create account'}
        </Btn>
        <div style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--ink-3)', marginTop: 14, lineHeight: 1.5 }}>
          By continuing you agree this is a safe, judgment-free space.
        </div>
      </div>
    </Screen>
  );
}

export function LoginScreen({ onBack, onDone }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const ERRORS = {
    'banned@noharm.app': 'This account has been suspended. Contact support@noharm.app.',
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
