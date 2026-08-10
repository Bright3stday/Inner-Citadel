import { TARGET_MET_RATIO } from './rules'
import { addDays, weekRange, isWithinRange, daysInRange, lastCompletedWeeks, lastMonths, type WeekRange } from './dates'
import type { LogEntry, Quest, QuestProgress, RestRecord } from '../model/types'

/**
 * Did any Inn stay (reduced or resting — treated the same for trend
 * display purposes) cover this quest during [rangeStart, rangeEnd]?
 * Used so a rested stretch shows as rested rather than as a miss —
 * see docs/decision-log-and-roadmap.md, Inn section. Reduced and
 * resting aren't distinguished here: a still-open stay's effective end
 * is treated as "now" via the caller passing today as rangeEnd's ceiling.
 */
function wasQuestRestedInRange(
  quest: Quest,
  rangeStart: string,
  rangeEnd: string,
  restRecords: RestRecord[],
): boolean {
  return restRecords.some((record) => {
    if (!record.questIds.includes(quest.id)) return false
    const recordStart = record.startedAt.slice(0, 10)
    const recordEnd = record.endedAt?.slice(0, 10) ?? '9999-12-31'
    return rangeStart <= recordEnd && rangeEnd >= recordStart
  })
}

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

/** The days within `week` this quest actually existed and isn't in the future. */
function applicableDaysInWeek(quest: Quest, week: WeekRange, today: string): string[] {
  const createdDate = quest.createdAt.slice(0, 10)
  const retiredDate = quest.retiredAt?.slice(0, 10) ?? null
  return daysInRange(week).filter(
    (day) => day <= today && day >= createdDate && (retiredDate === null || day <= retiredDate),
  )
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

  const applicableDays = applicableDaysInWeek(quest, week, today)
  if (applicableDays.length === 0) return false
  return applicableDays.every((day) => dayTotal(day) >= quest.targetCount * TARGET_MET_RATIO)
}

/**
 * The actual counted quantity behind `questMetInWeek`, for display —
 * doesn't redefine "met", just exposes the real numbers so a 0/3 week
 * and a 2/3 week don't look identical. Week-window: the week's raw
 * total against the target. Day-window: summed across the days the
 * quest was actually active that week, against target × that many
 * days, so a 3×/day quest active 5 of 7 days reads as "x / 15" rather
 * than a misleading fixed weekly number.
 */
export function questWeekTally(
  quest: Quest,
  logs: LogEntry[],
  week: WeekRange,
  today: string,
): { current: number; target: number } {
  if (quest.window === 'week') {
    const current = logs
      .filter((log) => log.questId === quest.id && isWithinRange(log.forDate, week))
      .reduce((sum, log) => sum + log.count, 0)
    return { current, target: quest.targetCount }
  }

  const applicableDays = applicableDaysInWeek(quest, week, today)
  const current = logs
    .filter((log) => log.questId === quest.id && applicableDays.includes(log.forDate))
    .reduce((sum, log) => sum + log.count, 0)
  return { current, target: quest.targetCount * applicableDays.length }
}

export type DayLevel = 'under' | 'met' | 'over' | 'rested'

/** Plain three-way split against a real target — not the same thing as
 * `met` (which uses TARGET_MET_RATIO for a binary yes/no). This is
 * purely for showing whether a period ran short, landed on, or
 * exceeded its target, so under/over don't collapse into one bucket. */
function classifyCount(count: number, target: number): DayLevel {
  if (count < target) return 'under'
  if (count > target) return 'over'
  return 'met'
}

export type QuestDay = {
  day: string
  count: number
  // Real per-day target only exists for day-window quests — a
  // week-window quest's target applies to the whole week, so there's
  // nothing honest to compare a single day's count against. Rather
  // than invent a synthetic daily share, those days carry a raw count
  // and no level; the week's own current/target (questWeekTally) is
  // the real signal for those. 'rested' overrides either case: a day
  // covered by an Inn stay isn't a real attempt, so it's never shown
  // as a miss.
  level: DayLevel | null
}

