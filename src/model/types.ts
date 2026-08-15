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
  restRecords: RestRecord[] // The Inn — see RestRecord below
  masteryNodes: MasteryNode[] // Mastery Tree skeleton — see MasteryNode below
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

export type RestState = 'active' | 'reduced' | 'resting'

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

  // The Inn (see RestRecord). 'reduced' means targetCount IS the
  // reduced value right now — meeting it counts as meeting target
  // through the existing tally rules unchanged; preRestTargetCount
  // holds the original so it can be restored on return. 'resting'
  // means paused: dropped from Today, excluded from condition's
  // active-quest set, and neglect never fires for it.
  restState: RestState
  preRestTargetCount: number | null // only set while restState === 'reduced'
  isRecoveryQuest: boolean // true for a quest created by a recovery set
  restRecordId: string | null // links to the RestRecord governing this quest, null when active
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

// The Inn: a domain's real history of pausing/reducing quests to
// recover, rather than letting neglect quietly happen or forcing full
// pace through an injury/illness/bad stretch. Unlike height/condition/
// neglect, this can't be recomputed from log history — it's a record
// of a choice made at the time, not a fact derivable after the fact.
// One record per "send to the Inn" action; closed (endedAt set) on
// return. See docs/decision-log-and-roadmap.md, Inn section.
export type RestRecord = {
  id: string
  domainId: string
  mode: 'reduced' | 'resting'
  startedAt: string
  endedAt: string | null
  questIds: string[] // the ORIGINAL quests placed into this mode (not recovery quests)
  recoverySetId: string | null // which built-in/custom set was used — 'resting' only
  recoveryQuestIds: string[] // quests created from that set, for cleanup on return
  reason: string | null
}

export type RecoveryQuestTemplate = {
  title: string
  targetCount: number
  window: 'day' | 'week'
  unitLabel: string
}

export type RecoveryQuestSet = {
  id: string
  name: string
  templates: RecoveryQuestTemplate[]
}

// Mastery Tree skeleton (see docs/decision-log-and-roadmap.md). A node
// is a self-authored capability, not an activity — the app never
// parses or judges `criteria`. Practice history (logging
// contributingQuestIds) earns eligibility; unlocking is always a
// deliberate act, never automatic. `unlockedAt` is the one genuinely
// new stored fact — everything else about a node's current state
// (locked/eligible/unlocked, practice count) is derived, same
// discipline as the rest of this app. See core/mastery.ts.
export type ThresholdUnit = 'quest completions' | 'weeks meeting target'

export type MasteryNode = {
  id: string
  domainId: string
  title: string // the capability, not the activity — self-authored
  criteria: string // free text, self-authored, never parsed or judged
  practiceThreshold: number
  thresholdUnit: ThresholdUnit
  contributingQuestIds: string[]
  order: number
  createdAt: string
  unlockedAt: string | null // null until deliberately unlocked (spends GP)
}

export type Settings = {
  reflectionCharLimit: number
  weekStartsOn: 0 | 1 // 0=Sunday, 1=Monday

  // Weekly ritual reminder — best-effort. Browser Notification API,
  // checked when the app is opened or brought to the foreground; there
  // is no server, so nothing can wake the app while it's fully closed.
  // The Review tab is the guaranteed fallback, not this. null =
  // disabled.
  reminderDay: number | null // 0=Sun..6=Sat
  reminderTime: string | null // "HH:MM", 24h
  lastReminderWeekKey: string | null // which week's reminder was last shown, to avoid repeats
}

// ── Derived — computed on read, never persisted ───────────────
// Nothing below this line ever appears inside AppState. See §2.8.

export type SpireCondition = 'thriving' | 'steady' | 'crumbling'

// Height is node-driven, not week-driven — see docs/decision-log-and-
// roadmap.md, "Spire becomes node-driven". heightTier = mastery nodes
// unlocked in this domain so far; unbounded, since it's now bounded by
// nodes authored rather than a hardcoded week ladder. nextNode is the
// domain's practice signal for the dead zone between unlocks — the
// nearest still-LOCKED node (not merely "not unlocked" — an eligible
// node has already stopped accumulating), with how much practice has
// accumulated toward it. null if nothing is currently locked (every
// remaining node is eligible or unlocked, or the domain has none yet).
export type SpireHeight = {
  heightTier: number
  nextNode: { title: string; practiceCount: number; practiceThreshold: number } | null
}

export type DomainSpire = SpireHeight & {
  condition: SpireCondition
}

// Entirely derived — see core/growth.ts. Nothing about GP itself is
// stored; only which nodes are unlocked (MasteryNode.unlockedAt) is.
export type GrowthPoints = {
  earned: number
  spent: number
  balance: number
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
