import { useState, type FormEvent } from 'react'
import { getCitadelView } from '../../core/selectors'
import { todayKey } from '../../core/dates'
import { addDomain } from '../../actions/domainActions'
import { Spire } from '../components/Spire'
import { DomainView } from './DomainView'
import type { AppState } from '../../model/types'
import type { Apply } from '../../state/useAppState'

type Props = {
  state: AppState
  apply: Apply
}

export function CitadelView({ state, apply }: Props) {
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null)
  const [newDomainName, setNewDomainName] = useState('')
  const citadel = getCitadelView(state, todayKey())

  const selected = citadel.domains.find((d) => d.domain.id === selectedDomainId)
  if (selected) {
    return (
      <DomainView
        state={state}
        apply={apply}
        domain={selected.domain}
        spire={selected.spire}
        onBack={() => setSelectedDomainId(null)}
      />
    )
  }

  function handleAddDomain(event: FormEvent) {
    event.preventDefault()
    if (!newDomainName.trim()) return
    apply(addDomain, { name: newDomainName.trim() })
    setNewDomainName('')
  }

  return (
    <div className="view citadel-view">
      <h1>The Citadel</h1>

      {citadel.domains.length === 0 && <p className="empty">No domains yet.</p>}
      <div className="skyline">
        {citadel.domains.map(({ domain, spire }) => (
          <button
            key={domain.id}
            type="button"
            className="spire-button"
            onClick={() => setSelectedDomainId(domain.id)}
          >
            <Spire domain={domain} spire={spire} />
          </button>
        ))}
      </div>

      <form className="new-domain-form" onSubmit={handleAddDomain}>
        <input
          type="text"
          value={newDomainName}
          onChange={(e) => setNewDomainName(e.target.value)}
          placeholder="New domain, e.g. Photography"
        />
        <button type="submit">+ Add domain</button>
      </form>
    </div>
  )
}
