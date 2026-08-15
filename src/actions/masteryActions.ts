import { newMasteryNode } from '../model/factories'
import type { AppState, ThresholdUnit } from '../model/types'

export function addMasteryNode(
  state: AppState,
  payload: {
    domainId: string
    title: string
    criteria: string
    practiceThreshold: number
    thresholdUnit: ThresholdUnit
    contributingQuestIds: string[]
  },
): AppState {
  const order = state.masteryNodes.filter((n) => n.domainId === payload.domainId).length
  const node = newMasteryNode({ ...payload, order })
  return { ...state, masteryNodes: [...state.masteryNodes, node] }
}

export function editMasteryNode(
  state: AppState,
  payload: {
    nodeId: string
    title: string
    criteria: string
    practiceThreshold: number
    thresholdUnit: ThresholdUnit
    contributingQuestIds: string[]
  },
): AppState {
  return {
    ...state,
    masteryNodes: state.masteryNodes.map((node) =>
      node.id === payload.nodeId
        ? {
            ...node,
            title: payload.title,
            criteria: payload.criteria,
            practiceThreshold: payload.practiceThreshold,
            thresholdUnit: payload.thresholdUnit,
            contributingQuestIds: payload.contributingQuestIds,
          }
        : node,
    ),
  }
}

/** Only ever offered by the UI for a node that hasn't been unlocked —
 * an unlocked node is a real claimed record, not a draft to discard.
 * A hard delete, same as any other pre-commitment correction in this
 * app (there's no history value in an unearned node to preserve). */
export function deleteMasteryNode(state: AppState, payload: { nodeId: string }): AppState {
  return { ...state, masteryNodes: state.masteryNodes.filter((node) => node.id !== payload.nodeId) }
}

/**
 * The deliberate claim: practice earned eligibility, this spends GP to
 * actually unlock it. The UI is the trust boundary here (same as every
 * other action in this file) — it only offers this once the node is
 * eligible and the GP balance covers the cost; this action doesn't
 * re-derive either, same pattern as the rest of actions/.
 */
export function unlockMasteryNode(state: AppState, payload: { nodeId: string }): AppState {
  const now = new Date().toISOString()
  return {
    ...state,
    masteryNodes: state.masteryNodes.map((node) =>
      node.id === payload.nodeId && node.unlockedAt === null ? { ...node, unlockedAt: now } : node,
    ),
  }
}
