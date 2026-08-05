import { useState, type FormEvent } from 'react'
import { addQuest, editQuest } from '../../actions/questActions'
import type { Domain, Quest } from '../../model/types'
import type { Apply } from '../../state/useAppState'

type Props = {
  domain: Domain
  apply: Apply
  onDone: () => void
  quest?: Quest // present → edit this quest; absent → add a new one
}

// Add and edit share one form — the fields are identical, only which
// action fires on submit differs. Retiring a miscalibrated quest and
// adding its replacement still works too (spec §6's weekly-planning
// workflow), this just covers the case where you want to fix a target
// or add a method without losing the quest's log history.
export function QuestEditorView({ domain, apply, onDone, quest }: Props) {
  const isEditing = quest !== undefined

  const [title, setTitle] = useState(quest?.title ?? '')
  const [targetCount, setTargetCount] = useState(quest?.targetCount ?? 3)
  const [window, setWindow] = useState<'day' | 'week'>(quest?.window ?? 'week')
  const [unitLabel, setUnitLabel] = useState(quest?.unitLabel ?? 'times')
  const [methodLabels, setMethodLabels] = useState(
    quest ? quest.methods.map((m) => m.label).join(', ') : '',
  )

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!title.trim()) return

    const methods = methodLabels
      .split(',')
      .map((label) => label.trim())
      .filter(Boolean)

    if (isEditing) {
      apply(editQuest, {
        questId: quest.id,
        title: title.trim(),
        targetCount,
        window,
        unitLabel: unitLabel.trim() || 'times',
        methodLabels: methods,
      })
    } else {
      apply(addQuest, {
        domainId: domain.id,
        title: title.trim(),
        targetCount,
        window,
        unitLabel: unitLabel.trim() || 'times',
        methodLabels: methods,
      })
    }
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
        <button type="submit">{isEditing ? 'Save changes' : 'Add quest'}</button>
        <button type="button" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  )
}
