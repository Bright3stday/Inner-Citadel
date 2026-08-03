import { useState } from 'react'
import { useAppState } from './state/useAppState'
import { DailyView } from './ui/views/DailyView'
import { CitadelView } from './ui/views/CitadelView'
import { SettingsView } from './ui/views/SettingsView'

type Tab = 'daily' | 'citadel' | 'settings'

// Holds the state hook and decides which view is on screen.
// Routing only — no rules belong here.
//
// All three views are always mounted; which ones are visible is decided
// entirely by CSS (styles.css), keyed off data-tab and viewport width.
// On a narrow screen exactly one panel shows, chosen by the active tab —
// same as before. On a wide screen, Daily and Citadel show side by side
// regardless of tab (same components, more room, not a different app);
// Settings still takes over the full view when selected. No JS viewport
// detection — the breakpoint lives in one place, the stylesheet.
export function App() {
  const { state, apply } = useAppState()
  const [tab, setTab] = useState<Tab>('daily')

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
          className={tab === 'settings' ? 'tab-active' : ''}
          onClick={() => setTab('settings')}
        >
          Settings
        </button>
      </nav>

      <main className="main">
        <section className="panel panel-daily">
          <DailyView state={state} apply={apply} />
        </section>
        <section className="panel panel-citadel">
          <CitadelView state={state} apply={apply} />
        </section>
        <section className="panel panel-settings">
          <SettingsView state={state} apply={apply} />
        </section>
      </main>
    </div>
  )
}
