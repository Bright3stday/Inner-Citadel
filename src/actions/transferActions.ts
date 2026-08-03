import type { AppState } from '../model/types'

/**
 * Swaps in an already-validated AppState (from storage/transfer.ts).
 * Exists so an import flows through the same apply() path as every
 * other state change, rather than useAppState needing a special case.
 */
export function replaceState(_state: AppState, payload: AppState): AppState {
  return payload
}
