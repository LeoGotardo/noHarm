import { useState } from 'react'
import { Card, Icon, Btn, Field, Divider, SectionLabel } from '@ui'
import { Screen, Header, BottomSheet } from '@components'
import { ToggleRow } from './ToggleRow.jsx'
import { LinkRow } from './LinkRow.jsx'

export function Settings({
  onBack, onLogout, onDeleted, mode, onToggleMode,
  notifGranted, onEnableNotifications,
  notifPrefs, onNotifPrefChange,
}) {
  const [confirmDelete,  setConfirmDelete]  = useState(false)
  const [confirmText,    setConfirmText]    = useState('')
  const [deleting,       setDeleting]       = useState(false)
  const [permDenied,     setPermDenied]     = useState(false)

  const masterOn = notifPrefs.master && notifGranted

  async function handleMasterToggle() {
    if (notifPrefs.master) {
      onNotifPrefChange('master', false)
      return
    }
    const granted = await onEnableNotifications()
    if (granted) {
      setPermDenied(false)
      onNotifPrefChange('master', true)
    } else {
      // Permission denied by OS — can't request again programmatically
      setPermDenied(true)
    }
  }

  return (
    <Screen geo="history" padTop={56}>
      <Header title="Settings" onBack={onBack} />
      <div style={{ padding: '14px 20px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>

        <div>
          <SectionLabel>Appearance</SectionLabel>
          <Card pad={8}>
            <ToggleRow icon="badges" label="Dark mode" sub="Easier on the eyes at night"
              value={mode === 'dark'} onChange={() => onToggleMode()} />
          </Card>
        </div>

        <div>
          <SectionLabel>Notifications</SectionLabel>
          <Card pad={8}>
            {/* Master toggle */}
            <ToggleRow icon="bell" label="Enable notifications"
              sub={masterOn ? 'Active' : 'Turn on to receive alerts'}
              value={masterOn}
              onChange={handleMasterToggle} />

            {permDenied && (
              <div style={{ margin: '2px 4px 8px', padding: '10px 12px', borderRadius: 10, background: 'var(--accent-soft)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <Icon name="lock" size={15} color="var(--accent-ink)" style={{ marginTop: 1, flexShrink: 0 }} />
                <div style={{ fontSize: 12.5, color: 'var(--accent-ink)', lineHeight: 1.5 }}>
                  Permission denied. Enable notifications in your device or browser settings to continue.
                </div>
              </div>
            )}

            <Divider />

            {/* Individual toggles — disabled when master is off */}
            <ToggleRow icon="chat" label="Messages"
              sub="New messages from friends"
              value={notifPrefs.messages}
              disabled={!masterOn}
              onChange={v => onNotifPrefChange('messages', v)} />

            <Divider />

            <ToggleRow icon="friends" label="Friend requests"
              sub="New requests and acceptances"
              value={notifPrefs.friendRequests}
              disabled={!masterOn}
              onChange={v => onNotifPrefChange('friendRequests', v)} />

            <Divider />

            <ToggleRow icon="check" label="Daily check-in reminder"
              sub="A gentle nudge if you haven't checked in"
              value={notifPrefs.checkinReminder}
              disabled={!masterOn}
              onChange={v => onNotifPrefChange('checkinReminder', v)} />
          </Card>
        </div>

        <div>
          <SectionLabel>Account</SectionLabel>
          <Card pad={8}>
            <LinkRow icon="lock" label="Privacy & safety" onClick={() => {}} />
            <LinkRow icon="heart" label="Crisis resources" onClick={() => {}} />
            <LinkRow icon="logout" label="Log out" onClick={onLogout} last />
          </Card>
        </div>

        <div>
          <SectionLabel>Danger zone</SectionLabel>
          <Card pad={8}>
            <LinkRow icon="trash" label="Delete account" danger onClick={() => setConfirmDelete(true)} last />
          </Card>
        </div>

        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink-3)', padding: '8px 0 4px' }}>NoHarm v1.0 · made with care</div>
      </div>

      <BottomSheet open={confirmDelete} onClose={() => { setConfirmDelete(false); setConfirmText('') }}>
        <div style={{ textAlign: 'center', marginBottom: 6 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Icon name="trash" size={26} color="var(--accent-ink)" />
          </div>
          <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--ink)' }}>Delete your account?</div>
          <div style={{ fontSize: 14, color: 'var(--ink-2)', marginTop: 8, lineHeight: 1.5 }}>
            This erases your streak, badges, friends and messages permanently.
          </div>
        </div>
        <div style={{ margin: '18px 0 8px' }}>
          <Field label="Type DELETE to confirm" value={confirmText} onChange={setConfirmText} placeholder="DELETE" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
          <Btn kind="danger" full disabled={confirmText !== 'DELETE'} loading={deleting}
            onClick={() => { setDeleting(true); setTimeout(onDeleted, 1100) }}>Delete forever</Btn>
          <Btn kind="ghost" full onClick={() => { setConfirmDelete(false); setConfirmText('') }}>Keep my account</Btn>
        </div>
      </BottomSheet>
    </Screen>
  )
}
