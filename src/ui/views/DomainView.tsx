import { useState, type FormEvent } from 'react'
import { retireQuest } from '../../actions/questActions'
import { archiveDomain, renameDomain } from '../../actions/domainActions'
import { returnFromInn } from '../../actions/restActions'
import { getQuestLogHistory, getActiveRestRecords } from '../../core/selectors'
import { QuestEditorView } from './QuestEditorView'
import { QuestImportView } from './QuestImportView'
import { InnView } from './InnView'
import { CopyTextButton } from '../components/CopyTextButton'
import { LogEntryList } from '../components/LogEntryList'
import { QUEST_GENERATOR_PROMPT } from '../questGeneratorPrompt'
import { buildRecalibratePrompt, buildStrategiesPrompt } from '../domainPromptBuilders'
import type { AppState, Domain, DomainSpire, Quest } from '../../model/types'
import type { Apply } from '../../state/useAppState'

type Props = {
  state: AppState
  apply: Apply
  domain: Domain
  spire: DomainSpire
  onBack: () => void
}

type Mode = 'none' | 'add' | 'edit' | 'import' | 'inn'

export function DomainView({ state, apply, domain, spire, onBack }: Props) {
  const [mode, setMode] = useState<Mode>('none')
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null)
  const [renamingDomain, setRenamingDomain] = useState(false)
  const [domainNameDraft, setDomainNameDraft] = useState(domain.name)
  const [historyQuestId, setHistoryQuestId] = useState<string | null>(null)
  const quests = state.quests.filter((q) => q.domainId === domain.id && !q.retiredAt)
  const restRecords = getActiveRestRecords(state, domain.id)
  const questTitle = (questId: string) => state.quests.find((q) => q.id === questId)?.title ?? '(deleted quest)'

  function handleArchiveDomain() {
    const confirmed = window.confirm(
      `Archive "${domain.name}"? Its quests and log history stay intact, but it leaves the skyline.`,
    )
    if (!confirmed) return
    apply(archiveDomain, { domainId: domain.id })
    onBack()
  }

  function handleStartEditQuest(quest: Quest) {
    setEditingQuest(quest)
    setMode('edit')
  }

  function handleDoneEditing() {
    setEditingQuest(null)
    setMode('none')
  }

  function handleStartRename() {
    setDomainNameDraft(domain.name)
    setRenamingDomain(true)
  }

  function handleSubmitRename(event: FormEvent) {
    event.preventDefault()
    if (!domainNameDraft.trim()) return
    apply(renameDomain, { domainId: domain.id, name: domainNameDraft.trim() })
    setRenamingDomain(false)
  }

  return (
    <div className="view domain-view">
      <button type="button" className="back-link" onClick={onBack}>
        ← Citadel
      </button>

      {renamingDomain ? (
        <form className="new-domain-form" onSubmit={handleSubmitRename}>
          <input
            type="text"
            value={domainNameDraft}
            onChange={(e) => setDomainNameDraft(e.target.value)}
            autoFocus
          />
          <button type="submit">Save</button>
          <button type="button" onClick={() => setRenamingDomain(false)}>
            Cancel
          </button>
        </form>
      ) : (
        <div className="domain-header-row">
          <h1>{domain.name}</h1>
          <button type="button" onClick={handleStartRename}>
            Rename
          </button>
        </div>
      )}

      <p className="spire-meta">
        {spire.condition} · {spire.heightWeeks}w
      </p>

      {quests.length === 0 && <p className="empty">No quests yet.</p>}
      {quests.map((quest) => (
        <div key={quest.id} className="quest-row">
          <div className="quest-row-header">
            <span className="quest-title">{quest.title}</span>
            {quest.restState !== 'active' && <span className="quest-status-tag">{quest.restState}</span>}
            {quest.isRecoveryQuest && <span className="quest-status-tag">recovery</span>}
          </div>
          <p className="settings-hint">
            {quest.targetCount} {quest.unitLabel} / {quest.window}
          </p>
          <div className="quest-editor-actions">
            <button type="button" onClick={() => handleStartEditQuest(quest)}>
              Edit
            </button>
            <button type="button" onClick={() => apply(retireQuest, { questId: quest.id })}>
              Retire
            </button>
            <button
              type="button"
              onClick={() => setHistoryQuestId((id) => (id === quest.id ? null : quest.id))}
            >
              {historyQuestId === quest.id ? 'Hide history' : 'History'}
            </button>
          </div>
          {historyQuestId === quest.id && (
            <div className="quest-history">
              <LogEntryList quest={quest} entries={getQuestLogHistory(state, quest.id)} />
            </div>
          )}
        </div>
      ))}

      {restRecords.length > 0 && (
        <div className="inn-records">
          <h2>At the Inn</h2>
          {restRecords.map((record) => (
            <div key={record.id} className="inn-record">
              <p className="settings-hint">
                {record.mode} since {record.startedAt.slice(0, 10)}
                {record.reason ? ` · ${record.reason}` : ''}
              </p>
              <p className="settings-hint">
                {record.questIds.map(questTitle).join(', ')}
                {record.recoveryQuestIds.length > 0 &&
                  ` — recovery: ${record.recoveryQuestIds.map(questTitle).join(', ')}`}
              </p>
              <button type="button" onClick={() => apply(returnFromInn, { restRecordId: record.id })}>
                Return from Inn
              </button>
            </div>
          ))}
        </div>
      )}

      {mode === 'add' && <QuestEditorView domain={domain} apply={apply} onDone={() => setMode('none')} />}
      {mode === 'edit' && editingQuest && (
        <QuestEditorView domain={domain} apply={apply} quest={editingQuest} onDone={handleDoneEditing} />
      )}
      {mode === 'import' && (
        <QuestImportView domain={domain} apply={apply} onDone={() => setMode('none')} />
      )}
      {mode === 'inn' && (
        <InnView
          domain={domain}
          quests={quests.filter((q) => q.restState === 'active' && !q.isRecoveryQuest)}
          apply={apply}
          onDone={() => setMode('none')}
        />
      )}
      {mode === 'none' && (
        <>
          <div className="quest-editor-actions">
            <button type="button" onClick={() => setMode('add')}>
              + Add quest
            </button>
            <button type="button" onClick={() => setMode('import')}>
              + Import quest ideas
            </button>
            <button type="button" onClick={() => setMode('inn')}>
              Send to the Inn
            </button>
          </div>

          <div className="quest-editor-actions">
            <CopyTextButton label="Copy quest prompt" getText={() => QUEST_GENERATOR_PROMPT} />
            {quests.length > 0 && (
              <>
                <CopyTextButton
                  label="Copy recalibrate prompt"
                  getText={() => buildRecalibratePrompt(state, domain)}
                />
                <CopyTextButton
                  label="Copy strategies prompt"
                  getText={() => buildStrategiesPrompt(domain, quests)}
                />
              </>
            )}
          </div>
          <p className="settings-hint">
            Paste any of these into any capable AI. "Copy quest prompt" interviews you toward new
            quests — bring the JSON back via "Import quest ideas." The other two work directly from
            your quests as they stand now: one for recalibrating targets against real performance,
            one for practical strategies to stay consistent. No AI calls happen inside this app.
          </p>
        </>
      )}

      <button type="button" className="danger-link" onClick={handleArchiveDomain}>
        Archive domain
      </button>
    </div>
  )
}
