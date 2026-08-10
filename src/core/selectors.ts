// Composes core/tally, core/spire, core/neglect, core/forge, and
// core/dates into the exact shapes each view renders. May only CALL
// those modules' exported functions — never reimplement a rule. See
// docs/architecture.md §4.

import { dayOfWeek, isWithinRange, lastCompletedWeeks, lastMonths, weekRange, type WeekRange } from './dates'
import {
  questProgress,
  questMetInWeek,
  questWeekTally,
  questDayBreakdown,
  questMonthlyBreakdown,
  type QuestDay,
  type QuestMonth,
} from './tally'
import { deriveSpire } from './spire'
import { findNeglectedDomains } from './neglect'
import { deriveForgeHeat } from './forge'
import type {
  AppState,
  DaySession,
  Domain,
  DomainSpire,
  ForgeHeat,
  LogEntry,
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
  // Resting quests drop off Today entirely — a recovery quest, being
  // a normal (non-resting) Quest row under the same domain, shows up
  // in its place automatically without any special-casing here.
  const activeQuests = state.quests.filter((quest) => !quest.retiredAt && quest.restState !== 'resting')

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
  hasRepaired: boolean // ever returned from the Inn — see actions/restActions.ts
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
      hasRepaired: state.restRecords.some((r) => r.domainId === domain.id && r.endedAt !== null),
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
  current: number // real counted quantity for `week` — see core/tally.ts questWeekTally
  target: number
  entries: LogEntry[] // this quest's contributing log entries within `week`, most recent first
  days: QuestDay[] // day-by-day counts across `week`, Mon-Sun — see core/tally.ts questDayBreakdown
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
}

// Reviews `week` (default: the most recently COMPLETED week — never the
// in-progress one, same boundary as the neglect rule and spire height).
// Callers passing an explicit `week` (e.g. the Trends pager) can review
// any earlier completed week the same way.
export function getWeeklyReviewView(
  state: AppState,
  today: string,
  week: WeekRange = lastCompletedWeeks(today, 1)[0],
): WeeklyReview {
  const domains = state.domains
    .filter((d) => !d.archivedAt && d.createdAt.slice(0, 10) <= week.endKey)
    .sort((a, b) => a.order - b.order)
    .map((domain) => ({
      domain,
      spire: deriveSpire(domain, state.quests, state.logEntries, today),
      quests: state.quests
        .filter((q) => q.domainId === domain.id && q.createdAt.slice(0, 10) <= week.endKey)
        .map((quest) => {
          const { current, target } = questWeekTally(quest, state.logEntries, week, today)
          const entries = state.logEntries
            .filter((log) => log.questId === quest.id && isWithinRange(log.forDate, week))
            .sort((a, b) => (a.forDate === b.forDate ? b.loggedAt.localeCompare(a.loggedAt) : b.forDate.localeCompare(a.forDate)))
          return {
            quest,
            met: questMetInWeek(quest, state.logEntries, week, today),
            current,
            target,
            entries,
            days: questDayBreakdown(quest, state.logEntries, week, today, state.restRecords),
          }
        }),
    }))
    .filter((group) => group.quests.length > 0)

  const allQuests = domains.flatMap((d) => d.quests)
  const metCount = allQuests.filter((q) => q.met).length
  const pastIntent = state.weeklyIntents.find((i) => i.weekKey === week.weekKey)?.note ?? null

  return {
    week,
    hasHistory: domains.length > 0,
    domains,
    metCount,
    totalCount: allQuests.length,
    pastIntent,
  }
}

// Column headers for a monthly table — fixed and independent of any
// quest's own data, so every row lines up under the same months.
export function getRecentMonths(today: string, months: number): string[] {
  return lastMonths(today, months)
}

// A quest's under/met/over tallies per month, for spotting a quest
// that's chronically short (recalibrate or retire), chronically over
// (raise the target, or it's basically mastered), or genuinely on
// track — the actual diagnostic signal behind "is this quest working."
export function getQuestMonthlyBreakdown(
  state: AppState,
  quest: Quest,
  today: string,
  months: number,
): QuestMonth[] {
  return questMonthlyBreakdown(quest, state.logEntries, today, months, state.restRecords)
}

// A domain's currently-open Inn stays (not yet returned from) — used
// by DomainView to show what's reduced/resting right now and offer a
// Return action per stay.
export function getActiveRestRecords(state: AppState, domainId: string) {
  return state.restRecords.filter((r) => r.domainId === domainId && r.endedAt === null)
}

// A quest's most recent log entries, all-time — used by DomainView's
// per-quest history, capped since a quest can accumulate a lot of
// entries over months of real use.
export function getQuestLogHistory(state: AppState, questId: string, limit = 20): LogEntry[] {
  return state.logEntries
    .filter((log) => log.questId === questId)
    .sort((a, b) => (a.forDate === b.forDate ? b.loggedAt.localeCompare(a.loggedAt) : b.forDate.localeCompare(a.forDate)))
    .slice(0, limit)
}
