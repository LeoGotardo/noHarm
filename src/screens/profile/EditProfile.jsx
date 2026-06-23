import { useState } from 'react'
import { Screen, Header, Avatar, Icon, Field } from '../../ui/index.js'
import { putMe } from '../../services/api/user.js'

function hashHue(str = '') {
  let h = 0
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff
  return Math.abs(h) % 360
}

export function EditProfile({ me, onBack, onSave }) {
  const [username, setUsername] = useState(me?.username ?? '')
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState(null)

  const tooShort = username.length > 0 && username.length < 3
  const valid    = username.length >= 3 && !tooShort
  const dirty    = username !== (me?.username ?? '')

  const hue = hashHue(username || me?.username)
  const src = me?.profile_picture ?? null

  const save = async () => {
    if (!valid || !dirty) return
    setSaving(true)
    setError(null)
    try {
      await putMe(username.trim(), me?.profile_picture ?? null)
      onSave()
    } catch (e) {
      const msg = e?.body?.detail ?? e?.message ?? null
      if (e?.status === 409) setError('That username is already taken.')
      else if (e?.status === 422) setError('Invalid username. Use only letters, numbers, _ or -.')
      else setError(msg ?? 'Could not save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Screen geo="auth" padTop={56}>
      <Header title="Edit profile" onBack={onBack}
        right={
          <button
            onClick={save}
            disabled={!valid || !dirty || saving}
            style={{
              background: 'none', border: 'none', padding: 6,
              cursor: valid && dirty && !saving ? 'pointer' : 'default',
              color: valid && dirty && !saving ? 'var(--primary)' : 'var(--ink-3)',
              fontSize: 15.5, fontWeight: 700,
            }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        }
      />
      <div style={{ padding: '18px 24px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <div style={{ position: 'relative' }}>
            <Avatar name={username || '?'} size={104} hue={hue} src={src} />
            <button style={{ position: 'absolute', right: -2, bottom: -2, width: 34, height: 34, borderRadius: '50%', background: 'var(--primary)', border: '3px solid var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Icon name="camera" size={16} color="var(--on-primary)" sw={2} />
            </button>
          </div>
        </div>

        {error && (
          <div style={{ display: 'flex', gap: 10, padding: '11px 14px', borderRadius: 13, background: 'var(--accent-soft)', marginBottom: 16, alignItems: 'flex-start' }}>
            <Icon name="bell" size={17} color="var(--accent-ink)" style={{ marginTop: 1 }} />
            <div style={{ fontSize: 13.5, color: 'var(--accent-ink)', lineHeight: 1.45, fontWeight: 500 }}>{error}</div>
          </div>
        )}

        <Field
          label="Username"
          value={username}
          onChange={setUsername}
          error={tooShort ? 'At least 3 characters.' : null}
          hint={valid ? 'Friends find you by this name.' : null}
        />
        <div style={{ marginTop: 18 }}>
          <Field
            label="Email"
            value={me?.email ?? ''}
            onChange={() => {}}
            hint="Email can't be changed here."
          />
        </div>
      </div>
    </Screen>
  )
}
