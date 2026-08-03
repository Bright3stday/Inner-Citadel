import { newQuest, newQuestMethod } from '../model/factories'
import type { AppState } from '../model/types'

export function addQuest(
  state: AppState,
  payload: {
    domainId: string
    title: string
    targetCount: number
    window: 'day' | 'week'
    unitLabel: string
    methodLabels: string[] // empty defaults to a single 'Logged' method
  },
): AppState {
  const methods =
    payload.methodLabels.length > 0 ? payload.methodLabels.map(newQuestMethod) : undefined

  const quest = newQuest({
    domainId: payload.domainId,
    title: payload.title,
    targetCount: payload.targetCount,
    window: payload.window,
    unitLabel: payload.unitLabel,
    methods,
  })

  return { ...state, quests: [...state.quests, quest] }
}

export function retireQuest(state: AppState, payload: { questId: string }): AppState {
  return {
    ...state,
    quests: state.quests.map((quest) =>
      quest.id === payload.questId ? { ...quest, retiredAt: new Date().toISOString() } : quest,
    ),
  }
}
