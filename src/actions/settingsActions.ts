import type { AppState, Settings } from '../model/types'

export function updateSettings(state: AppState, payload: Partial<Settings>): AppState {
  return { ...state, settings: { ...state.settings, ...payload } }
}
