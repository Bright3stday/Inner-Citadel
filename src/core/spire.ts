import { THRIVING_STREAK_WEEKS } from './rules'
import { lastCompletedWeeks } from './dates'
import { questMetInWeek } from './tally'
import { getMasteryNodeViews } from './mastery'
import { isNeglected } from './neglect'
import type { Domain, DomainSpire, LogEntry, MasteryNode, Quest, SpireCondition, SpireHeight } from '../model/types'

function domainQuestsOf(domain: Domain, quests: Quest[]): Quest[] {
  return quests.filter((q) => q.domainId === domain.id) // includes retired
}

function domainHasAnyLog(domainQuests: Quest[], logs: LogEntry[]): boolean {
  const questIds = new Set(domainQuests.map((q) => q.id))
  return logs.some((log) => questIds.has(log.questId))
}

/**
 * Height is node-driven: heightTier is simply how many mastery nodes
 * this domain has unlocked so far — a real milestone, moving rarely.
 * nextNode carries the practice signal that's supposed to move most
 * weeks even between unlocks — the dead zone the old week-count ladder
 * left between the Forge's 3-day window and a whole-week height bump.
 * Unbounded on purpose: bounded by nodes authored, not a hardcoded
 * tier ceiling. See docs/decision-log-and-roadmap.md, "Spire becomes
 * node-driven".
 *
 * nextNode is specifically the nearest still-LOCKED node, not just
 * "the next un-unlocked one" — an eligible node has already stopped
 * accumulating (it's done, waiting on a deliberate unlock), so its
 * numbers don't belong on a bar that's supposed to represent something
 * still in motion. If every remaining node is eligible or unlocked,
 * nextNode is null: there's genuinely nothing left "under
 * construction," only something waiting on you.
 */
export function deriveHeight(
  domain: Domain,
  masteryNodes: MasteryNode[],
  quests: Quest[],
  logs: LogEntry[],
  today: string,
  weekStartsOn: 0 | 1,
): SpireHeight {
  const nodeViews = getMasteryNodeViews(domain.id, masteryNodes, quests, logs, today, weekStartsOn)

  const heightTier = nodeViews.filter((view) => view.state === 'unlocked').length
  const next = nodeViews.find((view) => view.state === 'locked') ?? null
  const nextNode = next
    ? { title: next.node.title, practiceCount: next.practiceCount, practiceThreshold: next.node.practiceThreshold }
    : null

  return { heightTier, nextNode }
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
  weekStartsOn: 0 | 1,
): SpireCondition {
  const domainQuests = domainQuestsOf(domain, quests)

  // Fast path for zero logs, ever — genuinely a domain with no
  // history is not "crumbling." This only covers that one case; the
  // trickier one (logs exist, but none are old enough to have
  // completed a week yet) is handled inside isNeglected() itself, so
  // findNeglectedDomains gets the same protection without needing its
  // own copy of it. See core/neglect.ts and docs/architecture.md §3.
  if (!domainHasAnyLog(domainQuests, logs)) return 'steady'

  if (isNeglected(domain.id, quests, logs, today, weekStartsOn)) return 'crumbling'

  // Resting quests are paused — excluded here so they don't count
  // against thriving while resting (they also can't count for it,
  // since they're not being logged). A currently-active recovery
  // quest isn't excluded: it's a normal Quest row, so logging it
  // genuinely feeds this same real rule, which is the point — resting
  // properly is real practice, not a gap. See model/types.ts RestRecord.
  const activeQuests = domainQuests.filter((q) => !q.retiredAt && q.restState !== 'resting')
  // Guard: "every quest in an empty set met its target" is vacuously
  // true. Without this check a domain with zero active quests would
  // render as thriving.
  if (activeQuests.length > 0) {
    const weeks = lastCompletedWeeks(today, THRIVING_STREAK_WEEKS, weekStartsOn)
    const allMet =
      weeks.length === THRIVING_STREAK_WEEKS &&
      weeks.every((week) => activeQuests.every((quest) => questMetInWeek(quest, logs, week, today)))
    if (allMet) return 'thriving'
  }

  return 'steady'
}

export function deriveSpire(
  domain: Domain,
  masteryNodes: MasteryNode[],
  quests: Quest[],
  logs: LogEntry[],
  today: string,
  weekStartsOn: 0 | 1,
): DomainSpire {
  return {
    ...deriveHeight(domain, masteryNodes, quests, logs, today, weekStartsOn),
    condition: deriveCondition(domain, quests, logs, today, weekStartsOn),
  }
}
