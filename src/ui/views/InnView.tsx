import { useState, type FormEvent } from 'react'
import { sendQuestsReduced, sendQuestsResting } from '../../actions/restActions'
import { BUILTIN_RECOVERY_SETS } from '../../core/recoverySets'
import type { Domain, Quest } from '../../model/types'
import type { Apply } from '../../state/useAppState'

type Props = {
  domain: Domain
  quests: Quest[] // this domain's currently-active (not already reduced/resting) quests
  apply: Apply
  onDone: () => void
}

type Mode = 'reduced' | 'resting'

// Manual entry point only — no automatic detection decides this for
// you. You already know today that something needs to change; the
// Inn just gives that a real action instead of a dismissible banner.
export function InnView({ domain, quests, apply, onDone }: Props) {
  const [mode, setMode] = useState<Mode>('reduced')
  const [selected, setSelected] = useState<Set<string>>(new Set(quests.map((q) => q.id)))
  const [reducedTargets, setReducedTargets] = useState<Record<string, number>>(
    Object.fromEntries(quests.map((q) => [q.id, q.targetCount])),
  )
  const [recoverySetId, setRecoverySetId] = useState<string | null>(BUILTIN_RECOVERY_SETS[0]?.id ?? null)
  const [reason, setReason] = useState('')

  function toggle(questId: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(questId)) next.delete(questId)
      else next.add(questId)
      return next
    })
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const questIds = quests.filter((q) => selected.has(q.id)).map((q) => q.id)
    if (questIds.length === 0) return

    if (mode === 'reduced') {
      apply(sendQuestsReduced, {
        domainId: domain.id,
        reductions: questIds.map((questId) => ({
          questId,
          newTarget: Math.max(1, reducedTargets[questId] ?? 1),
        })),
        reason: reason.trim() || null,
      })
    } else {
      apply(sendQuestsResting, {
        domainId: domain.id,
        questIds,
        recoverySetId,
        reason: reason.trim() || null,
      })
    }
    onDone()
  }

  if (quests.length === 0) {
    return (
      <div className="quest-editor inn-view">
        <p className="empty">No active quests to send to the Inn — everything here is already resting or reduced.</p>
        <button type="button" onClick={onDone}>
          Back
        </button>
      </div>
    )
  }

  return (
    <form className="quest-editor inn-view" onSubmit={handleSubmit}>
      <div className="inn-mode-toggle">
        <button type="button" className={mode === 'reduced' ? 'tab-active' : ''} onClick={() => setMode('reduced')}>
          Reduced
        </button>
        <button type="button" className={mode === 'resting' ? 'tab-active' : ''} onClick={() => setMode('resting')}>
          Resting
        </button>
      </div>
      <p className="settings-hint">
        {mode === 'reduced'
          ? "Same quests, smaller targets. Meeting the reduced target counts as meeting target — it's the real target for as long as this lasts."
          : 'Paused entirely, dropped from Today. Optionally add a recovery quest set in their place, which counts as real practice for this domain while it runs.'}
      </p>

      <fieldset className="inn-quest-picker">
        <legend>Quests</legend>
        {quests.map((quest) => (
          <div key={quest.id} className="inn-quest-row">
            <label className="inn-quest-checkbox">
              <input type="checkbox" checked={selected.has(quest.id)} onChange={() => toggle(quest.id)} />
              {quest.title}
            </label>
            {mode === 'reduced' && selected.has(quest.id) && (
              <label className="inn-reduced-target">
                New target
                <input
                  type="number"
                  min={1}
                  value={reducedTargets[quest.id] ?? quest.targetCount}
                  onChange={(e) =>
                    setReducedTargets((prev) => ({ ...prev, [quest.id]: Math.max(1, Number(e.target.value)) }))
                  }
                />
                <span className="settings-hint">
                  was {quest.targetCount} {quest.unitLabel} / {quest.window}
                </span>
              </label>
            )}
          </div>
        ))}
      </fieldset>

      {mode === 'resting' && (
        <label>
          Recovery set
          <select value={recoverySetId ?? ''} onChange={(e) => setRecoverySetId(e.target.value || null)}>
            <option value="">None</option>
            {BUILTIN_RECOVERY_SETS.map((set) => (
              <option key={set.id} value={set.id}>
                {set.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <label>
        Reason (optional)
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. knee injury, travel week"
        />
      </label>

      <div className="quest-editor-actions">
        <button type="submit">Send to the Inn</button>
        <button type="button" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  )
}
