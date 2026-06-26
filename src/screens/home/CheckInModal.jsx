import { useState, useMemo } from 'react'
import { Btn, Icon } from '@ui'
import { BottomSheet, fmtShortDay } from '@components'
import { daysBetween } from '../../store/useStreak.js'
import { DayRow } from './DayRow.jsx'
import { SummaryLine } from './SummaryLine.jsx'

function addDays(isoDate, n) {
  const d = new Date(isoDate + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export function CheckInModal({ open, missedDays, lastCheckinDate, onConfirm, loading }) {
  const [step, setStep]       = useState(1) // 1=question, 2=relapse picker, 3=confirm
  const [days, setDays]       = useState({}) // { 'YYYY-MM-DD': { checked, time } }
  const [submitting, setSubmitting] = useState(false)

  // Build the list of days that need action (day after lastCheckin → today)
  const today = new Date().toISOString().slice(0, 10)
  const dayList = useMemo(() => {
    if (!lastCheckinDate) return [today]
    const list = []
    for (let i = 1; i <= missedDays; i++) list.push(addDays(lastCheckinDate, i))
    return list
  }, [lastCheckinDate, missedDays, today])

  const relapses = dayList.filter(d => days[d]?.checked)
    .map(d => ({ date: d, time: days[d].time || '12:00' }))

  const toggle = (date) => setDays(prev => ({
    ...prev,
    [date]: { checked: !prev[date]?.checked, time: prev[date]?.time || '12:00' },
  }))

  const setTime = (date, time) => setDays(prev => ({
    ...prev,
    [date]: { ...prev[date], time },
  }))

  const handleConfirm = async () => {
    setSubmitting(true)
    try {
      await onConfirm(relapses)
    } finally {
      setSubmitting(false)
      setStep(1)
      setDays({})
    }
  }

  const allClean = async () => {
    setSubmitting(true)
    try {
      await onConfirm([])
    } finally {
      setSubmitting(false)
    }
  }

  const daysLabel = missedDays === 1 ? '1 day' : `${missedDays} days`

  return (
    <BottomSheet open={open} onClose={null}>
      <div style={{ padding: '0 4px 8px' }}>

        {/* ── Step 1: Entry question ── */}
        {step === 1 && (
          <>
            <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: 'var(--primary-soft)', margin: '0 auto 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="flame" size={30} color="var(--primary)" sw={1.4} />
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
                Welcome back
              </div>
              <div style={{ fontSize: 14.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                You've been away for <strong>{daysLabel}</strong>.<br />
                How did it go?
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Btn kind="primary" full size="lg" icon="check" onClick={allClean} disabled={submitting}>
                {submitting ? 'Saving…' : 'All clean!'}
              </Btn>
              <Btn kind="outline" full size="lg" onClick={() => setStep(2)} disabled={submitting}>
                I had a setback
              </Btn>
            </div>
          </>
        )}

        {/* ── Step 2: Day picker ── */}
        {step === 2 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <button
                onClick={() => setStep(1)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--ink-2)' }}
              >
                <Icon name="back" size={22} color="var(--ink-2)" />
              </button>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>Select the days you relapsed</div>
                <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>Tap a day to mark it as a setback</div>
              </div>
            </div>

            <div style={{ maxHeight: 320, overflowY: 'auto', marginBottom: 16 }}>
              {dayList.map(date => (
                <DayRow
                  key={date}
                  date={date}
                  checked={!!days[date]?.checked}
                  time={days[date]?.time || '12:00'}
                  onToggle={() => toggle(date)}
                  onTimeChange={t => setTime(date, t)}
                />
              ))}
            </div>

            <Btn
              kind="primary" full size="lg"
              onClick={() => setStep(3)}
            >
              Continue →
            </Btn>
          </>
        )}

        {/* ── Step 3: Confirmation ── */}
        {step === 3 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <button
                onClick={() => setStep(2)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--ink-2)' }}
              >
                <Icon name="back" size={22} color="var(--ink-2)" />
              </button>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>Confirm your check-in</div>
            </div>

            <div style={{ marginBottom: 20 }}>
              {relapses.length === 0 ? (
                <SummaryLine icon="check" color="var(--primary)" text={`${daysLabel} clean — amazing work`} />
              ) : (() => {
                const segments = buildSegments(relapses, lastCheckinDate, today, dayList)
                return segments.map((seg, i) => (
                  <SummaryLine
                    key={i}
                    icon={seg.type === 'relapse' ? 'heart' : 'flame'}
                    color={seg.type === 'relapse' ? 'var(--accent)' : 'var(--primary)'}
                    text={seg.label}
                  />
                ))
              })()}
            </div>

            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 16, lineHeight: 1.5, padding: '0 2px' }}>
              Relapses are part of recovery. Each setback is followed by a new beginning.
            </div>

            <Btn kind="primary" full size="lg" onClick={handleConfirm} disabled={submitting || loading}>
              {submitting || loading ? 'Updating streak…' : 'Save & update streak'}
            </Btn>
          </>
        )}

      </div>
    </BottomSheet>
  )
}

function buildSegments(relapses, lastCheckin, today, dayList) {
  const segments = []
  const start = lastCheckin ?? dayList[0]
  let prev = start

  for (const r of relapses) {
    const cleanDays = Math.max(0, daysBetween(prev, r.date) - 1)
    if (cleanDays > 0) {
      segments.push({ type: 'clean', label: `${cleanDays} clean day${cleanDays > 1 ? 's' : ''}` })
    }
    const timeLabel = r.time ? ` at ${fmtTime(r.time)}` : ''
    segments.push({ type: 'relapse', label: `Setback on ${fmtShortDay(r.date)}${timeLabel}` })
    prev = r.date
  }

  const finalDays = Math.max(0, daysBetween(prev, today))
  if (finalDays > 0) {
    segments.push({ type: 'clean', label: `${finalDays} clean day${finalDays > 1 ? 's' : ''} since last setback` })
  }

  return segments
}

function fmtTime(time24) {
  const [h, m] = time24.split(':').map(Number)
  const ampm = h >= 12 ? 'pm' : 'am'
  const h12  = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')}${ampm}`
}
