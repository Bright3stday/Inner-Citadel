import { useState } from 'react'
import { LogEntryList } from './LogEntryList'
import type { WeeklyReview } from '../../core/selectors'
import type { QuestDay } from '../../core/tally'

type Props = {
  review: WeeklyReview
}

const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

function formatRange(startKey: string, endKey: string): string {
  const fmt = (key: string) => {
    const [, m, d] = key.split('-').map(Number)
    const month = new Date(2000, m - 1, 1).toLocaleString('en', { month: 'short' })
    return `${month} ${d}`
  }
  return `${fmt(startKey)} – ${fmt(endKey)}`
}

// Day-window quests get a real under/met/over per day (there's a real
// daily target). Week-window quests only ever show a plain count —
// there's no real daily target to judge against, so this doesn't
// invent one; the week's own current/target above is the real signal
// for those. A day covered by an Inn stay overrides either case —
// shown as rested, not as a miss, so a rested stretch doesn't render
// identically to a neglected one. Either way this is the "which days
// did I actually log, and how much" picture the met/unmet marker
// alone can't show.
function QuestDayGrid({ days }: { days: QuestDay[] }) {
  return (
    <div className="quest-day-grid">
      {days.map((d, i) => (
        <div key={d.day} className={`quest-day-cell quest-day-${d.level ?? 'plain'}`}>
          <span className="quest-day-label">{DAY_LABELS[i]}</span>
          <span className="quest-day-count">{d.level === 'rested' ? '·' : d.count}</span>
        </div>
      ))}
    </div>
  )
}

// One week's review: per-domain, per-quest met/unmet plus the real
// counted quantity (not just the marker — a 0/3 week and a 2/3 week
// used to look identical), each quest expandable to its underlying log
// entries for that week. Used both for "This Week" and, fed an earlier
// week, the Trends pager.
export function WeeklyReviewGrid({ review }: Props) {
  const [expandedQuestId, setExpandedQuestId] = useState<string | null>(null)

  if (!review.hasHistory) {
    return (
      <p className="empty">
        Nothing to review yet — this fills in after your first full Monday–Sunday week.
      </p>
    )
  }

  return (
    <section className="weekly-review-past">
      <p className="weekly-review-range">
        {formatRange(review.week.startKey, review.week.endKey)} · {review.metCount} of{' '}
        {review.totalCount} quests met target
      </p>
      <p className="settings-hint">Daily counts: bold met, italic under, underlined over, dot rested.</p>

      {review.pastIntent && (
        <p className="weekly-review-past-intent">Your intent that week: "{review.pastIntent}"</p>
      )}

      {review.domains.map(({ domain, spire, quests }) => (
        <div key={domain.id} className="weekly-review-domain">
          <div className="weekly-review-domain-header">
            <span className="quest-title">{domain.name}</span>
            <span className="settings-hint">
              {spire.condition} · {spire.heightWeeks}w
            </span>
          </div>
          <ul className="weekly-review-quest-list">
            {quests.map(({ quest, met, current, target, entries, days }) => (
              <li key={quest.id} className={met ? 'weekly-review-met' : 'weekly-review-unmet'}>
                <button
                  type="button"
                  className="weekly-review-quest-toggle"
                  onClick={() => setExpandedQuestId((id) => (id === quest.id ? null : quest.id))}
                >
                  <span className="weekly-review-marker">{met ? '■' : '□'}</span>
                  <span className="quest-title">{quest.title}</span>
                  <span className="weekly-review-count">
                    {current} / {target}
                  </span>
                </button>
                <QuestDayGrid days={days} />
                {expandedQuestId === quest.id && (
                  <div className="weekly-review-entries">
                    <LogEntryList quest={quest} entries={entries} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}
