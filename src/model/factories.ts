import { newId } from './ids'
import type { AppState, Domain, Quest, QuestMethod } from './types'

const SCHEMA_VERSION = 1

function nowIso(): string {
  return new Date().toISOString()
}

export function emptyAppState(): AppState {
  const now = nowIso()
  return {
    schemaVersion: SCHEMA_VERSION,
    domains: [],
    quests: [],
    logEntries: [],
    daySessions: [],
    dismissedPrompts: [],
    settings: {
      reflectionCharLimit: 500,
      weekStartsOn: 1,
    },
    meta: {
      createdAt: now,
      lastOpenedAt: now,
    },
  }
}

export function newDomain(name: string, order: number): Domain {
  return {
    id: newId('dom'),
    name,
    order,
    createdAt: nowIso(),
    archivedAt: null,
  }
}

export function newQuestMethod(label: string): QuestMethod {
  return { id: newId('mth'), label }
}

export function newQuest(params: {
  domainId: string
  title: string
  targetCount: number
  window: 'day' | 'week'
  unitLabel: string
  methods?: QuestMethod[]
  suggestedDays?: number[] | null
}): Quest {
  return {
    id: newId('qst'),
    domainId: params.domainId,
    title: params.title,
    targetCount: params.targetCount,
    window: params.window,
    unitLabel: params.unitLabel,
    methods: params.methods ?? [newQuestMethod('Logged')],
    suggestedDays: params.suggestedDays ?? null,
    createdAt: nowIso(),
    retiredAt: null,
    notes: null,
  }
}

/**
 * Throwaway seed data for a first run so the app isn't a blank screen.
 * Not onboarding — real onboarding is deferred (spec §8, architecture §7).
 */
export function seedAppState(): AppState {
  const state = emptyAppState()

  const fitness = newDomain('Fitness', 0)
  const reading = newDomain('Reading', 1)

  const walk = newQuest({
    domainId: fitness.id,
    title: 'Go for an evening walk',
    targetCount: 4,
    window: 'week',
    unitLabel: 'walks',
  })

  const strength = newQuest({
    domainId: fitness.id,
    title: 'Do a strength session',
    targetCount: 3,
    window: 'week',
    unitLabel: 'sessions',
    methods: [newQuestMethod('Push-ups'), newQuestMethod('Squats')],
  })

  const read = newQuest({
    domainId: reading.id,
    title: 'Read for 20 minutes',
    targetCount: 5,
    window: 'week',
    unitLabel: 'sessions',
  })

  return {
    ...state,
    domains: [fitness, reading],
    quests: [walk, strength, read],
  }
}
