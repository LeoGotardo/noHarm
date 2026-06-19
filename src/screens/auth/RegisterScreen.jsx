import { useState } from 'react'
import { Screen, Header, Avatar, Icon, Btn, Field } from '../../ui/index.js'

export function RegisterScreen({ onBack, onDone }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
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
          <button onClick={() => {}} style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}>
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
