import { getQuestMonthlyBreakdown, getRecentMonths } from '../../core/selectors'
import type { AppState, Quest } from '../../model/types'

type Props = {
  state: AppState
  today: string
}

const MONTHLY_LOOKBACK = 6

function shortMonth(monthLabel: string): string {
  const [y, m] = monthLabel.split('-').map(Number)
  const month = new Date(2000, m - 1, 1).toLocaleString('en', { month: 'short' })
  return `${month} '${String(y).slice(2)}`
}

// A quest's under/met/over record, month by month — this is the actual
// diagnostic view UAT asked for: is a specific quest chronically short
// (recalibrate or retire it), chronically over (raise the target, or
// it's basically mastered), or genuinely on track. Scoped at the
// quest level, aggregating its methods together (they're
// interchangeable toward the same target by design) — per-method
// detail is still available by expanding a quest's log entries in the
// weekly review or DomainView's own History.
function QuestMonthlyRow({ state, quest, today }: { state: AppState; quest: Quest; today: string }) {
  const months = getQuestMonthlyBreakdown(state, quest, today, MONTHLY_LOOKBACK)
  return (
    <tr>
      <td className="trend-domain-name">{quest.title}</td>
      {months.map((m) => {
        // "Hit" = met OR exceeded — exceeding the target isn't a miss,
        // it's the strongest possible signal something's on track (or
        // ready for a higher target). Only `under` should pull the
        // rate down; `over` is still visible separately as its own
        // count via the breakdown, just not penalized here.
        const hit = m.met + m.over
        const rate = m.total > 0 ? hit / m.total : null
        const cellClass = rate === null ? 'trend-cell-plain' : rate >= 0.66 ? 'trend-cell-good' : rate < 0.34 ? 'trend-cell-struggling' : 'trend-cell-mixed'
        return (
          <td key={m.monthLabel} className={`trend-cell ${cellClass}`}>
            {m.total > 0 ? `${hit}/${m.total}` : '–'}
          </td>
        )
      })}
    </tr>
  )
}

export function TrendsView({ state, today }: Props) {
  const domains = state.domains.filter((d) => !d.archivedAt).sort((a, b) => a.order - b.order)
  const monthColumns = getRecentMonths(today, MONTHLY_LOOKBACK)

  if (domains.length === 0) {
    return <p className="empty">No domains yet.</p>
  }

  return (
    <section className="trends-view">
      <h2>Monthly, last {MONTHLY_LOOKBACK} months</h2>
      <p className="settings-hint">
        Periods hitting target out of periods judged, per quest — e.g. "18/23" means 18 of 23 judged
        periods (days for a daily quest, weeks for a weekly quest) met or exceeded target that month.
        Bold: mostly on track. Muted italic: mostly short — worth recalibrating or retiring.
      </p>

      {domains.map((domain) => {
        const quests = state.quests.filter((q) => q.domainId === domain.id && !q.retiredAt)
        if (quests.length === 0) return null
        return (
          <div key={domain.id} className="trends-domain-block">
            <h3>{domain.name}</h3>
            <div className="trend-table-wrap">
              <table className="trend-table">
                <thead>
                  <tr>
                    <th>Quest</th>
                    {monthColumns.map((label) => (
                      <th key={label}>{shortMonth(label)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {quests.map((quest) => (
                    <QuestMonthlyRow key={quest.id} state={state} quest={quest} today={today} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </section>
  )
}
