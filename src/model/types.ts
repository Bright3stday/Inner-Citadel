// Every entity shape in the app, in one file. See docs/architecture.md §2.

// ── Stored ─────────────────────────────────────────────────────

export type AppState = {
  schemaVersion: number
  domains: Domain[]
  quests: Quest[]
  logEntries: LogEntry[]
  daySessions: DaySession[]
  dismissedPrompts: DismissedPrompt[]
  weeklyIntents: WeeklyIntent[]
  settings: Settings
  meta: {
    createdAt: string // ISO 8601
    lastOpenedAt: string // ISO 8601
  }
}

export type Domain = {
  id: string
  name: string
  order: number
  createdAt: string // ISO 8601
  archivedAt: string | null
}

export type QuestMethod = {
  id: string
  label: string
}

export type Quest = {
  id: string
  domainId: string
  title: string

  targetCount: number
  window: 'day' | 'week'
  unitLabel: string

  methods: QuestMethod[] // always >= 1 entry
  suggestedDays: number[] | null // 0=Sun..6=Sat. DISPLAY ONLY — never gates logging

  createdAt: string
  retiredAt: string | null
  notes: string | null
}

export type LogEntry = {
  id: string
  questId: string
  methodId: string
  count: number
  forDate: string // "YYYY-MM-DD" — the day this counts toward
  loggedAt: string // ISO 8601 — when the button was actually pressed
}

export type DaySession = {
  date: string // "YYYY-MM-DD" — one session per day, max
  closedAt: string // ISO 8601
  reflection: string | null
}

export type DismissedPrompt = {
  kind: 'neglect'
  domainId: string
  weekKey: string // "2026-W31"
  dismissedAt: string
}

// A weekly ritual's stated intent for the week ahead — a choice, not a
// fact derivable from log history, so it's stored (same reasoning as
// DaySession.reflection). One entry per weekKey; setting again overwrites.
export type WeeklyIntent = {
  weekKey: string // "2026-W31" — the week this intent is FOR
  note: string
  createdAt: string
}

export type Settings = {
  reflectionCharLimit: number
  weekStartsOn: 0 | 1 // 0=Sunday, 1=Monday
}

// ── Derived — computed on read, never persisted ───────────────
// Nothing below this line ever appears inside AppState. See §2.8.

export type SpireCondition = 'thriving' | 'steady' | 'crumbling'

export type SpireHeight = {
  heightWeeks: number // qualifying weeks, all-time. Monotonic.
  heightTier: number // 0..5 — the render bucket for heightWeeks
}

export type DomainSpire = SpireHeight & {
  condition: SpireCondition
}

export type QuestProgress = {
  current: number
  target: number
  met: boolean
}

// A short-window, whole-app readout of recent momentum — separate from
// spire height/condition on purpose, since those are weekly and barely
// move day to day. Not tied to any one domain. See core/forge.ts.
export type ForgeHeat = 'cold' | 'embers' | 'low-flame' | 'working-heat' | 'striking'
