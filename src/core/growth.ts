import { GP_PER_LOG, NODE_UNLOCK_COST } from './rules'
import type { GrowthPoints, LogEntry, MasteryNode } from '../model/types'

/**
 * GP is entirely derived — earned from log history (retroactively
 * computable, same as everything else this app derives; logging
 * before GP existed still counts), spent by which nodes are unlocked.
 * Nothing about GP itself is stored. Global, not domain-scoped: the
 * skeleton is testing whether "practice accrues something that
 * unlocks something" feels meaningful at all, not building an economy
 * with per-domain scarcity yet.
 */
export function deriveGrowthPoints(logEntries: LogEntry[], masteryNodes: MasteryNode[]): GrowthPoints {
  const earned = logEntries.length * GP_PER_LOG
  const spent = masteryNodes.filter((node) => node.unlockedAt !== null).length * NODE_UNLOCK_COST
  return { earned, spent, balance: earned - spent }
}
