import { HEIGHT_TIER_THRESHOLDS, THRIVING_STREAK_WEEKS } from './rules'
import { completedWeeksSince, lastCompletedWeeks } from './dates'
import { questMetInWeek } from './tally'
import { isNeglected } from './neglect'
import type { Domain, DomainSpire, LogEntry, Quest, SpireCondition, SpireHeight } from '../model/types'

function domainQuestsOf(domain: Domain, quests: Quest[]): Quest[] {
  return quests.filter((q) => q.domainId === domain.id) // includes retired
}

function domainHasAnyLog(domainQuests: Quest[], logs: LogEntry[]): boolean {
  const questIds = new Set(domainQuests.map((q) => q.id))
  return logs.some((log) => questIds.has(log.questId))
}

/**
 * Cumulative depth of practice. Monotonic — never decreases.
 * See docs/architecture.md §3, "Height rule".
 */
export function deriveHeight(
  domain: Domain,
  quests: Quest[],
  logs: LogEntry[],
  today: string,
): SpireHeight {
  const domainQuests = domainQuestsOf(domain, quests)
  const domainLogs = logs.filter((log) => domainQuests.some((q) => q.id === log.questId))

  if (domainLogs.length === 0) {
    return { heightWeeks: 0, heightTier: 0 }
  }

  const firstLogDate = domainLogs.reduce(
    (min, log) => (log.forDate < min ? log.forDate : min),
    domainLogs[0].forDate,
  )

  const weeks = completedWeeksSince(firstLogDate, today)
  // One quest meeting target is enough for a week to qualify — the
  // looser bar (vs. the 'thriving' bar below) is what lets height and
  // condition tell different stories. See docs/architecture.md §3.
  const heightWeeks = weeks.filter((week) =>
    domainQuests.some((quest) => questMetInWeek(quest, logs, week, today)),
  ).length

  const heightTier = HEIGHT_TIER_THRESHOLDS.filter((threshold) => heightWeeks >= threshold).length

  return { heightWeeks, heightTier }
}

/**
 * Current trend, from recent weeks only. Checked in this order —
 * order is part of the rule. See docs/architecture.md §3, "Condition rule".
 */
export function deriveCondition(
  domain: Domain,
  quests: Quest[],
  logs: LogEntry[],
  today: string,
): SpireCondition {
  const domainQuests = domainQuestsOf(domain, quests)

  // Fast path for zero logs, ever — genuinely a domain with no
  // history is not "crumbling." This only covers that one case; the
  // trickier one (logs exist, but none are old enough to have
  // completed a week yet) is handled inside isNeglected() itself, so
  // findNeglectedDomains gets the same protection without needing its
  // own copy of it. See core/neglect.ts and docs/architecture.md §3.
  if (!domainHasAnyLog(domainQuests, logs)) return 'steady'

  if (isNeglected(domain.id, quests, logs, today)) return 'crumbling'

  const activeQuests = domainQuests.filter((q) => !q.retiredAt)
  // Guard: "every quest in an empty set met its target" is vacuously
  // true. Without this check a domain with zero active quests would
  // render as thriving.
  if (activeQuests.length > 0) {
    const weeks = lastCompletedWeeks(today, THRIVING_STREAK_WEEKS)
    const allMet =
      weeks.length === THRIVING_STREAK_WEEKS &&
      weeks.every((week) => activeQuests.every((quest) => questMetInWeek(quest, logs, week, today)))
    if (allMet) return 'thriving'
  }

  return 'steady'
}

export function deriveSpire(
  domain: Domain,
  quests: Quest[],
  logs: LogEntry[],
  today: string,
): DomainSpire {
  return {
    ...deriveHeight(domain, quests, logs, today),
    condition: deriveCondition(domain, quests, logs, today),
  }
}
