import { getCitadelView } from '../../core/selectors'
import { todayKey } from '../../core/dates'
import { Spire } from '../components/Spire'
import type { AppState } from '../../model/types'

type Props = {
  state: AppState
}

export function CitadelView({ state }: Props) {
  const citadel = getCitadelView(state, todayKey())

  return (
    <div className="view citadel-view">
      <h1>The Citadel</h1>
      {citadel.domains.length === 0 && <p className="empty">No domains yet.</p>}
      <div className="skyline">
        {citadel.domains.map(({ domain, spire }) => (
          <Spire key={domain.id} domain={domain} spire={spire} />
        ))}
      </div>
    </div>
  )
}
