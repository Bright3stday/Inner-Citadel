import { useState, type FormEvent } from 'react'
import { retireQuest } from '../../actions/questActions'
import { archiveDomain, renameDomain } from '../../actions/domainActions'
import { deleteMasteryNode, unlockMasteryNode } from '../../actions/masteryActions'
import { getDomainMasteryNodes, getGrowthPoints, getQuestLogHistory } from '../../core/selectors'
import { todayKey } from '../../core/dates'
import { QuestEditorView } from './QuestEditorView'
import { QuestImportView } from './QuestImportView'
import { MasteryNodeEditorView } from './MasteryNodeEditorView'
import { MasteryNodeImportView } from './MasteryNodeImportView'
import { MasteryTree } from '../components/MasteryTree'
import { CopyTextButton } from '../components/CopyTextButton'
import { LogEntryList } from '../components/LogEntryList'
import { QUEST_GENERATOR_PROMPT } from '../questGeneratorPrompt'
import { buildMasteryNodePrompt, buildRecalibratePrompt, buildStrategiesPrompt } from '../domainPromptBuilders'
import type { AppState, Domain, DomainSpire, MasteryNode, Quest } from '../../model/types'
import type { Apply } from '../../state/useAppState'

type Props = {
  state: AppState
  apply: Apply
  domain: Domain
  spire: DomainSpire
  onBack: () => void
}

type Mode = 'none' | 'add' | 'edit' | 'import'
type NodeMode = 'none' | 'add' | 'edit' | 'import'

export function DomainView({ state, apply, domain, spire, onBack }: Props) {
  const [mode, setMode] = useState<Mode>('none')
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null)
  const [nodeMode, setNodeMode] = useState<NodeMode>('none')
  const [editingNode, setEditingNode] = useState<MasteryNode | null>(null)
  const [renamingDomain, setRenamingDomain] = useState(false)
  const [domainNameDraft, setDomainNameDraft] = useState(domain.name)
  const [historyQuestId, setHistoryQuestId] = useState<string | null>(null)
  const quests = state.quests.filter((q) => q.domainId === domain.id && !q.retiredAt)
  const today = todayKey()
  const nodeViews = getDomainMasteryNodes(state, domain.id, today)
  const gp = getGrowthPoints(state)

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

  function handleStartEditNode(node: MasteryNode) {
    setEditingNode(node)
    setNodeMode('edit')
  }

  function handleDoneEditingNode() {
    setEditingNode(null)
    setNodeMode('none')
  }

  // Confirmation lives in MasteryTree itself now — a two-step in-app
  // "Claim" -> re-affirm criteria -> "Confirm & unlock" flow, not a
  // native browser confirm(). This is a straight pass-through.
  function handleUnlock(node: MasteryNode) {
    apply(unlockMasteryNode, { nodeId: node.id })
  }

  function handleDeleteNode(node: MasteryNode) {
    const confirmed = window.confirm(`Delete node "${node.title}"? It hasn't been unlocked, so there's no record to lose.`)
    if (!confirmed) return
    apply(deleteMasteryNode, { nodeId: node.id })
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
        {spire.condition} · {spire.heightTier} node{spire.heightTier === 1 ? '' : 's'}
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

      {mode === 'add' && <QuestEditorView domain={domain} apply={apply} onDone={() => setMode('none')} />}
      {mode === 'edit' && editingQuest && (
        <QuestEditorView domain={domain} apply={apply} quest={editingQuest} onDone={handleDoneEditing} />
      )}
      {mode === 'import' && (
        <QuestImportView domain={domain} apply={apply} onDone={() => setMode('none')} />
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
          <p className="settings-hint">Paste into any capable AI. Copy-paste only — no AI calls in-app.</p>
        </>
      )}

      <section className="mastery-section">
        <div className="mastery-header-row">
          <h2>Mastery nodes</h2>
          <span className="settings-hint">
            Growth Points: {gp.balance} (earned {gp.earned}, spent {gp.spent})
          </span>
        </div>

        <MasteryTree
          nodeViews={nodeViews}
          gp={gp}
          onUnlock={handleUnlock}
          onEdit={handleStartEditNode}
          onDelete={handleDeleteNode}
        />

        {nodeMode === 'add' && (
          <MasteryNodeEditorView domain={domain} quests={quests} apply={apply} onDone={() => setNodeMode('none')} />
        )}
        {nodeMode === 'edit' && editingNode && (
          <MasteryNodeEditorView
            domain={domain}
            quests={quests}
            apply={apply}
            node={editingNode}
            onDone={handleDoneEditingNode}
          />
        )}
        {nodeMode === 'import' && (
          <MasteryNodeImportView domain={domain} quests={quests} apply={apply} onDone={() => setNodeMode('none')} />
        )}
        {nodeMode === 'none' && (
          <>
            <div className="quest-editor-actions">
              <button type="button" onClick={() => setNodeMode('add')}>
                + Add node
              </button>
              <button type="button" onClick={() => setNodeMode('import')}>
                + Import node ideas
              </button>
            </div>
            <div className="quest-editor-actions">
              <CopyTextButton label="Copy mastery node prompt" getText={() => buildMasteryNodePrompt(domain, quests)} />
            </div>
            <p className="settings-hint">Paste into any capable AI. Copy-paste only — no AI calls in-app.</p>
          </>
        )}
      </section>

      <button type="button" className="danger-link" onClick={handleArchiveDomain}>
        Archive domain
      </button>
    </div>
  )
}
