// Composes core/tally, core/spire, core/neglect, and core/dates into the
// exact shapes each view renders. May only CALL those modules' exported
// functions — never reimplement a rule. See docs/architecture.md §4.

import { dayOfWeek, weekRange } from './dates'
import { questProgress } from './tally'
import { deriveSpire } from './spire'
import { findNeglectedDomains } from './neglect'
import type { AppState, DaySession, Domain, DomainSpire, Quest, QuestProgress } from '../model/types'

export type DailyQuestView = {
  quest: Quest
  domainName: string
  progress: QuestProgress
  isDueToday: boolean // display-only — never gates whether logging is allowed
}

export type DailyView = {
  date: string
  quests: DailyQuestView[]
  session: DaySession | null
}

export function getDailyView(state: AppState, today: string): DailyView {
  const domainNameById = new Map(state.domains.map((d) => [d.id, d.name]))

  const quests = state.quests
    .filter((quest) => !quest.retiredAt)
    .map((quest) => ({
      quest,
      domainName: domainNameById.get(quest.domainId) ?? 'Unknown domain',
      progress: questProgress(quest, state.logEntries, today),
      isDueToday: quest.suggestedDays === null || quest.suggestedDays.includes(dayOfWeek(today)),
    }))

  const session = state.daySessions.find((s) => s.date === today) ?? null

  return { date: today, quests, session }
}

export type CitadelDomainView = {
  domain: Domain
  spire: DomainSpire
}

export type CitadelView = {
  domains: CitadelDomainView[]
}

export function getCitadelView(state: AppState, today: string): CitadelView {
  const domains = state.domains
    .filter((d) => !d.archivedAt)
    .sort((a, b) => a.order - b.order)
    .map((domain) => ({
      domain,
      spire: deriveSpire(domain, state.quests, state.logEntries, today),
    }))

  return { domains }
}

/** Neglected domains whose prompt hasn't been dismissed for the current week. */
export function getNeglectPrompts(state: AppState, today: string): Domain[] {
  const neglected = findNeglectedDomains(state.domains, state.quests, state.logEntries, today)
  const currentWeekKey = weekRange(today).weekKey

  return neglected.filter(
    (domain) =>
      !state.dismissedPrompts.some(
        (prompt) =>
          prompt.kind === 'neglect' && prompt.domainId === domain.id && prompt.weekKey === currentWeekKey,
      ),
  )
}
