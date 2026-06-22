import { useState } from 'react'
import { Screen, Header, Card, Icon, Btn, Field, BottomSheet } from '../../ui/index.js'

function ToggleRow({ icon, label, sub, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 4px' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={19} color="var(--ink-2)" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{label}</div>
        {sub && <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 1 }}>{sub}</div>}
      </div>
      <button onClick={() => onChange(!value)} style={{ width: 50, height: 30, borderRadius: 99, border: 'none', cursor: 'pointer', background: value ? 'var(--primary)' : 'var(--border)', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
        <span style={{ position: 'absolute', top: 3, left: value ? 23 : 3, width: 24, height: 24, borderRadius: '50%', background: '#fff', transition: 'left .2s cubic-bezier(.3,.8,.3,1)', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }} />
      </button>
    </div>
  );
}

function LinkRow({ icon, label, onClick, danger, last }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 4px', background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', borderBottom: last ? 'none' : '1px solid var(--border)' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: danger ? 'var(--accent-soft)' : 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={19} color={danger ? 'var(--accent-ink)' : 'var(--ink-2)'} />
      </div>
      <div style={{ flex: 1, fontSize: 15, fontWeight: 600, color: danger ? 'var(--accent-ink)' : 'var(--ink)' }}>{label}</div>
      {!danger && <Icon name="chevR" size={17} color="var(--ink-3)" />}
    </button>
  );
}

export function Settings({ onBack, onLogout, onDeleted, mode, onToggleMode }) {
  const [notif, setNotif] = useState(true);
  const [reminders, setReminders] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  return (
    <Screen geo="history" padTop={56}>
      <Header title="Settings" onBack={onBack} />
      <div style={{ padding: '14px 20px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: 0.6, padding: '0 4px 6px' }}>Appearance</div>
          <Card pad={8}>
            <ToggleRow icon="badges" label="Dark mode" sub="Easier on the eyes at night" value={mode === 'dark'} onChange={() => onToggleMode()} />
          </Card>
        </div>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: 0.6, padding: '0 4px 6px' }}>Notifications</div>
          <Card pad={8}>
            <ToggleRow icon="bell" label="Push notifications" sub="Friend requests & messages" value={notif} onChange={setNotif} />
            <div style={{ height: 1, background: 'var(--border)', margin: '0 4px' }} />
            <ToggleRow icon="check" label="Daily check-in reminder" sub="A gentle nudge at 9:00 AM" value={reminders} onChange={setReminders} />
          </Card>
        </div>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: 0.6, padding: '0 4px 6px' }}>Account</div>
          <Card pad={8}>
            <LinkRow icon="lock" label="Privacy & safety" onClick={() => {}} />
            <LinkRow icon="heart" label="Crisis resources" onClick={() => {}} />
            <LinkRow icon="logout" label="Log out" onClick={onLogout} last />
          </Card>
        </div>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: 0.6, padding: '0 4px 6px' }}>Danger zone</div>
          <Card pad={8}>
            <LinkRow icon="trash" label="Delete account" danger onClick={() => setConfirmDelete(true)} last />
          </Card>
        </div>
        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink-3)', padding: '8px 0 4px' }}>NoHarm v1.0 · made with care</div>
      </div>

      <BottomSheet open={confirmDelete} onClose={() => { setConfirmDelete(false); setConfirmText(''); }}>
        <div style={{ textAlign: 'center', marginBottom: 6 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Icon name="trash" size={26} color="var(--accent-ink)" />
          </div>
          <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--ink)' }}>Delete your account?</div>
          <div style={{ fontSize: 14, color: 'var(--ink-2)', marginTop: 8, lineHeight: 1.5 }}>
            This erases your streak, badges, friends and messages permanently. Your <strong>47-day streak</strong> can't be recovered.
          </div>
        </div>
        <div style={{ margin: '18px 0 8px' }}>
          <Field label="Type DELETE to confirm" value={confirmText} onChange={setConfirmText} placeholder="DELETE" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
          <Btn kind="danger" full disabled={confirmText !== 'DELETE'} loading={deleting}
            onClick={() => { setDeleting(true); setTimeout(onDeleted, 1100); }}>Delete forever</Btn>
          <Btn kind="ghost" full onClick={() => { setConfirmDelete(false); setConfirmText(''); }}>Keep my account</Btn>
        </div>
      </BottomSheet>
    </Screen>
  );
}
