import { NEGLECT_WEEKS } from './rules'
import { lastCompletedWeeks, isWithinRange } from './dates'
import type { Domain, LogEntry, Quest } from '../model/types'

/**
 * Zero contributions to this domain across the last NEGLECT_WEEKS
 * completed calendar weeks. Scoped at the domain level, per spec §7 —
 * a single quest lapsing is not the trigger. Retired quests count:
 * past work is still past work.
 */
export function isNeglected(
  domainId: string,
  quests: Quest[],
  logs: LogEntry[],
  today: string,
): boolean {
  const weeks = lastCompletedWeeks(today, NEGLECT_WEEKS)
  const domainQuestIds = new Set(quests.filter((q) => q.domainId === domainId).map((q) => q.id))

  const total = logs
    .filter((log) => domainQuestIds.has(log.questId))
    .filter((log) => weeks.some((week) => isWithinRange(log.forDate, week)))
    .reduce((sum, log) => sum + log.count, 0)

  return total === 0
}

export function findNeglectedDomains(
  domains: Domain[],
  quests: Quest[],
  logs: LogEntry[],
  today: string,
): Domain[] {
  return domains.filter((domain) => !domain.archivedAt && isNeglected(domain.id, quests, logs, today))
}
