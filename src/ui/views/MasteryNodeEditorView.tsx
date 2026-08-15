import { useState, type FormEvent } from 'react'
import { addMasteryNode, editMasteryNode } from '../../actions/masteryActions'
import type { Domain, MasteryNode, Quest, ThresholdUnit } from '../../model/types'
import type { Apply } from '../../state/useAppState'

type Props = {
  domain: Domain
  quests: Quest[] // this domain's quests, offered as contributing-quest choices
  apply: Apply
  onDone: () => void
  node?: MasteryNode // present → edit this node; absent → add a new one
}

// Add and edit share one form, same pattern as QuestEditorView. The
// contributing-quest picker mirrors the Inn's checkbox list — you
// always pick explicitly, the app never infers this.
export function MasteryNodeEditorView({ domain, quests, apply, onDone, node }: Props) {
  const isEditing = node !== undefined

  const [title, setTitle] = useState(node?.title ?? '')
  const [criteria, setCriteria] = useState(node?.criteria ?? '')
  const [practiceThreshold, setPracticeThreshold] = useState(node?.practiceThreshold ?? 10)
  const [thresholdUnit, setThresholdUnit] = useState<ThresholdUnit>(
    node?.thresholdUnit ?? 'quest completions',
  )
  const [contributingQuestIds, setContributingQuestIds] = useState<Set<string>>(
    new Set(node?.contributingQuestIds ?? []),
  )

  function toggle(questId: string) {
    setContributingQuestIds((prev) => {
      const next = new Set(prev)
      if (next.has(questId)) next.delete(questId)
      else next.add(questId)
      return next
    })
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!title.trim() || !criteria.trim()) return

    const payload = {
      title: title.trim(),
      criteria: criteria.trim(),
      practiceThreshold: Math.max(1, practiceThreshold),
      thresholdUnit,
      contributingQuestIds: Array.from(contributingQuestIds),
    }

    if (isEditing) {
      apply(editMasteryNode, { nodeId: node.id, ...payload })
    } else {
      apply(addMasteryNode, { domainId: domain.id, ...payload })
    }
    onDone()
  }

  return (
    <form className="quest-editor mastery-node-editor" onSubmit={handleSubmit}>
      <label>
        Node title (the capability, not the activity)
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Can hold a plank without form breaking down"
          autoFocus
        />
      </label>

      <label>
        Criteria (how you'll know you've genuinely met it — never parsed or judged by the app)
        <textarea
          value={criteria}
          onChange={(e) => setCriteria(e.target.value)}
          placeholder="I can hold 60s with a straight back, no shaking, on demand"
          rows={3}
        />
      </label>

      <div className="quest-editor-row">
        <label>
          Practice threshold
          <input
            type="number"
            min={1}
            value={practiceThreshold}
            onChange={(e) => setPracticeThreshold(Math.max(1, Number(e.target.value)))}
          />
        </label>
        <label>
          Counted in
          <select value={thresholdUnit} onChange={(e) => setThresholdUnit(e.target.value as ThresholdUnit)}>
            <option value="quest completions">quest completions</option>
            <option value="weeks meeting target">weeks meeting target</option>
          </select>
        </label>
      </div>

      <fieldset className="inn-quest-picker">
        <legend>Contributing quests</legend>
        {quests.length === 0 && <p className="settings-hint">No quests in this domain yet.</p>}
        {quests.map((quest) => (
          <label key={quest.id} className="inn-quest-checkbox">
            <input
              type="checkbox"
              checked={contributingQuestIds.has(quest.id)}
              onChange={() => toggle(quest.id)}
            />
            {quest.title}
          </label>
        ))}
      </fieldset>

      <div className="quest-editor-actions">
        <button type="submit">{isEditing ? 'Save changes' : 'Add node'}</button>
        <button type="button" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  )
}
