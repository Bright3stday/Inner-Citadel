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
    weeklyIntents: [],
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
