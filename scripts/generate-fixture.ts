// Generates sample AppState JSON with realistic multi-week history, so
// spire height/condition/neglect can be eyeballed without waiting real
// calendar time. Uses the real model/ and core/dates.ts code — not a
// reimplementation — so a fixture can never silently drift out of sync
// with what the app actually computes.
//
// Dev-only: nothing here ships in the app bundle or touches src/.
// See docs/architecture.md §9 decision log for the height/condition rules
// this is designed to exercise.
//
// Usage:
//   npm run fixture              # writes every scenario
//   npm run fixture -- mixed     # writes just one
//
// Then, with the app open (npm run dev) and DevTools console open:
//   localStorage.setItem('innerCitadel.v1', JSON.stringify(<paste file>))
//   location.reload()

import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { emptyAppState, newDomain, newQuest } from '../src/model/factories'
import { newId } from '../src/model/ids'
import { todayKey, weekStartKey, addDays } from '../src/core/dates'
import type { AppState, Domain, LogEntry, Quest } from '../src/model/types'

const OUT_DIR = new URL('./fixtures/', import.meta.url)
mkdirSync(OUT_DIR, { recursive: true })

type DomainFixture = { domain: Domain; quests: Quest[]; logs: LogEntry[] }

function logEntry(quest: Quest, forDate: string): LogEntry {
  return {
    id: newId('log'),
    questId: quest.id,
    methodId: quest.methods[0].id,
    count: 1,
    forDate,
    loggedAt: `${forDate}T20:00:00.000Z`,
  }
}

/** Log `count` contributions for `quest`, spread across the week starting `weekStart`. */
function fillWeek(quest: Quest, weekStart: string, count: number): LogEntry[] {
  return Array.from({ length: count }, (_, i) => logEntry(quest, addDays(weekStart, i % 7)))
}

/** The Monday of the week that was `weeksAgo` COMPLETED weeks before today. */
function completedWeekStart(weeksAgo: number): string {
  return addDays(weekStartKey(todayKey()), -7 * weeksAgo)
}

function weeklyQuest(domain: Domain, title: string, targetCount = 3): Quest {
  return newQuest({ domainId: domain.id, title, targetCount, window: 'week', unitLabel: 'sessions' })
}

// Last THRIVING_STREAK_WEEKS (2) completed weeks hit target, and so does
// every week before that back 8 weeks — tall AND currently thriving.
function thrivingDomain(name: string, order: number): DomainFixture {
  const domain = newDomain(name, order)
  const quest = weeklyQuest(domain, `${name} session`)
  const logs = Array.from({ length: 8 }, (_, i) => i + 1).flatMap((weeksAgo) =>
    fillWeek(quest, completedWeekStart(weeksAgo), quest.targetCount),
  )
  return { domain, quests: [quest], logs }
}

// Weeks 10..3-ago hit target (real height), but the last NEGLECT_WEEKS (2)
// completed weeks have nothing — the flagship "tall and weathering" case
// the height/condition split exists to represent.
function crumblingDomain(name: string, order: number): DomainFixture {
  const domain = newDomain(name, order)
  const quest = weeklyQuest(domain, `${name} session`)
  const logs = Array.from({ length: 8 }, (_, i) => i + 3).flatMap((weeksAgo) =>
    fillWeek(quest, completedWeekStart(weeksAgo), quest.targetCount),
  )
  return { domain, quests: [quest], logs }
}

// Some real height from a couple of solid weeks, but the two most recent
// completed weeks are under target — present, so not neglected, but not
// a thriving streak either.
function steadyDomain(name: string, order: number): DomainFixture {
  const domain = newDomain(name, order)
  const quest = weeklyQuest(domain, `${name} session`)
  const logs = [
    ...fillWeek(quest, completedWeekStart(6), quest.targetCount),
    ...fillWeek(quest, completedWeekStart(5), quest.targetCount),
    ...fillWeek(quest, completedWeekStart(2), 1),
    ...fillWeek(quest, completedWeekStart(1), 1),
  ]
  return { domain, quests: [quest], logs }
}

// Zero history — the bare-plot case, and a check that the "no logs ever"
// guard in deriveCondition keeps this 'steady', never 'crumbling'.
function untouchedDomain(name: string, order: number): DomainFixture {
  const domain = newDomain(name, order)
  const quest = weeklyQuest(domain, `${name} session`)
  return { domain, quests: [quest], logs: [] }
}

function buildState(parts: DomainFixture[]): AppState {
  return {
    ...emptyAppState(),
    domains: parts.map((p) => p.domain),
    quests: parts.flatMap((p) => p.quests),
    logEntries: parts.flatMap((p) => p.logs),
  }
}

const scenarios: Record<string, () => AppState> = {
  thriving: () => buildState([thrivingDomain('Fitness', 0)]),
  crumbling: () => buildState([crumblingDomain('Reading', 0)]),
  mixed: () =>
    buildState([
      thrivingDomain('Fitness', 0),
      crumblingDomain('Reading', 1),
      steadyDomain('Photography', 2),
      untouchedDomain('Writing', 3),
    ]),
}

const requested = process.argv.slice(2)
const names = requested.length > 0 ? requested : Object.keys(scenarios)

for (const name of names) {
  const build = scenarios[name]
  if (!build) {
    console.error(`Unknown scenario "${name}". Known: ${Object.keys(scenarios).join(', ')}`)
    process.exit(1)
  }
  const state = build()
  const outPath = fileURLToPath(new URL(`${name}.json`, OUT_DIR))
  writeFileSync(outPath, JSON.stringify(state, null, 2))
  console.log(
    `Wrote ${outPath} (${state.domains.length} domain(s), ${state.logEntries.length} log entries)`,
  )
}

console.log(`
To load a scenario: run the app locally (npm run dev), open DevTools
console on the page, and run:

  localStorage.setItem('innerCitadel.v1', JSON.stringify(<paste the file's contents here>))
  location.reload()

This writes to the exact same localStorage key src/storage/storage.ts
reads from — no app code changes, nothing dev-only shipped in the bundle.
`)
