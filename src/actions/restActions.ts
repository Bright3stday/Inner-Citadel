import { newQuest, newRestRecord } from '../model/factories'
import { BUILTIN_RECOVERY_SETS } from '../core/recoverySets'
import type { AppState } from '../model/types'

/** Reduce selected quests' targets. Originals saved for restore on return. */
export function sendQuestsReduced(
  state: AppState,
  payload: {
    domainId: string
    reductions: { questId: string; newTarget: number }[]
    reason: string | null
  },
): AppState {
  const record = newRestRecord({
    domainId: payload.domainId,
    mode: 'reduced',
    questIds: payload.reductions.map((r) => r.questId),
    reason: payload.reason,
  })

  const newTargetByQuestId = new Map(payload.reductions.map((r) => [r.questId, r.newTarget]))

  const quests = state.quests.map((quest) => {
    const newTarget = newTargetByQuestId.get(quest.id)
    if (newTarget === undefined) return quest
    return {
      ...quest,
      restState: 'reduced' as const,
      preRestTargetCount: quest.targetCount,
      targetCount: newTarget,
      restRecordId: record.id,
    }
  })

  return { ...state, quests, restRecords: [...state.restRecords, record] }
}

/** Pause selected quests; optionally add a recovery quest set in their place. */
export function sendQuestsResting(
  state: AppState,
  payload: {
    domainId: string
    questIds: string[]
    recoverySetId: string | null
    reason: string | null
  },
): AppState {
  const record = newRestRecord({
    domainId: payload.domainId,
    mode: 'resting',
    questIds: payload.questIds,
    recoverySetId: payload.recoverySetId,
    reason: payload.reason,
  })

  const restingIds = new Set(payload.questIds)
  const quests = state.quests.map((quest) =>
    restingIds.has(quest.id) ? { ...quest, restState: 'resting' as const, restRecordId: record.id } : quest,
  )

  const recoverySet = BUILTIN_RECOVERY_SETS.find((s) => s.id === payload.recoverySetId) ?? null
  const recoveryQuests = (recoverySet?.templates ?? []).map((template) =>
    newQuest({
      domainId: payload.domainId,
      title: template.title,
      targetCount: template.targetCount,
      window: template.window,
      unitLabel: template.unitLabel,
      isRecoveryQuest: true,
      restRecordId: record.id,
    }),
  )

  const finishedRecord = { ...record, recoveryQuestIds: recoveryQuests.map((q) => q.id) }

  return {
    ...state,
    quests: [...quests, ...recoveryQuests],
    restRecords: [...state.restRecords, finishedRecord],
  }
}

/**
 * Return from the Inn: restore reduced targets, reactivate resting
 * quests, retire recovery quests (their log history stays — retiring
 * preserves it, same as any other quest), and close the record.
 */
export function returnFromInn(state: AppState, payload: { restRecordId: string }): AppState {
  const record = state.restRecords.find((r) => r.id === payload.restRecordId)
  if (!record) return state

  const now = new Date().toISOString()
  const originalIds = new Set(record.questIds)
  const recoveryIds = new Set(record.recoveryQuestIds)

  const quests = state.quests.map((quest) => {
    if (originalIds.has(quest.id)) {
      return {
        ...quest,
        restState: 'active' as const,
        targetCount: quest.preRestTargetCount ?? quest.targetCount,
        preRestTargetCount: null,
        restRecordId: null,
      }
    }
    if (recoveryIds.has(quest.id)) {
      return { ...quest, retiredAt: quest.retiredAt ?? now, restRecordId: null }
    }
    return quest
  })

  const restRecords = state.restRecords.map((r) => (r.id === record.id ? { ...r, endedAt: now } : r))

  return { ...state, quests, restRecords }
}
