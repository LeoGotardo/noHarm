import { useState } from 'react'
import { Screen, Header, Avatar, Icon, Field } from '../../ui/index.js'
import { ME } from '../../data/mock.js'

export function EditProfile({ onBack, onSave }) {
  const [username, setUsername] = useState(ME.username);
  const [saving, setSaving] = useState(false);
  const taken = ['maya_rivera', 'theo_k'].includes(username.trim().toLowerCase());
  const valid = username.length >= 3 && !taken;
  const dirty = username !== ME.username;
  const save = () => { setSaving(true); setTimeout(() => onSave(username), 900); };
  return (
    <Screen geo="auth" padTop={56}>
      <Header title="Edit profile" onBack={onBack}
        right={<button onClick={valid && dirty ? save : undefined} disabled={!valid || !dirty}
          style={{ background: 'none', border: 'none', cursor: valid && dirty ? 'pointer' : 'default', color: valid && dirty ? 'var(--primary)' : 'var(--ink-3)', fontSize: 15.5, fontWeight: 700, padding: 6 }}>
          {saving ? 'Saving…' : 'Save'}</button>} />
      <div style={{ padding: '18px 24px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <div style={{ position: 'relative' }}>
            <Avatar name={ME.username} size={104} hue={ME.color} />
            <button style={{ position: 'absolute', right: -2, bottom: -2, width: 34, height: 34, borderRadius: '50%', background: 'var(--primary)', border: '3px solid var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Icon name="camera" size={16} color="var(--on-primary)" sw={2} />
            </button>
          </div>
        </div>
        <Field label="Username" value={username} onChange={setUsername}
          error={taken ? 'That username is taken.' : username.length < 3 ? 'At least 3 characters.' : null}
          hint={valid ? 'Friends find you by this name.' : null} />
        <div style={{ marginTop: 18 }}>
          <Field label="Email" value={ME.email} onChange={() => {}} hint="Email can't be changed here." />
        </div>
      </div>
    </Screen>
  );
}
