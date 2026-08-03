// Parses and validates the output of the (not-yet-built) AI Quest
// Generator — see docs/architecture.md §7. This is deliberately the
// only piece built so far: the prompt itself is being designed
// elsewhere. The shape below IS the contract between whatever produces
// that prompt later and this app — it mirrors actions/questActions.ts's
// addQuest payload exactly (minus domainId, which comes from whichever
// domain you're importing into), so a valid draft can be handed
// straight to addQuest with no translation step.

export type QuestDraft = {
  title: string
  targetCount: number
  window: 'day' | 'week'
  unitLabel: string
  methodLabels: string[]
}

/** Strips a leading/trailing ```json fence if present — LLMs commonly
 * wrap JSON in one even when told not to. */
function stripCodeFence(text: string): string {
  const trimmed = text.trim()
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  return match ? match[1] : trimmed
}

function validateDraft(data: unknown, index: number): QuestDraft {
  if (typeof data !== 'object' || data === null) {
    throw new Error(`Item ${index + 1} is not an object.`)
  }
  const candidate = data as Record<string, unknown>
  const label = typeof candidate.title === 'string' ? `"${candidate.title}"` : `item ${index + 1}`

  if (typeof candidate.title !== 'string' || candidate.title.trim() === '') {
    throw new Error(`Item ${index + 1} is missing a valid "title".`)
  }
  if (typeof candidate.targetCount !== 'number' || candidate.targetCount <= 0) {
    throw new Error(`${label} has an invalid "targetCount" — expected a positive number.`)
  }
  if (candidate.window !== 'day' && candidate.window !== 'week') {
    throw new Error(`${label} has an invalid "window" — expected "day" or "week".`)
  }
  if (typeof candidate.unitLabel !== 'string' || candidate.unitLabel.trim() === '') {
    throw new Error(`${label} is missing a valid "unitLabel".`)
  }

  const methodLabels = Array.isArray(candidate.methodLabels)
    ? candidate.methodLabels.filter(
        (m): m is string => typeof m === 'string' && m.trim() !== '',
      )
    : []

  return {
    title: candidate.title.trim(),
    targetCount: candidate.targetCount,
    window: candidate.window,
    unitLabel: candidate.unitLabel.trim(),
    methodLabels,
  }
}

/**
 * Parses raw pasted or uploaded text into validated quest drafts.
 * Throws a specific, itemized error on the first problem found rather
 * than failing generically — this is hand-typed or LLM-produced text,
 * not a trusted export, so a vague "invalid data" error isn't good
 * enough here the way it might be elsewhere.
 */
export function parseQuestDrafts(text: string): QuestDraft[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(stripCodeFence(text))
  } catch (err) {
    throw new Error(`Not valid JSON. Original error: ${(err as Error).message}`)
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Expected a JSON array of quest drafts, e.g. [{ "title": ..., ... }].')
  }
  if (parsed.length === 0) {
    throw new Error('That array is empty — nothing to add.')
  }

  return parsed.map((item, index) => validateDraft(item, index))
}
