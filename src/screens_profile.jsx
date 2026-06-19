import { useState } from 'react'
import { ME, BADGES } from './data.jsx'
import { Screen, Header, Avatar, Icon, Btn, Card, Field, BadgeMedallion, BottomSheet } from './ui.jsx'

export function MyProfile({ days, personalRecord, badgeCount, totalBadges, joined, onEdit, onSettings, onOpenBadges, mode, dir }) {
  return (
    <Screen geo="profile" padTop={56}>
      <Header title=""
        right={<button onClick={onSettings} style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Icon name="gear" size={20} color="var(--ink-2)" /></button>} />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 24px 0', position: 'relative', zIndex: 1 }}>
        <Avatar name={ME.username} size={106} hue={ME.color} />
        <div style={{ fontSize: 23, fontWeight: 700, color: 'var(--ink)', marginTop: 14 }}>{ME.username}</div>
        <div style={{ fontSize: 13.5, color: 'var(--ink-3)', marginTop: 3 }}>Member since {joined}</div>
        <div style={{ marginTop: 16 }}>
          <Btn kind="outline" icon="edit" onClick={onEdit}>Edit profile</Btn>
        </div>

        <div style={{ width: '100%', marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Card style={{ textAlign: 'center', padding: '18px 12px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--display-weight)', fontSize: 30, color: 'var(--primary)', lineHeight: 1 }}>{days}</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 6 }}>current streak</div>
          </Card>
          <Card style={{ textAlign: 'center', padding: '18px 12px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--display-weight)', fontSize: 30, color: 'var(--ink)', lineHeight: 1 }}>{personalRecord}</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 6 }}>personal best</div>
          </Card>
        </div>

        <Card pad={0} onClick={onOpenBadges} style={{ width: '100%', marginTop: 12, display: 'flex', alignItems: 'center', gap: 14, padding: '15px 16px' }}>
          <div style={{ display: 'flex' }}>
            {BADGES.filter(b => b.earned).slice(0, 3).map((b, i) => (
              <div key={b.id} style={{ marginLeft: i ? -14 : 0, borderRadius: '50%', background: 'var(--surface)' }}>
                <BadgeMedallion milestone={b.milestone} earned size={40} />
              </div>
            ))}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>{badgeCount} badges earned</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{totalBadges - badgeCount} more to unlock</div>
          </div>
          <Icon name="chevR" size={18} color="var(--ink-3)" />
        </Card>
      </div>
    </Screen>
  );
}

export function EditProfile({ onBack, onSave }) {
  const [username, setUsername] = useState(ME.username);
  const [pic, setPic] = useState(true);
  const [saving, setSaving] = useState(false);
  const taken = ['maya_rivera', 'theo_k'].includes(username.trim().toLowerCase());
  const valid = username.length >= 3 && !taken;
  const dirty = username !== ME.username;
  const save = () => { setSaving(true); setTimeout(() => onSave(username), 900); };
  return (
    <Screen geo="auth" padTop={56}>
      <Header title="Edit profile" onBack={onBack}
        right={<button onClick={valid && dirty ? save : undefined} disabled={!valid || !dirty} style={{ background: 'none', border: 'none', cursor: valid && dirty ? 'pointer' : 'default', color: valid && dirty ? 'var(--primary)' : 'var(--ink-3)', fontSize: 15.5, fontWeight: 700, padding: 6 }}>
          {saving ? 'Saving…' : 'Save'}</button>} />
      <div style={{ padding: '18px 24px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <div style={{ position: 'relative' }}>
            <Avatar name={ME.username} size={104} hue={ME.color} />
            <button onClick={() => setPic(!pic)} style={{ position: 'absolute', right: -2, bottom: -2, width: 34, height: 34, borderRadius: '50%', background: 'var(--primary)', border: '3px solid var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
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

export function ToggleRow({ icon, label, sub, value, onChange }) {
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

export function LinkRow({ icon, label, onClick, danger, last }) {
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

export function Settings({ onBack, onLogout, onDeleted, mode, onToggleMode, dir, onToggleDir }) {
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
            This erases your streak, badges, friends and messages permanently. Your <strong>{47}-day streak</strong> can't be recovered.
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
