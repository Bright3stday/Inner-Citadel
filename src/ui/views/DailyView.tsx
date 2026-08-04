import { getDailyView, getNeglectPrompts } from '../../core/selectors'
import { todayKey } from '../../core/dates'
import { logContribution } from '../../actions/logActions'
import { QuestRow } from '../components/QuestRow'
import { Forge } from '../components/Forge'
import type { AppState } from '../../model/types'
import type { Apply } from '../../state/useAppState'

type Props = {
  state: AppState
  apply: Apply
}

export function DailyView({ state, apply }: Props) {
  const today = todayKey()
  const daily = getDailyView(state, today)
  const neglected = getNeglectPrompts(state, today)

  function handleLog(questId: string, methodId: string) {
    apply(logContribution, { questId, methodId, forDate: today })
  }

  return (
    <div className="view daily-view">
      <h1>Today</h1>

      <Forge heat={daily.forgeHeat} />

      {neglected.length > 0 && (
        <div className="neglect-prompt">
          {neglected.map((domain) => (
            <p key={domain.id}>
              <strong>{domain.name}</strong> hasn't seen a completed quest in two weeks. Should this goal,
              or its difficulty, change?
            </p>
          ))}
        </div>
      )}

      {daily.domainGroups.length === 0 && <p className="empty">No quests yet.</p>}

      {daily.domainGroups.map((group) => (
        <section key={group.domainId} className="daily-domain-group">
          <h2 className="daily-domain-header">{group.domainName}</h2>
          {group.quests.map((questView) => (
            <QuestRow
              key={questView.quest.id}
              view={questView}
              onLog={(methodId) => handleLog(questView.quest.id, methodId)}
            />
          ))}
        </section>
      ))}
    </div>
  )
}
