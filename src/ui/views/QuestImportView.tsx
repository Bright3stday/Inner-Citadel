import { useRef, useState, type ChangeEvent } from 'react'
import { parseQuestDrafts, type QuestDraft } from '../../storage/questDraftImport'
import { addQuest } from '../../actions/questActions'
import type { Domain } from '../../model/types'
import type { Apply } from '../../state/useAppState'

type Props = {
  domain: Domain
  apply: Apply
  onDone: () => void
}

// Paste or upload → parse → review → add. Nothing gets created until
// "Add selected quests" — every draft is individually deselectable, so
// this never adds something you didn't look at first.
export function QuestImportView({ domain, apply, onDone }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [text, setText] = useState('')
  const [drafts, setDrafts] = useState<QuestDraft[] | null>(null)
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
      const parsed = parseQuestDrafts(text)
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
      apply(addQuest, {
        domainId: domain.id,
        title: draft.title,
        targetCount: draft.targetCount,
        window: draft.window,
        unitLabel: draft.unitLabel,
        methodLabels: draft.methodLabels,
      })
    })
    onDone()
  }

  return (
    <div className="quest-import">
      <label>
        Paste quest ideas (a JSON array) — or upload a file
        <textarea
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder='[{"title": "...", "targetCount": 3, "window": "week", "unitLabel": "sessions", "methodLabels": []}]'
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
          {drafts.map((draft, i) => (
            <label key={i} className="quest-import-row">
              <input
                type="checkbox"
                checked={selected[i]}
                onChange={(e) =>
                  setSelected((prev) => prev.map((v, idx) => (idx === i ? e.target.checked : v)))
                }
              />
              <span>
                <strong>{draft.title}</strong> — {draft.targetCount} {draft.unitLabel} /{' '}
                {draft.window}
                {draft.methodLabels.length > 0 && <> ({draft.methodLabels.join(', ')})</>}
              </span>
            </label>
          ))}
          <button type="button" onClick={handleAddSelected} disabled={!selected.some(Boolean)}>
            Add selected quests
          </button>
        </div>
      )}
    </div>
  )
}
