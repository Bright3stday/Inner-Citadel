import { useState } from 'react'
import { retireQuest } from '../../actions/questActions'
import { archiveDomain } from '../../actions/domainActions'
import { QuestEditorView } from './QuestEditorView'
import { QuestImportView } from './QuestImportView'
import type { AppState, Domain, DomainSpire } from '../../model/types'
import type { Apply } from '../../state/useAppState'

type Props = {
  state: AppState
  apply: Apply
  domain: Domain
  spire: DomainSpire
  onBack: () => void
}

type Mode = 'none' | 'add' | 'import'

export function DomainView({ state, apply, domain, spire, onBack }: Props) {
  const [mode, setMode] = useState<Mode>('none')
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

      {mode === 'add' && (
        <QuestEditorView domain={domain} apply={apply} onDone={() => setMode('none')} />
      )}
      {mode === 'import' && (
        <QuestImportView domain={domain} apply={apply} onDone={() => setMode('none')} />
      )}
      {mode === 'none' && (
        <div className="quest-editor-actions">
          <button type="button" onClick={() => setMode('add')}>
            + Add quest
          </button>
          <button type="button" onClick={() => setMode('import')}>
            + Import quest ideas
          </button>
        </div>
      )}

      <button type="button" className="danger-link" onClick={handleArchiveDomain}>
        Archive domain
      </button>
    </div>
  )
}
