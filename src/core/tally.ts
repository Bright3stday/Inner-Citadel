import { TARGET_MET_RATIO } from './rules'
import { weekRange, isWithinRange, daysInRange, type WeekRange } from './dates'
import type { LogEntry, Quest, QuestProgress } from '../model/types'

/**
 * A quest's progress within its CURRENT window (today, or the week
 * containing today). Any logged method contributes toward the same
 * target — methods are interchangeable units, not weighted.
 */
export function questProgress(quest: Quest, logs: LogEntry[], today: string): QuestProgress {
  const inWindow =
    quest.window === 'day'
      ? (forDate: string) => forDate === today
      : (forDate: string) => isWithinRange(forDate, weekRange(today))

  const current = logs
    .filter((log) => log.questId === quest.id && inWindow(log.forDate))
    .reduce((sum, log) => sum + log.count, 0)

  return {
    current,
    target: quest.targetCount,
    met: current >= quest.targetCount * TARGET_MET_RATIO,
  }
}

/**
 * Did this quest meet its target during a specific (usually past)
 * week? Used by core/spire.ts for height and condition, so both the
 * skyline's height and its condition read "met" the same way.
 *
 * Week-window quests: the week's total meets the target.
 * Day-window quests: every day the quest existed within that week
 * (and isn't in the future) individually met the target. This is
 * decision 4 in docs/architecture.md §9 — flagged there as deferred
 * for tuning after real use, not settled permanently.
 */
export function questMetInWeek(
  quest: Quest,
  logs: LogEntry[],
  week: WeekRange,
  today: string,
): boolean {
  const dayTotal = (day: string) =>
    logs
      .filter((log) => log.questId === quest.id && log.forDate === day)
      .reduce((sum, log) => sum + log.count, 0)

  if (quest.window === 'week') {
    const weekTotal = logs
      .filter((log) => log.questId === quest.id && isWithinRange(log.forDate, week))
      .reduce((sum, log) => sum + log.count, 0)
    return weekTotal >= quest.targetCount * TARGET_MET_RATIO
  }

  const createdDate = quest.createdAt.slice(0, 10)
  const retiredDate = quest.retiredAt?.slice(0, 10) ?? null
  const applicableDays = daysInRange(week).filter(
    (day) => day <= today && day >= createdDate && (retiredDate === null || day <= retiredDate),
  )
  if (applicableDays.length === 0) return false
  return applicableDays.every((day) => dayTotal(day) >= quest.targetCount * TARGET_MET_RATIO)
}
