import { useState } from 'react'
import { retireQuest } from '../../actions/questActions'
import { archiveDomain } from '../../actions/domainActions'
import { QuestEditorView } from './QuestEditorView'
import type { AppState, Domain, DomainSpire } from '../../model/types'
import type { Apply } from '../../state/useAppState'

type Props = {
  state: AppState
  apply: Apply
  domain: Domain
  spire: DomainSpire
  onBack: () => void
}

export function DomainView({ state, apply, domain, spire, onBack }: Props) {
  const [showAddQuest, setShowAddQuest] = useState(false)
  const quests = state.quests.filter((q) => q.domainId === domain.id && !q.retiredAt)

  function handleArchiveDomain() {
    const confirmed = window.confirm(
      `Archive "${domain.name}"? Its quests and log history stay intact, but it leaves the skyline.`,
    )
    if (!confirmed) return
    apply(archiveDomain, { domainId: domain.id })
    onBack()
  }

  return (
    <div className="view domain-view">
      <button type="button" className="back-link" onClick={onBack}>
        ← Citadel
      </button>

      <h1>{domain.name}</h1>
      <p className="spire-meta">
        {spire.condition} · {spire.heightWeeks}w
      </p>

      {quests.length === 0 && <p className="empty">No quests yet.</p>}
      {quests.map((quest) => (
        <div key={quest.id} className="quest-row">
          <div className="quest-row-header">
            <span className="quest-title">{quest.title}</span>
          </div>
          <p className="settings-hint">
            {quest.targetCount} {quest.unitLabel} / {quest.window}
          </p>
          <button type="button" onClick={() => apply(retireQuest, { questId: quest.id })}>
            Retire
          </button>
        </div>
      ))}

      {showAddQuest ? (
        <QuestEditorView domain={domain} apply={apply} onDone={() => setShowAddQuest(false)} />
      ) : (
        <button type="button" onClick={() => setShowAddQuest(true)}>
          + Add quest
        </button>
      )}

      <button type="button" className="danger-link" onClick={handleArchiveDomain}>
        Archive domain
      </button>
    </div>
  )
}
