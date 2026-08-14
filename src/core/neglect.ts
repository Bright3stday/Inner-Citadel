import { NEGLECT_WEEKS } from './rules'
import { lastCompletedWeeks, isWithinRange, completedWeeksSince } from './dates'
import type { Domain, LogEntry, Quest } from '../model/types'

/**
 * Zero contributions to this domain across the last NEGLECT_WEEKS
 * completed calendar weeks. Scoped at the domain level, per spec §7 —
 * a single quest lapsing is not the trigger. Retired quests count:
 * past work is still past work.
 *
 * A domain can't be neglected before it's had the chance to complete
 * even one full week. lastCompletedWeeks() deliberately excludes the
 * current in-progress week — so logging into a domain today, with no
 * prior history, sums to zero in that window for the same reason
 * genuine two-week abandonment does. Without the check below, a
 * domain touched for the first time today would read identically to
 * one abandoned two weeks ago. See docs/architecture.md §3.
 */
export function isNeglected(
  domainId: string,
  quests: Quest[],
  logs: LogEntry[],
  today: string,
  weekStartsOn: 0 | 1,
): boolean {
  const domainQuests = quests.filter((q) => q.domainId === domainId)

  // The Inn: a domain with anything currently resting is never
  // neglected, even if its recovery quests go unlogged too — that's
  // the deliberate point of resting rather than a loophole. This also
  // covers deriveCondition's crumbling check, which goes through this
  // same function. See model/types.ts RestRecord.
  if (domainQuests.some((q) => q.restState === 'resting')) return false

  const domainQuestIds = new Set(domainQuests.map((q) => q.id))
  const domainLogs = logs.filter((log) => domainQuestIds.has(log.questId))

  if (domainLogs.length === 0) return false

  const firstLogDate = domainLogs.reduce(
    (min, log) => (log.forDate < min ? log.forDate : min),
    domainLogs[0].forDate,
  )
  if (completedWeeksSince(firstLogDate, today, weekStartsOn).length === 0) return false

  const weeks = lastCompletedWeeks(today, NEGLECT_WEEKS, weekStartsOn)
  const total = domainLogs
    .filter((log) => weeks.some((week) => isWithinRange(log.forDate, week)))
    .reduce((sum, log) => sum + log.count, 0)

  return total === 0
}

export function findNeglectedDomains(
  domains: Domain[],
  quests: Quest[],
  logs: LogEntry[],
  today: string,
  weekStartsOn: 0 | 1,
): Domain[] {
  return domains.filter(
    (domain) => !domain.archivedAt && isNeglected(domain.id, quests, logs, today, weekStartsOn),
  )
}
