// Parses and validates the output of the mastery node authoring prompt
// (ui/masteryNodePrompt.ts) — mirrors storage/questDraftImport.ts
// exactly, same reasoning: this shape IS the contract between the
// prompt and this app.
//
// The prompt's contributingQuests field is quest TITLES, not IDs, and
// is explicitly a suggestion ("I confirm the actual linking in the app
// after import" — see the prompt's own closing line). This module
// keeps that field as suggestedQuestTitles; matching it against the
// domain's real quests, and letting the person correct any miss,
// happens in ui/views/MasteryNodeImportView.tsx, not here.

import type { ThresholdUnit } from '../model/types'

export type MasteryNodeDraft = {
  title: string
  criteria: string
  practiceThreshold: number
  thresholdUnit: ThresholdUnit
  suggestedQuestTitles: string[]
}

function stripCodeFence(text: string): string {
  const trimmed = text.trim()
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  return match ? match[1] : trimmed
}

function validateDraft(data: unknown, index: number): MasteryNodeDraft {
  if (typeof data !== 'object' || data === null) {
    throw new Error(`Item ${index + 1} is not an object.`)
  }
  const candidate = data as Record<string, unknown>
  const label = typeof candidate.title === 'string' ? `"${candidate.title}"` : `item ${index + 1}`

  if (typeof candidate.title !== 'string' || candidate.title.trim() === '') {
    throw new Error(`Item ${index + 1} is missing a valid "title".`)
  }
  if (typeof candidate.criteria !== 'string' || candidate.criteria.trim() === '') {
    throw new Error(`${label} is missing a valid "criteria".`)
  }
  if (typeof candidate.practiceThreshold !== 'number' || candidate.practiceThreshold <= 0) {
    throw new Error(`${label} has an invalid "practiceThreshold" — expected a positive number.`)
  }
  if (candidate.thresholdUnit !== 'quest completions' && candidate.thresholdUnit !== 'weeks meeting target') {
    throw new Error(`${label} has an invalid "thresholdUnit" — expected "quest completions" or "weeks meeting target".`)
  }

  const suggestedQuestTitles = Array.isArray(candidate.contributingQuests)
    ? candidate.contributingQuests.filter((t): t is string => typeof t === 'string' && t.trim() !== '')
    : []

  return {
    title: candidate.title.trim(),
    criteria: candidate.criteria.trim(),
    practiceThreshold: candidate.practiceThreshold,
    thresholdUnit: candidate.thresholdUnit,
    suggestedQuestTitles,
  }
}

/** Parses raw pasted or uploaded text into validated mastery node
 * drafts. Throws a specific, itemized error on the first problem found
 * — this is hand-typed or LLM-produced text, not a trusted export. */
export function parseMasteryNodeDrafts(text: string): MasteryNodeDraft[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(stripCodeFence(text))
  } catch (err) {
    throw new Error(`Not valid JSON. Original error: ${(err as Error).message}`)
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Expected a JSON array of mastery node drafts, e.g. [{ "title": ..., ... }].')
  }
  if (parsed.length === 0) {
    throw new Error('That array is empty — nothing to add.')
  }

  return parsed.map((item, index) => validateDraft(item, index))
}
