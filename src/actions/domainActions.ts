import { newDomain } from '../model/factories'
import type { AppState } from '../model/types'

export function addDomain(state: AppState, payload: { name: string }): AppState {
  const domain = newDomain(payload.name, state.domains.length)
  return { ...state, domains: [...state.domains, domain] }
}

export function archiveDomain(state: AppState, payload: { domainId: string }): AppState {
  return {
    ...state,
    domains: state.domains.map((domain) =>
      domain.id === payload.domainId ? { ...domain, archivedAt: new Date().toISOString() } : domain,
    ),
  }
}
