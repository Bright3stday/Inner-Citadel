import { useEffect, useRef, useState } from 'react'
import { ProgressBar } from './ProgressBar'
import type { DailyQuestView } from '../../core/selectors'

type Props = {
  view: DailyQuestView
  onLog: (methodId: string) => void
}

type PulseState = 'none' | 'normal' | 'target'

const NORMAL_PULSE_MS = 400
const TARGET_PULSE_MS = 800
const TAP_NOTE_MS = 1800

function vibrate(pattern: number | number[]) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern)
  }
}

function ordinal(n: number): string {
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`
  switch (n % 10) {
    case 1:
      return `${n}st`
    case 2:
      return `${n}nd`
    case 3:
      return `${n}rd`
    default:
      return `${n}th`
  }
}

// suggestedDays only ever dims this row's display — it never disables
// the log buttons. Banking progress ahead of "due" is always allowed.
export function QuestRow({ view, onLog }: Props) {
  const { quest, progress, isDueToday, logsToday } = view
  const [pulse, setPulse] = useState<PulseState>('none')
  const [tapNote, setTapNote] = useState<string | null>(null)
  const wasMetRef = useRef(progress.met)

  // Fires exactly once, at the moment this quest's target is actually
  // reached — not on every tap afterward, and not on mount for a quest
  // that was already met before this page loaded. Reacts to the real
  // derived progress value rather than guessing at click time, so it's
  // correct regardless of which method button caused the crossing.
  useEffect(() => {
    if (progress.met && !wasMetRef.current) {
      setPulse('target')
      vibrate([40, 30, 60])
      const timeout = setTimeout(() => setPulse('none'), TARGET_PULSE_MS)
      wasMetRef.current = progress.met
      return () => clearTimeout(timeout)
    }
    wasMetRef.current = progress.met
  }, [progress.met])

  function handleLog(methodId: string) {
    onLog(methodId)
    vibrate(20)
    setPulse((current) => (current === 'target' ? current : 'normal'))
    setTimeout(() => {
      setPulse((current) => (current === 'normal' ? 'none' : current))
    }, NORMAL_PULSE_MS)

    // A real, changing fact about this specific tap rather than a fixed
    // "logged!" — the same acknowledgment every time is what read as a
    // checkbox tick in UAT. logsToday reflects the count BEFORE this tap.
    setTapNote(`${ordinal(logsToday + 1)} today`)
    setTimeout(() => setTapNote(null), TAP_NOTE_MS)
  }

  return (
    <div className={`quest-row${isDueToday ? '' : ' quest-row-not-due'}`}>
      <div className="quest-row-header">
        <span className="quest-title">{quest.title}</span>
      </div>
      <ProgressBar current={progress.current} target={progress.target} pulse={pulse} />
      <div className="quest-methods">
        {quest.methods.map((method) => (
          <button key={method.id} type="button" onClick={() => handleLog(method.id)}>
            + {method.label}
          </button>
        ))}
      </div>
      <p className="quest-tap-note">{tapNote}</p>
    </div>
  )
}
