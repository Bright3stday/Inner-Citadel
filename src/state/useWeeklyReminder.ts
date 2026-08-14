import { useEffect, useRef } from 'react'
import { isReminderDue } from '../core/reminder'
import { todayKey, weekRange } from '../core/dates'
import { updateSettings } from '../actions/settingsActions'
import type { AppState } from '../model/types'
import type { Apply } from './useAppState'

/**
 * Best-effort weekly-ritual reminder. There is no server and this is
 * offline-first, so nothing can wake the app while it's fully closed —
 * this only ever fires when the app is actually open or just brought
 * to the foreground. The Review tab is the guaranteed fallback, not
 * this; see docs/decision-log-and-roadmap.md.
 *
 * Checks on mount, whenever the tab regains visibility, and once a
 * minute while it stays open (covers leaving the app open past the
 * scheduled moment). Uses refs rather than effect dependencies so it
 * doesn't tear down and re-attach its listeners on every state change.
 */
export function useWeeklyReminder(state: AppState, apply: Apply) {
  const stateRef = useRef(state)
  stateRef.current = state
  const applyRef = useRef(apply)
  applyRef.current = apply

  useEffect(() => {
    function check() {
      const current = stateRef.current
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return

      const now = new Date()
      const currentDayOfWeek = now.getDay()
      const currentTimeHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      const currentWeekKey = weekRange(todayKey(), current.settings.weekStartsOn).weekKey

      if (!isReminderDue(current.settings, currentDayOfWeek, currentTimeHHMM, currentWeekKey)) return

      new Notification('Inner Citadel', {
        body: 'Time for your weekly review.',
        tag: 'weekly-ritual',
      })
      applyRef.current(updateSettings, { lastReminderWeekKey: currentWeekKey })
    }

    check()
    document.addEventListener('visibilitychange', check)
    const interval = setInterval(check, 60_000)
    return () => {
      document.removeEventListener('visibilitychange', check)
      clearInterval(interval)
    }
  }, [])
}
