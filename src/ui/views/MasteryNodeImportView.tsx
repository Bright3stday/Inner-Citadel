import { useRef, useState, type ChangeEvent } from 'react'
import { parseMasteryNodeDrafts, type MasteryNodeDraft } from '../../storage/masteryNodeDraftImport'
import { addMasteryNode } from '../../actions/masteryActions'
import type { Domain, Quest } from '../../model/types'
import type { Apply } from '../../state/useAppState'

type Props = {
  domain: Domain
  quests: Quest[] // this domain's quests, for matching suggestedQuestTitles
  apply: Apply
  onDone: () => void
}

/** Case-insensitive exact match against this domain's real quest
 * titles — contributingQuests in the draft is a suggestion, not an
 * identity, so anything that doesn't match exactly is left unlinked
 * rather than guessed at. */
function matchQuestIds(suggestedTitles: string[], quests: Quest[]): string[] {
  const byTitle = new Map(quests.map((q) => [q.title.trim().toLowerCase(), q.id]))
  return suggestedTitles
    .map((title) => byTitle.get(title.trim().toLowerCase()))
    .filter((id): id is string => id !== undefined)
}

// Paste or upload → parse → review → add, same pattern as
// QuestImportView. Every draft is individually deselectable and its
// quest-title suggestions are matched (not assumed) before anything is
// created — unmatched titles are flagged so linking can be finished by
// hand right after import, same as the prompt itself says.
export function MasteryNodeImportView({ domain, quests, apply, onDone }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [text, setText] = useState('')
  const [drafts, setDrafts] = useState<MasteryNodeDraft[] | null>(null)
  const [selected, setSelected] = useState<boolean[]>([])
  const [error, setError] = useState<string | null>(null)

  function handleTextChange(value: string) {
    setText(value)
    setDrafts(null)
    setError(null)
  }

  async function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    handleTextChange(await file.text())
  }

  function handlePreview() {
    try {
      const parsed = parseMasteryNodeDrafts(text)
      setDrafts(parsed)
      setSelected(parsed.map(() => true))
      setError(null)
    } catch (err) {
      setDrafts(null)
      setError((err as Error).message)
    }
  }

  function handleAddSelected() {
    if (!drafts) return
    drafts.forEach((draft, i) => {
      if (!selected[i]) return
      apply(addMasteryNode, {
        domainId: domain.id,
        title: draft.title,
        criteria: draft.criteria,
        practiceThreshold: draft.practiceThreshold,
        thresholdUnit: draft.thresholdUnit,
        contributingQuestIds: matchQuestIds(draft.suggestedQuestTitles, quests),
      })
    })
    onDone()
  }

  return (
    <div className="quest-import">
      <label>
        Paste mastery node ideas (a JSON array) — or upload a file
        <textarea
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder='[{"title": "...", "criteria": "...", "practiceThreshold": 10, "thresholdUnit": "quest completions", "contributingQuests": []}]'
          rows={6}
        />
      </label>

      <div className="quest-import-actions">
        <button type="button" onClick={() => fileInputRef.current?.click()}>
          Upload file
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFileSelected}
          style={{ display: 'none' }}
        />
        <button type="button" onClick={handlePreview} disabled={text.trim() === ''}>
          Preview
        </button>
        <button type="button" onClick={onDone}>
          Cancel
        </button>
      </div>

      {error && <p className="settings-error">{error}</p>}

      {drafts && (
        <div className="quest-import-review">
          {drafts.map((draft, i) => {
            const matchedIds = matchQuestIds(draft.suggestedQuestTitles, quests)
            const unmatchedCount = draft.suggestedQuestTitles.length - matchedIds.length
            return (
              <label key={i} className="quest-import-row">
                <input
                  type="checkbox"
                  checked={selected[i]}
                  onChange={(e) =>
                    setSelected((prev) => prev.map((v, idx) => (idx === i ? e.target.checked : v)))
                  }
                />
                <span>
                  <strong>{draft.title}</strong> — {draft.practiceThreshold} {draft.thresholdUnit}
                  <br />
                  <span className="settings-hint">
                    {matchedIds.length > 0 ? `linked: ${matchedIds.length} quest(s)` : 'no quests linked yet'}
                    {unmatchedCount > 0 && ` — ${unmatchedCount} suggested title(s) didn't match, link manually after import`}
                  </span>
                </span>
              </label>
            )
          })}
          <button type="button" onClick={handleAddSelected} disabled={!selected.some(Boolean)}>
            Add selected nodes
          </button>
        </div>
      )}
    </div>
  )
}
