import { useState } from 'react'
import { useAppState } from './state/useAppState'
import { DailyView } from './ui/views/DailyView'
import { CitadelView } from './ui/views/CitadelView'

type Tab = 'daily' | 'citadel'

// Holds the state hook and decides which view is on screen.
// Routing only — no rules belong here.
export function App() {
  const { state, apply } = useAppState()
  const [tab, setTab] = useState<Tab>('daily')

  return (
    <div className="app">
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
      </nav>

      {tab === 'daily' ? <DailyView state={state} apply={apply} /> : <CitadelView state={state} />}
    </div>
  )
}
