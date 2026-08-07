import type { AppState, WeeklyIntent } from '../model/types'

/** Upserts by weekKey — one intent per week, setting again overwrites it. */
export function setWeeklyIntent(state: AppState, payload: { weekKey: string; note: string }): AppState {
  const intent: WeeklyIntent = {
    weekKey: payload.weekKey,
    note: payload.note,
    createdAt: new Date().toISOString(),
  }

  const exists = state.weeklyIntents.some((i) => i.weekKey === payload.weekKey)
  const weeklyIntents = exists
    ? state.weeklyIntents.map((i) => (i.weekKey === payload.weekKey ? intent : i))
    : [...state.weeklyIntents, intent]

  return { ...state, weeklyIntents }
}
