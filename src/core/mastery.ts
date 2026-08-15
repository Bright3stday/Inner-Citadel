import { completedWeeksSince } from './dates'
import { questMetInWeek } from './tally'
import type { LogEntry, MasteryNode, Quest } from '../model/types'

export type MasteryNodeState = 'locked' | 'eligible' | 'unlocked'

export type MasteryNodeView = {
  node: MasteryNode
  state: MasteryNodeState
  practiceCount: number
}

/**
 * How much practice has accumulated toward this node's threshold.
 *
 * 'quest completions': raw LogEntry rows (taps) logged against any
 * contributing quest, all-time. Deliberately not scaled by a log's
 * `count` — one tap is one unit of practice toward a node, same as
 * GP's own earn rate, so spam-tapping a high-count method doesn't
 * inflate this faster than a naturally lower-count one.
 *
 * 'weeks meeting target': completed weeks (since the earliest
 * contributing log) where at least one contributing quest met its own
 * target that week — the same "does a week qualify" idea the old
 * week-driven spire height used, now feeding node eligibility instead
 * of height directly. See docs/decision-log-and-roadmap.md.
 */
export function practiceCountForNode(
  node: MasteryNode,
  quests: Quest[],
  logs: LogEntry[],
  today: string,
  weekStartsOn: 0 | 1,
): number {
  const contributingLogs = logs.filter((log) => node.contributingQuestIds.includes(log.questId))

  if (node.thresholdUnit === 'quest completions') {
    return contributingLogs.length
  }

  if (contributingLogs.length === 0) return 0
  const contributingQuests = quests.filter((q) => node.contributingQuestIds.includes(q.id))
  if (contributingQuests.length === 0) return 0

  const firstLogDate = contributingLogs.reduce(
    (min, log) => (log.forDate < min ? log.forDate : min),
    contributingLogs[0].forDate,
  )
  const weeks = completedWeeksSince(firstLogDate, today, weekStartsOn)
  return weeks.filter((week) => contributingQuests.some((quest) => questMetInWeek(quest, logs, week, today)))
    .length
}

/**
 * Practice earns the right to claim a node; it never makes the claim
 * automatically. 'eligible' just means the threshold is met — moving
 * to 'unlocked' is always a deliberate act (actions/masteryActions.ts
 * unlockMasteryNode), never derived from practiceCount alone.
 */
export function deriveNodeState(node: MasteryNode, practiceCount: number): MasteryNodeState {
  if (node.unlockedAt !== null) return 'unlocked'
  if (practiceCount >= node.practiceThreshold) return 'eligible'
  return 'locked'
}

/** A domain's nodes, in author order, each with its derived state and
 * current practice count. */
export function getMasteryNodeViews(
  domainId: string,
  masteryNodes: MasteryNode[],
  quests: Quest[],
  logs: LogEntry[],
  today: string,
  weekStartsOn: 0 | 1,
): MasteryNodeView[] {
  return masteryNodes
    .filter((node) => node.domainId === domainId)
    .sort((a, b) => a.order - b.order)
    .map((node) => {
      const practiceCount = practiceCountForNode(node, quests, logs, today, weekStartsOn)
      return { node, state: deriveNodeState(node, practiceCount), practiceCount }
    })
}
