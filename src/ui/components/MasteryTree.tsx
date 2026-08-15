import { useState } from 'react'
import type { MasteryNodeView } from '../../core/mastery'
import { NODE_UNLOCK_COST } from '../../core/rules'
import type { GrowthPoints, MasteryNode } from '../../model/types'

type Props = {
  nodeViews: MasteryNodeView[]
  gp: GrowthPoints
  onUnlock: (node: MasteryNode) => void
  onEdit: (node: MasteryNode) => void
  onDelete: (node: MasteryNode) => void
}

// What to show before you've tapped anything yourself: whatever most
// needs a look. An eligible node is a decision waiting on you, so it
// outranks a locked node still quietly accumulating; failing that, the
// nearest locked node (the thing actually in motion); failing that,
// the most recently unlocked one, since that's the freshest thing to
// look back at.
function defaultSelection(nodeViews: MasteryNodeView[]): string | null {
  const eligible = nodeViews.find((v) => v.state === 'eligible')
  if (eligible) return eligible.node.id
  const locked = nodeViews.find((v) => v.state === 'locked')
  if (locked) return locked.node.id
  const lastUnlocked = [...nodeViews].reverse().find((v) => v.state === 'unlocked')
  if (lastUnlocked) return lastUnlocked.node.id
  return nodeViews[0]?.node.id ?? null
}

// A compact horizontal path — the "Civilization-style tech tree branch"
// language from the decision log, made literal — instead of a fully
// expanded vertical stack of every node's full detail at once. Still a
// flat ordered list underneath (no dependencies/topology — see
// docs/decision-log-and-roadmap.md); this only changes how much of it
// is on screen at a time. Tapping a marker selects it; only the
// selected node's full detail renders below the track.
export function MasteryTree({ nodeViews, gp, onUnlock, onEdit, onDelete }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  // Separate from selection on purpose: tapping "Claim" doesn't unlock
  // anything by itself, it opens a second, distinct step that re-shows
  // the node's own criteria and asks you to affirm it — not a generic
  // "are you sure?", a real "is this actually true yet?" moment. See
  // docs/decision-log-and-roadmap.md — an earlier version fired on one
  // tap plus a native browser confirm(), which read as a purchase
  // rather than a claim.
  const [confirmingNodeId, setConfirmingNodeId] = useState<string | null>(null)
  const activeId = selectedId ?? defaultSelection(nodeViews)
  const selected = nodeViews.find((view) => view.node.id === activeId) ?? null

  if (nodeViews.length === 0) {
    return <p className="empty">No mastery nodes yet.</p>
  }

  function selectNode(nodeId: string) {
    setSelectedId(nodeId)
    setConfirmingNodeId(null)
  }

  return (
    <div className="mastery-tree">
      <div className="mastery-tree-track">
        {nodeViews.map((view, index) => (
          <button
            key={view.node.id}
            type="button"
            className={`mastery-node-marker mastery-node-marker-${view.state}${
              view.node.id === activeId ? ' mastery-node-marker-active' : ''
            }`}
            onClick={() => selectNode(view.node.id)}
            title={view.node.title}
          >
            {view.state === 'unlocked' ? '✓' : index + 1}
          </button>
        ))}
      </div>

      {selected && (
        <div className={`mastery-node mastery-node-${selected.state}`}>
          <div className="quest-row-header">
            <span className="quest-title">{selected.node.title}</span>
            <span className="quest-status-tag">{selected.state}</span>
          </div>
          <p className="settings-hint">{selected.node.criteria}</p>
          <p className="settings-hint mastery-node-progress">
            {selected.state === 'unlocked' ? (
              <>
                {selected.node.practiceThreshold} / {selected.node.practiceThreshold}{' '}
                {selected.node.thresholdUnit} ✓
              </>
            ) : (
              <>
                {selected.practiceCount} / {selected.node.practiceThreshold} {selected.node.thresholdUnit}
              </>
            )}
            {selected.node.contributingQuestIds.length === 0 && ' — no quests linked'}
          </p>

          {confirmingNodeId === selected.node.id ? (
            <div className="mastery-claim">
              <p className="mastery-claim-prompt">You're claiming:</p>
              <p className="mastery-claim-criteria">"{selected.node.criteria}"</p>
              <div className="quest-editor-actions">
                <button
                  type="button"
                  onClick={() => {
                    onUnlock(selected.node)
                    setConfirmingNodeId(null)
                  }}
                >
                  Confirm &amp; unlock (−{NODE_UNLOCK_COST} GP)
                </button>
                <button type="button" onClick={() => setConfirmingNodeId(null)}>
                  Not yet
                </button>
              </div>
            </div>
          ) : (
            <div className="quest-editor-actions">
              {selected.state === 'eligible' && gp.balance >= NODE_UNLOCK_COST && (
                <button type="button" onClick={() => setConfirmingNodeId(selected.node.id)}>
                  Claim
                </button>
              )}
              {selected.state === 'eligible' && gp.balance < NODE_UNLOCK_COST && (
                <span className="settings-hint">
                  Eligible — needs {NODE_UNLOCK_COST - gp.balance} more GP to unlock
                </span>
              )}
              {selected.state !== 'unlocked' && (
                <>
                  <button type="button" onClick={() => onEdit(selected.node)}>
                    Edit
                  </button>
                  <button type="button" onClick={() => onDelete(selected.node)}>
                    Delete
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
