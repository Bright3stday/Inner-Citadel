// Composes core/tally, core/spire, core/neglect, core/forge, and
// core/dates into the exact shapes each view renders. May only CALL
// those modules' exported functions — never reimplement a rule. See
// docs/architecture.md §4.

import { dayOfWeek, lastCompletedWeeks, weekRange, type WeekRange } from './dates'
import { questProgress, questMetInWeek } from './tally'
import { deriveSpire } from './spire'
import { findNeglectedDomains } from './neglect'
import { deriveForgeHeat } from './forge'
import type {
  AppState,
  DaySession,
  Domain,
  DomainSpire,
  ForgeHeat,
  Quest,
  QuestProgress,
} from '../model/types'

export type DailyQuestView = {
  quest: Quest
  progress: QuestProgress
  isDueToday: boolean // display-only — never gates whether logging is allowed
  logsToday: number // count of today's log entries, for per-tap feedback copy
}

export type DailyDomainGroup = {
  domainId: string
  domainName: string
  quests: DailyQuestView[]
}

export type DailyView = {
  date: string
  domainGroups: DailyDomainGroup[]
  session: DaySession | null
  forgeHeat: ForgeHeat
}

// Grouped by domain so the Today view reads as distinct sections rather
// than one undifferentiated wall of cards — but every quest still shows
// without a tap-through, since logging is the one thing done every day
// and a click-to-reveal would add friction to exactly that action.
export function getDailyView(state: AppState, today: string): DailyView {
  const activeQuests = state.quests.filter((quest) => !quest.retiredAt)

  const domainGroups = state.domains
    .filter((domain) => !domain.archivedAt)
    .sort((a, b) => a.order - b.order)
    .map((domain) => ({
      domainId: domain.id,
      domainName: domain.name,
      quests: activeQuests
        .filter((quest) => quest.domainId === domain.id)
        .map((quest) => ({
          quest,
          progress: questProgress(quest, state.logEntries, today),
          isDueToday: quest.suggestedDays === null || quest.suggestedDays.includes(dayOfWeek(today)),
          logsToday: state.logEntries.filter((log) => log.questId === quest.id && log.forDate === today)
            .length,
        })),
    }))
    .filter((group) => group.quests.length > 0)

  const session = state.daySessions.find((s) => s.date === today) ?? null
  const forgeHeat = deriveForgeHeat(state.logEntries, today)

  return { date: today, domainGroups, session, forgeHeat }
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

export type WeeklyReviewQuest = {
  quest: Quest
  met: boolean
}

export type WeeklyReviewDomain = {
  domain: Domain
  spire: DomainSpire
  quests: WeeklyReviewQuest[]
}

export type WeeklyReview = {
  week: WeekRange
  hasHistory: boolean // false if no domain existed yet during `week` — first-week users see this
  domains: WeeklyReviewDomain[]
  metCount: number
  totalCount: number
  pastIntent: string | null // what was set, at the time, as the intent FOR `week`
  upcomingWeekKey: string
  upcomingIntent: string | null // already-saved intent for the week now in progress
}

// The most recently COMPLETED week (never the in-progress one — same
// boundary as the neglect rule and spire height, so "this week's spire
// hasn't moved yet" and "review isn't showing this week" agree).
export function getWeeklyReviewView(state: AppState, today: string): WeeklyReview {
  const week = lastCompletedWeeks(today, 1)[0]

  const domains = state.domains
    .filter((d) => !d.archivedAt && d.createdAt.slice(0, 10) <= week.endKey)
    .sort((a, b) => a.order - b.order)
    .map((domain) => ({
      domain,
      spire: deriveSpire(domain, state.quests, state.logEntries, today),
      quests: state.quests
        .filter((q) => q.domainId === domain.id && q.createdAt.slice(0, 10) <= week.endKey)
        .map((quest) => ({
          quest,
          met: questMetInWeek(quest, state.logEntries, week, today),
        })),
    }))
    .filter((group) => group.quests.length > 0)

  const allQuests = domains.flatMap((d) => d.quests)
  const metCount = allQuests.filter((q) => q.met).length

  const upcomingWeekKey = weekRange(today).weekKey
  const pastIntent = state.weeklyIntents.find((i) => i.weekKey === week.weekKey)?.note ?? null
  const upcomingIntent = state.weeklyIntents.find((i) => i.weekKey === upcomingWeekKey)?.note ?? null

  return {
    week,
    hasHistory: domains.length > 0,
    domains,
    metCount,
    totalCount: allQuests.length,
    pastIntent,
    upcomingWeekKey,
    upcomingIntent,
  }
}
