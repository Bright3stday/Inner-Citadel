import { emptyAppState } from '../model/factories'
import type { AppState } from '../model/types'

const KEY = 'innerCitadel.v1'

/**
 * Reads the single stored JSON document. Never returns undefined or a
 * partial object — first run gets a fresh empty state, corrupt JSON is
 * a loud failure rather than a silent reset. See docs/architecture.md §6.
 *
 * migrate.ts (schema upgrades) and transfer.ts (export/import, with the
 * backup-before-overwrite step) are deferred past this base pass.
 */
export function load(): AppState {
  const raw = localStorage.getItem(KEY)
  if (raw === null) return emptyAppState()

  try {
    return JSON.parse(raw) as AppState
  } catch (err) {
    throw new Error(
      `Stored Inner Citadel data at localStorage["${KEY}"] is not valid JSON and could not be loaded. ` +
        `Nothing has been overwritten. Original error: ${(err as Error).message}`,
    )
  }
}

export function save(state: AppState): void {
  localStorage.setItem(KEY, JSON.stringify(state))
}

/** True once anything has been saved. Lets callers (main.tsx) decide
 * whether to seed without touching localStorage directly — this file
 * stays the only module that does. */
export function hasStoredState(): boolean {
  return localStorage.getItem(KEY) !== null
}