/** Day-by-day counts across `week`, for a per-quest daily grid. */
export function questDayBreakdown(
  quest: Quest,
  logs: LogEntry[],
  week: WeekRange,
  today: string,
  restRecords: RestRecord[] = [],
): QuestDay[] {
  const createdDate = quest.createdAt.slice(0, 10)
  const retiredDate = quest.retiredAt?.slice(0, 10) ?? null

  return daysInRange(week).map((day) => {
    const count = logs
      .filter((log) => log.questId === quest.id && log.forDate === day)
      .reduce((sum, log) => sum + log.count, 0)

    if (wasQuestRestedInRange(quest, day, day, restRecords)) {
      return { day, count, level: 'rested' as const }
    }

    if (quest.window === 'week') {
      return { day, count, level: null }
    }

    const applicable = day <= today && day >= createdDate && (retiredDate === null || day <= retiredDate)
    return { day, count, level: applicable ? classifyCount(count, quest.targetCount) : null }
  })
}

export type QuestMonth = {
  monthLabel: string // "2026-07"
  under: number
  met: number
  over: number
  total: number // under + met + over — judged periods that month
}

/**
 * Per-month under/met/over tallies, for spotting a quest that's
 * chronically short (recalibrate or retire), chronically over
 * (increase the target, or it's basically mastered), or genuinely on
 * track. Week-window quests are judged per completed week (reusing
 * questWeekTally); day-window quests are judged per applicable day —
 * each period compared against its own real target, never a synthetic
 * one. Periods covered by an Inn stay are excluded entirely (not
 * counted as under, not counted as met) — a rested stretch shouldn't
 * drag down or inflate the "is this quest working" signal either way.
 */
export function questMonthlyBreakdown(
  quest: Quest,
  logs: LogEntry[],
  today: string,
  months: number,
  restRecords: RestRecord[] = [],
): QuestMonth[] {
  const buckets = new Map<string, { under: number; met: number; over: number }>()
  const bump = (monthLabel: string, level: DayLevel) => {
    if (level === 'rested') return
    const bucket = buckets.get(monthLabel) ?? { under: 0, met: 0, over: 0 }
    bucket[level] += 1
    buckets.set(monthLabel, bucket)
  }

  const createdDate = quest.createdAt.slice(0, 10)
  const retiredDate = quest.retiredAt?.slice(0, 10) ?? null

  if (quest.window === 'week') {
    for (const week of lastCompletedWeeks(today, months * 5)) {
      if (createdDate > week.endKey) continue
      if (retiredDate !== null && retiredDate < week.startKey) continue
      if (wasQuestRestedInRange(quest, week.startKey, week.endKey, restRecords)) continue
      const { current, target } = questWeekTally(quest, logs, week, today)
      bump(week.endKey.slice(0, 7), classifyCount(current, target))
    }
  } else {
    let cursor = addDays(today, -months * 31)
    while (cursor <= today) {
      if (cursor >= createdDate && (retiredDate === null || cursor <= retiredDate)) {
        if (!wasQuestRestedInRange(quest, cursor, cursor, restRecords)) {
          const count = logs
            .filter((log) => log.questId === quest.id && log.forDate === cursor)
            .reduce((sum, log) => sum + log.count, 0)
          bump(cursor.slice(0, 7), classifyCount(count, quest.targetCount))
        }
      }
      cursor = addDays(cursor, 1)
    }
  }

  // Always one point per calendar month, even when a month has no
  // judged periods (before the quest existed, or genuinely no data) —
  // a fixed set of columns so every quest's row lines up the same way
  // regardless of how much history that particular quest has.
  return lastMonths(today, months).map((monthLabel) => {
    const b = buckets.get(monthLabel) ?? { under: 0, met: 0, over: 0 }
    return { monthLabel, ...b, total: b.under + b.met + b.over }
  })
}
