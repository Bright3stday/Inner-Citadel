import { newId } from '../model/ids'
import type { AppState, LogEntry } from '../model/types'

export function logContribution(
  state: AppState,
  payload: { questId: string; methodId: string; forDate: string; count?: number },
): AppState {
  const entry: LogEntry = {
    id: newId('log'),
    questId: payload.questId,
    methodId: payload.methodId,
    count: payload.count ?? 1,
    forDate: payload.forDate,
    loggedAt: new Date().toISOString(),
  }

  return { ...state, logEntries: [...state.logEntries, entry] }
}

export function removeLogEntry(state: AppState, logEntryId: string): AppState {
  return { ...state, logEntries: state.logEntries.filter((log) => log.id !== logEntryId) }
}
