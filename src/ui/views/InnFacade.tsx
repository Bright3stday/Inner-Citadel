import { useState } from 'react'
import { returnFromInn } from '../../actions/restActions'
import { getAllActiveRestRecords } from '../../core/selectors'
import { InnView } from './InnView'
import type { AppState } from '../../model/types'
import type { Apply } from '../../state/useAppState'

type Props = {
  state: AppState
  apply: Apply
}

// A small tavern front on the Citadel screen itself — the Inn used to
// be a button buried inside a domain's own page, easy to miss and
// oddly scoped to whichever domain you happened to be viewing. Living
// here instead makes it a first-class, always-visible place: see
// who's resting across every domain at a glance, and start a new stay
// without drilling into a domain first.
export function InnFacade({ state, apply }: Props) {
  const [pickedDomainId, setPickedDomainId] = useState<string | null>(null)

  const records = getAllActiveRestRecords(state)
  const domainName = (domainId: string) => state.domains.find((d) => d.id === domainId)?.name ?? '(deleted domain)'
  const questTitle = (questId: string) => state.quests.find((q) => q.id === questId)?.title ?? '(deleted quest)'

  const eligibleQuestsFor = (domainId: string) =>
    state.quests.filter((q) => q.domainId === domainId && !q.retiredAt && q.restState === 'active' && !q.isRecoveryQuest)

  const pickableDomains = state.domains.filter((d) => !d.archivedAt && eligibleQuestsFor(d.id).length > 0)
  const pickedDomain = pickedDomainId ? state.domains.find((d) => d.id === pickedDomainId) : undefined

  return (
    <div className="inn-facade">
      <div className="inn-facade-roof">
        <div className="inn-facade-chimney" />
      </div>
      <div className="inn-facade-body">
        <div className="inn-facade-timber" />
        <div className="inn-hanging-sign">The Inn</div>

        <div className="inn-facade-content">
          {pickedDomain ? (
            <InnView
              domain={pickedDomain}
              quests={eligibleQuestsFor(pickedDomain.id)}
              apply={apply}
              onDone={() => setPickedDomainId(null)}
            />
          ) : (
            <>
              {records.map((record) => (
                <div key={record.id} className="wooden-sign">
                  <p className="wooden-sign-title">
                    {domainName(record.domainId)} · {record.mode}
                  </p>
                  <p className="wooden-sign-detail">
                    {record.questIds.map(questTitle).join(', ')}
                    {record.recoveryQuestIds.length > 0 &&
                      ` — recovery: ${record.recoveryQuestIds.map(questTitle).join(', ')}`}
                  </p>
                  <button
                    type="button"
                    className="wooden-sign-button"
                    onClick={() => apply(returnFromInn, { restRecordId: record.id })}
                  >
                    Return
                  </button>
                </div>
              ))}

              {pickableDomains.length === 0 ? (
                <p className="inn-facade-empty">Nothing to rest right now.</p>
              ) : (
                <div className="wooden-sign">
                  <p className="wooden-sign-detail">Rest a domain</p>
                  <div className="inn-domain-picks">
                    {pickableDomains.map((domain) => (
                      <button
                        key={domain.id}
                        type="button"
                        className="wooden-sign-button"
                        onClick={() => setPickedDomainId(domain.id)}
                      >
                        {domain.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
