import type { Settings } from '../model/types'

/**
 * Is the weekly-ritual reminder due right now? Pure — takes the
 * current day-of-week and time-of-day as primitives rather than a
 * Date object, same discipline as core/dates.ts, so it's testable
 * without mocking the clock. The caller (UI layer, which is where
 * touching the real clock belongs) extracts these from `new Date()`.
 */
export function isReminderDue(
  settings: Settings,
  currentDayOfWeek: number, // 0=Sun..6=Sat
  currentTimeHHMM: string, // "HH:MM", 24h, zero-padded
  currentWeekKey: string,
): boolean {
  if (settings.reminderDay === null || settings.reminderTime === null) return false
  if (settings.lastReminderWeekKey === currentWeekKey) return false
  if (currentDayOfWeek !== settings.reminderDay) return false
  return currentTimeHHMM >= settings.reminderTime
}
