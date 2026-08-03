import { useState, type FormEvent } from 'react'
import { addQuest } from '../../actions/questActions'
import type { Domain } from '../../model/types'
import type { Apply } from '../../state/useAppState'

type Props = {
  domain: Domain
  apply: Apply
  onDone: () => void
}

// Add only — no in-place editing yet. Retiring a miscalibrated quest and
// adding its replacement is already the workflow spec §6 describes for
// weekly planning, so this covers the case that matters first.
export function QuestEditorView({ domain, apply, onDone }: Props) {
  const [title, setTitle] = useState('')
  const [targetCount, setTargetCount] = useState(3)
  const [window, setWindow] = useState<'day' | 'week'>('week')
  const [unitLabel, setUnitLabel] = useState('times')
  const [methodLabels, setMethodLabels] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!title.trim()) return

    const methods = methodLabels
      .split(',')
      .map((label) => label.trim())
      .filter(Boolean)

    apply(addQuest, {
      domainId: domain.id,
      title: title.trim(),
      targetCount,
      window,
      unitLabel: unitLabel.trim() || 'times',
      methodLabels: methods,
    })
    onDone()
  }

  return (
    <form className="quest-editor" onSubmit={handleSubmit}>
      <label>
        Quest
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Go for an evening walk"
          autoFocus
        />
      </label>

      <div className="quest-editor-row">
        <label>
          Target
          <input
            type="number"
            min={1}
            value={targetCount}
            onChange={(e) => setTargetCount(Math.max(1, Number(e.target.value)))}
          />
        </label>
        <label>
          Per
          <select value={window} onChange={(e) => setWindow(e.target.value as 'day' | 'week')}>
            <option value="week">week</option>
            <option value="day">day</option>
          </select>
        </label>
        <label>
          Unit
          <input
            type="text"
            value={unitLabel}
            onChange={(e) => setUnitLabel(e.target.value)}
            placeholder="times"
          />
        </label>
      </div>

      <label>
        Logging methods (comma-separated — leave blank for a single "Logged" method)
        <input
          type="text"
          value={methodLabels}
          onChange={(e) => setMethodLabels(e.target.value)}
          placeholder="Push-ups, Squats"
        />
      </label>

      <div className="quest-editor-actions">
        <button type="submit">Add quest</button>
        <button type="button" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  )
}
