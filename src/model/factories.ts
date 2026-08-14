import { newId } from './ids'
import type { AppState, Domain, Quest, QuestMethod, RestRecord } from './types'

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
    restRecords: [],
    settings: {
      reflectionCharLimit: 500,
      weekStartsOn: 1,
      reminderDay: null,
      reminderTime: null,
      lastReminderWeekKey: null,
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
  isRecoveryQuest?: boolean
  restRecordId?: string | null
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
    restState: 'active',
    preRestTargetCount: null,
    isRecoveryQuest: params.isRecoveryQuest ?? false,
    restRecordId: params.restRecordId ?? null,
  }
}

export function newRestRecord(params: {
  domainId: string
  mode: 'reduced' | 'resting'
  questIds: string[]
  recoverySetId?: string | null
  reason: string | null
}): RestRecord {
  return {
    id: newId('rst'),
    domainId: params.domainId,
    mode: params.mode,
    startedAt: nowIso(),
    endedAt: null,
    questIds: params.questIds,
    recoverySetId: params.recoverySetId ?? null,
    recoveryQuestIds: [],
    reason: params.reason,
  }
}
