import { todayKey } from '../core/dates'
import * as storage from './storage'
import type { AppState } from '../model/types'

const CURRENT_SCHEMA_VERSION = 1

export function exportToFile(state: AppState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `inner-citadel-${todayKey()}.json`
  link.click()

  URL.revokeObjectURL(url)
}

/**
 * A shallow structural check, not a full schema validator — enough to
 * catch "wrong file entirely." See docs/architecture.md §6.
 */
function validateAppState(data: unknown): AppState {
  if (typeof data !== 'object' || data === null) {
    throw new Error('This file is not an Inner Citadel export — expected a JSON object.')
  }

  const candidate = data as Record<string, unknown>
  const requiredArrays = ['domains', 'quests', 'logEntries'] as const
  for (const key of requiredArrays) {
    if (!Array.isArray(candidate[key])) {
      throw new Error(`This file is not an Inner Citadel export — missing or invalid "${key}".`)
    }
  }

  if (typeof candidate.schemaVersion !== 'number') {
    throw new Error('This file is not an Inner Citadel export — missing "schemaVersion".')
  }

  // migrate.ts (schema upgrades) doesn't exist yet, so an older or newer
  // schema is refused outright rather than silently accepted. See
  // docs/architecture.md §6's "missing or corrupt data" rules.
  if (candidate.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    throw new Error(
      `This file is schemaVersion ${candidate.schemaVersion}, but this build expects ` +
        `${CURRENT_SCHEMA_VERSION}. Migration between versions isn't built yet.`,
    )
  }

  return candidate as unknown as AppState
}

/**
 * Reads, validates, and returns the imported state — it does NOT apply
 * it. The caller routes the result through the same apply() path as
 * every other state change (see actions/transferActions.ts), after
 * backing up whatever is about to be overwritten.
 *
 * Import REPLACES; it does not merge. There is no way to produce a
 * genuine conflict on a single-device-at-a-time app, so replacement is
 * the honest behavior — the UI must say so before calling this.
 */
export async function importFromFile(file: File, currentState: AppState): Promise<AppState> {
  const text = await file.text()

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch (err) {
    throw new Error(`"${file.name}" is not valid JSON. Original error: ${(err as Error).message}`)
  }

  const validated = validateAppState(parsed)
  storage.saveBackup(currentState)
  return validated
}
