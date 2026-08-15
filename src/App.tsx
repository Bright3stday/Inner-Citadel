import { useState } from 'react'
import { useAppState } from './state/useAppState'
import { useWeeklyReminder } from './state/useWeeklyReminder'
import { DailyView } from './ui/views/DailyView'
import { CitadelView } from './ui/views/CitadelView'
import { SettingsView } from './ui/views/SettingsView'
import { WeeklyReviewView } from './ui/views/WeeklyReviewView'
import { GuideView } from './ui/views/GuideView'

type Tab = 'daily' | 'citadel' | 'review' | 'settings' | 'guide'

// Holds the state hook and decides which view is on screen.
// Routing only — no rules belong here.
//
// All three views are always mounted; which ones are visible is decided
// entirely by CSS (styles.css), keyed off data-tab and viewport width.
// On a narrow screen exactly one panel shows, chosen by the active tab —
// same as before. On a wide screen, Daily and Citadel show side by side
// regardless of tab (same components, more room, not a different app);
// Settings and Guide still take over the full view when selected. No JS
// viewport detection — the breakpoint lives in one place, the stylesheet.
export function App() {
  const { state, apply } = useAppState()
  // A brand-new install (no domains yet) lands on the Guide tab instead
  // of an empty Today screen — the closest thing to onboarding this app
  // has, without a separate scripted first-run flow. Anyone who already
  // has domains lands on Today as before.
  const [tab, setTab] = useState<Tab>(() => (state.domains.length === 0 ? 'guide' : 'daily'))
  useWeeklyReminder(state, apply)

  return (
    <div className="app" data-tab={tab}>
      <nav className="tabs">
        <button
          type="button"
          className={tab === 'daily' ? 'tab-active' : ''}
          onClick={() => setTab('daily')}
        >
          Today
        </button>
        <button
          type="button"
          className={tab === 'citadel' ? 'tab-active' : ''}
          onClick={() => setTab('citadel')}
        >
          Citadel
        </button>
        <button
          type="button"
          className={tab === 'review' ? 'tab-active' : ''}
          onClick={() => setTab('review')}
        >
          Review
        </button>
        <button
          type="button"
          className={tab === 'settings' ? 'tab-active' : ''}
          onClick={() => setTab('settings')}
        >
          Settings
        </button>
        <button
          type="button"
          className={tab === 'guide' ? 'tab-active' : ''}
          onClick={() => setTab('guide')}
        >
          Guide
        </button>
      </nav>

      <main className="main">
        <section className="panel panel-daily">
          <DailyView state={state} apply={apply} />
        </section>
        <section className="panel panel-citadel">
          <CitadelView state={state} apply={apply} active={tab === 'citadel'} />
        </section>
        <section className="panel panel-review">
          <WeeklyReviewView state={state} apply={apply} />
        </section>
        <section className="panel panel-settings">
          <SettingsView state={state} apply={apply} />
        </section>
        <section className="panel panel-guide">
          <GuideView />
        </section>
      </main>
    </div>
  )
}
