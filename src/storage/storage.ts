import { emptyAppState } from '../model/factories'
import type { AppState } from '../model/types'

const KEY = 'innerCitadel.v1'
const BACKUP_KEY = 'innerCitadel.backup'

/**
 * Reads the single stored JSON document. Never returns undefined or a
 * partial object — first run gets a fresh empty state, corrupt JSON is
 * a loud failure rather than a silent reset. See docs/architecture.md §6.
 *
 * migrate.ts (schema upgrades) is still deferred — only schemaVersion 1
 * exists so far.
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

/**
 * Wipes the main document. Used by Settings' Reset control. Does not
 * touch the backup key — a reset stays recoverable the same way an
 * import does.
 */
export function clear(): void {
  localStorage.removeItem(KEY)
}

/**
 * Written by transfer.ts immediately before an import overwrites the
 * main document, so a bad import is recoverable. Not merged, not
 * rotated — one slot, overwritten on each import.
 */
export function saveBackup(state: AppState): void {
  localStorage.setItem(BACKUP_KEY, JSON.stringify(state))
}

export function loadBackup(): AppState | null {
  const raw = localStorage.getItem(BACKUP_KEY)
  return raw === null ? null : (JSON.parse(raw) as AppState)
}
