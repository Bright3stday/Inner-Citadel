import { useState } from 'react'
import { getWeeklyReviewView } from '../../core/selectors'
import { todayKey } from '../../core/dates'
import { setWeeklyIntent } from '../../actions/weeklyIntentActions'
import type { AppState } from '../../model/types'
import type { Apply } from '../../state/useAppState'

type Props = {
  state: AppState
  apply: Apply
}

function formatRange(startKey: string, endKey: string): string {
  const fmt = (key: string) => {
    const [, m, d] = key.split('-').map(Number)
    const month = new Date(2000, m - 1, 1).toLocaleString('en', { month: 'short' })
    return `${month} ${d}`
  }
  return `${fmt(startKey)} – ${fmt(endKey)}`
}

// The weekly ritual: review the week that just finished, then optionally
// set an intent for the one ahead. This is the fallback entry point for
// devices where a scheduled reminder isn't reliable (spec's scheduling
// piece is separate follow-up work, not built here) — reachable any time
// as its own tab rather than only through a notification.
export function WeeklyReviewView({ state, apply }: Props) {
  const review = getWeeklyReviewView(state, todayKey())
  const [intentDraft, setIntentDraft] = useState(review.upcomingIntent ?? '')
  const [saved, setSaved] = useState(false)

  function handleSaveIntent() {
    apply(setWeeklyIntent, { weekKey: review.upcomingWeekKey, note: intentDraft.trim() })
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="view weekly-review-view">
      <h1>Weekly Review</h1>

      {!review.hasHistory && (
        <p className="empty">
          Nothing to review yet — this fills in after your first full Monday–Sunday week.
        </p>
      )}

      {review.hasHistory && (
        <section className="weekly-review-past">
          <p className="weekly-review-range">
            {formatRange(review.week.startKey, review.week.endKey)} · {review.metCount} of{' '}
            {review.totalCount} quests met target
          </p>

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
                {quests.map(({ quest, met }) => (
                  <li key={quest.id} className={met ? 'weekly-review-met' : 'weekly-review-unmet'}>
                    <span className="weekly-review-marker">{met ? '■' : '□'}</span> {quest.title}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      <section className="weekly-review-plan">
        <h2>Plan the week ahead</h2>
        <p className="settings-hint">
          Optional. A short note to yourself — what matters this week, what to adjust. Quest targets
          and domains themselves are edited from the Citadel tab.
        </p>
        <textarea
          className="weekly-review-intent-input"
          value={intentDraft}
          onChange={(e) => setIntentDraft(e.target.value)}
          placeholder="e.g. Ease back into running after the trip, keep guitar daily."
          rows={3}
        />
        <button type="button" onClick={handleSaveIntent}>
          {saved ? 'Saved' : 'Save intent'}
        </button>
      </section>
    </div>
  )
}
