import { useState } from 'react'
import { getWeeklyReviewView } from '../../core/selectors'
import { todayKey, weekRange, lastCompletedWeeks } from '../../core/dates'
import { setWeeklyIntent } from '../../actions/weeklyIntentActions'
import { WeeklyReviewGrid } from '../components/WeeklyReviewGrid'
import { TrendsView } from '../components/TrendsView'
import type { AppState } from '../../model/types'
import type { Apply } from '../../state/useAppState'

type Props = {
  state: AppState
  apply: Apply
}

type Mode = 'week' | 'trends'

// The oldest week offset the pager allows — a year is plenty for a
// personal practice log without letting it compute unbounded history.
const MAX_WEEKS_BACK = 52

// The weekly ritual: review the week that just finished, optionally set
// an intent for the one ahead, or switch to Trends to page through
// earlier weeks and see domain height/condition over time. This is the
// fallback entry point for devices where a scheduled reminder isn't
// reliable (spec's scheduling piece is separate follow-up work, not
// built here) — reachable any time as its own tab.
export function WeeklyReviewView({ state, apply }: Props) {
  const today = todayKey()
  const [mode, setMode] = useState<Mode>('week')
  const [weekOffset, setWeekOffset] = useState(0)

  const thisWeekReview = getWeeklyReviewView(state, today)
  const upcomingWeekKey = weekRange(today, state.settings.weekStartsOn).weekKey
  const upcomingIntent = state.weeklyIntents.find((i) => i.weekKey === upcomingWeekKey)?.note ?? null

  const [intentDraft, setIntentDraft] = useState(upcomingIntent ?? '')
  const [saved, setSaved] = useState(false)

  function handleSaveIntent() {
    apply(setWeeklyIntent, { weekKey: upcomingWeekKey, note: intentDraft.trim() })
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const pagedWeek = lastCompletedWeeks(today, weekOffset + 1, state.settings.weekStartsOn)[weekOffset]
  const pagedReview = mode === 'trends' ? getWeeklyReviewView(state, today, pagedWeek) : null

  return (
    <div className="view weekly-review-view">
      <h1>Weekly Review</h1>

      <div className="weekly-review-mode-toggle">
        <button type="button" className={mode === 'week' ? 'tab-active' : ''} onClick={() => setMode('week')}>
          This Week
        </button>
        <button
          type="button"
          className={mode === 'trends' ? 'tab-active' : ''}
          onClick={() => setMode('trends')}
        >
          Trends
        </button>
      </div>

      {mode === 'week' && (
        <>
          <WeeklyReviewGrid review={thisWeekReview} />

          <section className="weekly-review-plan">
            <h2>Plan the week ahead</h2>
            <p className="settings-hint">Optional note to yourself.</p>
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
        </>
      )}

      {mode === 'trends' && pagedReview && (
        <>
          <div className="weekly-review-pager">
            <button
              type="button"
              onClick={() => setWeekOffset((o) => Math.min(MAX_WEEKS_BACK - 1, o + 1))}
              disabled={weekOffset >= MAX_WEEKS_BACK - 1}
            >
              ← Older
            </button>
            <button type="button" onClick={() => setWeekOffset((o) => Math.max(0, o - 1))} disabled={weekOffset === 0}>
              Newer →
            </button>
          </div>
          <WeeklyReviewGrid review={pagedReview} />

          <TrendsView state={state} today={today} />
        </>
      )}
    </div>
  )
}
