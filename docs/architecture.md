# Inner Citadel — System Architecture

**Status:** Draft for review. No implementation code exists yet.
**Companion document:** `Inner Citadel — MLP Design Specification`
**Date:** 2026-08-02

---

## 0. Why this document exists

The previous prototype of this app became a black box — unreadable and undebuggable by its own author. This document exists to prevent a repeat. Every structural decision below was made against one test:

> **When something is wrong, can I find the responsible function in under a minute without re-reading the whole codebase?**

Where that goal conflicts with elegance, brevity, or cleverness, this document picks traceability. That trade is deliberate and should be defended in review, not quietly optimized away later.

### The four decisions that shaped everything else

| Decision | Choice | Consequence |
|---|---|---|
| Stack | React + TypeScript + Vite | Logic is quarantined outside React; the framework is a rendering detail |
| Persistence | One JSON document in `localStorage` | Entire app state readable in one DevTools glance; export is that string |
| Cycle boundary | Fixed calendar weeks (Mon–Sun) | No `Cycle` entity needed; weeks are computed, never stored |
| Logging methods | Interchangeable units | A method is a label on an entry, not a conversion rate |

### The one architectural rule everything else follows

**Nothing that can be computed is ever stored.**

Quest tallies, spire height and condition, neglect prompts, weekly summaries — all derived from logs on read. Stored state and derived state cannot disagree if derived state does not exist. This single rule eliminates the most common source of "the app says X but the data says Y" bugs, which is the specific failure mode that makes a codebase feel like a black box.

There are exactly **three** exceptions, listed in §2.7. Each is justified there. Adding a fourth should require a real argument.

---

## 0.1 Standing rule: review before commit

> **No change in this repository — code, documentation, or configuration — is committed or pushed without the author's explicit review and go-ahead.**

The working method is: show the change, explain what it does and why, then wait. Not "commit and let the author revert if they disagree."

This rule is written into the architecture document rather than left in chat history on purpose. It binds **every** session, including one that begins by reading this file with no other context and no memory of how it was agreed. If you are an assistant reading this document at the start of a session, this rule applies to you and was not superseded by anything you can't see.

Two working constraints follow from the same reasoning:

- **Small, reviewable increments.** One module or one clear piece of functionality per pass — not sweeping multi-file changes. See the implementation sequence in §10.
- **Either author can write any module.** The architecture must stay simple enough to read, understand, and modify without the original writer re-explaining it. A pattern that only makes sense to whoever wrote it is a defect, not a style preference.

---

## 1. Layer model and dependency direction

Five layers. Dependencies point **one way only** — downward in this list. A module may import from layers below it, never above, never sideways within `core/`.

```
  ui/          React components. Render state, call actions. No rules.
    ↓
  state/       The single hook that holds state, applies actions, persists.
    ↓
  actions/     Pure (state, payload) => newState functions. The only writers.
    ↓
  core/        Pure rules: tallies, spire derivation, neglect, dates. No React.
    ↓
  model/       Type definitions and factories. No logic at all.

  storage/     Sits beside actions/. Reads and writes the JSON document.
```

**Why this matters for debugging:** if a number on screen is wrong, the bug is in `core/`. If a change didn't stick, the bug is in `actions/` or `storage/`. If the data is right but the screen is wrong, the bug is in `ui/`. The layer tells you which third of the codebase to open. That is the entire point of the split.

**The React containment rule:** `model/`, `core/`, `actions/`, and `storage/` contain **zero React imports**. This is checkable mechanically (`grep -r "from 'react'" src/model src/core src/actions src/storage` should return nothing) and should be checked. It means every rule in the application can be read, tested, and modified by someone who does not know React — including you, on a day when you don't want to think about hooks.

---

## 2. Data model

Presented as plain TypeScript type declarations. These are shapes, not ORM entities — there is no ORM, no schema migration engine, no query layer. The whole database is a JSON object.

### 2.1 Root document

Everything lives under one root object. This is what `localStorage` holds, what export produces, and what import consumes.

```ts
type AppState = {
  schemaVersion: number          // integer, bumped on breaking shape changes
  domains: Domain[]
  quests: Quest[]
  logEntries: LogEntry[]
  daySessions: DaySession[]
  dismissedPrompts: DismissedPrompt[]
  settings: Settings
  meta: {
    createdAt: string            // ISO 8601
    lastOpenedAt: string         // ISO 8601
  }
}
```

**Flat arrays, not nested trees.** Quests are not nested inside domains; they carry a `domainId`. This is the boring choice on purpose:

- Updating one quest doesn't require walking into a domain and rebuilding a nested structure.
- The JSON stays scannable — you can read the whole `quests` array in DevTools without collapsing three levels.
- Relationships are visible as plain string IDs you can search for (`Cmd-F` for the ID finds every reference).

The cost is that "give me a domain's quests" requires a `.filter()`. That cost is one line, in one place (`core/selectors.ts`), for a dataset of at most a few dozen quests.

### 2.2 Domain (a spire)

```ts
type Domain = {
  id: string                     // e.g. "dom_fitness"
  name: string                   // "Fitness"
  order: number                  // left-to-right position on the skyline
  createdAt: string              // ISO 8601
  archivedAt: string | null      // set instead of deleting; hides from skyline
}
```

**Note what is absent: there is no `height` field and no `condition` field.** Both are derived by `core/spire.ts` every time the spire is displayed — see §3 for the two rules and §5(b) for the reasoning. A `Domain` row stores identity and nothing about how the domain is doing.

Archiving rather than deleting preserves the log history that neglect detection and any future Growth Points calculation depend on. Deletion of a domain with history should not be offered in the UI.

### 2.3 Quest

```ts
type Quest = {
  id: string                     // e.g. "qst_evening_walk"
  domainId: string               // → Domain.id
  title: string                  // "Go for an evening walk"

  targetCount: number            // e.g. 4
  window: 'day' | 'week'         // the period targetCount applies to
  unitLabel: string              // "times", "sessions", "walks" — display only

  methods: QuestMethod[]         // always ≥ 1 entry, even for single-method quests
  suggestedDays: number[] | null // 0=Sun..6=Sat. DISPLAY ONLY — never gates logging

  createdAt: string
  retiredAt: string | null       // retired quests keep their logs, leave the daily list
  notes: string | null           // optional free text, e.g. calibration reasoning
}

type QuestMethod = {
  id: string                     // e.g. "mth_pushups"
  label: string                  // "Push-ups"
}
```

Three things worth stating explicitly, because each prevents a category of confusion later:

**`methods` is never empty.** A reading quest has exactly one method (`{ id: 'mth_default', label: 'Logged' }`). Single-method and multi-method quests take the same code path. There is no `if (quest.methods)` branch anywhere in the codebase. Uniformity here is worth the one redundant object.

**Methods are interchangeable units.** Per your decision: logging *any* method adds `LogEntry.count` toward the same `targetCount`. There is no per-method conversion rate and no per-method sub-target. Push-ups and squats each contribute 1 toward "4 strength sessions this week." If a future version needs weighting, §7 notes where it would go.

**`suggestedDays` is display-only, and this is load-bearing.** Per spec §3, quests stay visible every day and logging early or banking ahead is always allowed. `suggestedDays` drives *only* whether a quest renders greyed out. No function in `actions/` or `core/tally.ts` may read this field. If a bug report is ever "it won't let me log on a non-scheduled day," the cause is that somebody violated this rule — and there is exactly one field to grep for.

### 2.4 LogEntry

The append-heavy table. Everything else in the app is derived from these.

```ts
type LogEntry = {
  id: string
  questId: string                // → Quest.id
  methodId: string               // → QuestMethod.id within that quest
  count: number                  // usually 1
  forDate: string                // "YYYY-MM-DD" — the day this counts toward
  loggedAt: string               // ISO 8601 — when the button was actually pressed
}
```

**`forDate` and `loggedAt` are different fields on purpose.** Per spec §5, the daily session is anchored to a commute or bedtime — which means you will routinely log at 11:40pm for that day, and sometimes log the next morning for the day before. `forDate` is what every tally and every week-boundary calculation uses. `loggedAt` is never used in a rule; it exists so that when a tally looks wrong, you can see when the entry was actually created and reconstruct what happened.

`forDate` is a plain `"YYYY-MM-DD"` string, not a `Date`. Reasons: it survives JSON round-trips unchanged, it sorts lexicographically, it is readable when you eyeball the stored document, and it has no timezone semantics to get wrong. All calendar math lives in `core/dates.ts` and operates on these strings.

**Corrections are deletions.** A mis-tap is fixed by removing the entry from the array. Soft-delete tombstones are deliberately not used — they double the reasoning burden on every tally for a benefit the MLP doesn't need. §7 notes the one future feature that might change this.

### 2.5 DaySession

Records that the daily ritual happened, and carries the optional reflection.

```ts
type DaySession = {
  date: string                   // "YYYY-MM-DD" — one session per day, max
  closedAt: string               // ISO 8601
  reflection: string | null      // capped at settings.reflectionCharLimit
}
```

A `DaySession` is created when you close out the day. Its absence means the day wasn't closed — which is *not* a failure state and must never be rendered as one (spec §5: low-energy days are a fine outcome). It exists so the daily view can show "already closed" rather than prompting twice, and so reflections have a home without a separate entity.

The reflection is capped and optional per spec §5. It is not a journal and the architecture should not let it drift into one — there is no reflection browser, search, or tag system in the MLP.

### 2.6 DismissedPrompt

```ts
type DismissedPrompt = {
  kind: 'neglect'
  domainId: string
  weekKey: string                // "2026-W31" — the week the prompt fired for
  dismissedAt: string
}
```

Keyed by `weekKey` so that dismissing this cycle's prompt does not suppress the next one. See §2.7 for why this is stored rather than derived.

### 2.7 Settings, and the three exceptions to the derive-everything rule

```ts
type Settings = {
  reflectionCharLimit: number    // default 500
  weekStartsOn: 0 | 1            // 0=Sunday, 1=Monday. Default 1.
}
```

Three pieces of state are stored rather than derived. Each is a genuine user decision that cannot be reconstructed from logs:

1. **`dismissedPrompts`** — "I've seen this neglect prompt and dealt with it" is a choice, not a fact about the log history.
2. **`daySessions`** — "I closed out today" is distinct from "I logged something today." You can close a day having logged nothing.
3. **`settings`** — configuration by definition.

Everything else — every tally, every spire height and condition, every neglect determination, every weekly summary — is computed. If you find yourself wanting to add a fourth stored field, that is the moment to stop and check whether you're about to introduce a state-drift bug.

### 2.8 Derived view types — never stored

These shapes are produced by `core/` and consumed by `ui/`. They live in `model/types.ts` alongside the stored entities, under a clearly separated heading, so there is still exactly one file to open to see the shape of anything. The heading is the boundary marker: **nothing below it ever appears inside `AppState`.**

```ts
// ── Derived — computed on read, never persisted ──────────────

type SpireCondition = 'thriving' | 'steady' | 'crumbling'

type SpireHeight = {
  heightWeeks: number            // qualifying weeks, all-time. Monotonic.
  heightTier: number             // 0..5 — the render bucket for heightWeeks
}

type DomainSpire = SpireHeight & {
  condition: SpireCondition
}
```

`heightWeeks` is the honest record; `heightTier` is the rendering bucket derived from it via `rules.HEIGHT_TIER_THRESHOLDS`. Keeping both means `ui/components/Spire.tsx` never does arithmetic — it receives a tier and picks a sprite — while the underlying number stays inspectable when a tier looks wrong.

If either of these ever acquires a matching field on a stored entity, something has gone wrong. See §5(b).

---

## 3. The rules, in one place

All tunable thresholds live in `core/rules.ts` as named constants. Not scattered as magic numbers, not in a config UI, not in the components. One file. When the citadel behaves in a way you don't like, this is the first file you open.

```ts
// core/rules.ts

/** Consecutive completed calendar weeks with zero contributions
 *  before a domain is considered neglected. Spec §7. */
export const NEGLECT_WEEKS = 2

/** Consecutive completed weeks in which every active quest in a domain
 *  met its target, before condition reads as 'thriving'. */
export const THRIVING_STREAK_WEEKS = 2

/** Fraction of a quest's target that counts as "met".
 *  1.0 = must hit target exactly. */
export const TARGET_MET_RATIO = 1.0

/** heightWeeks values at which the spire gains a visible tier.
 *  heightTier = how many of these are ≤ heightWeeks, so 0..5. */
export const HEIGHT_TIER_THRESHOLDS = [1, 4, 12, 26, 52]
```

### The spire is two values, not one

A spire is described by **two independent derived values**, computed separately and rendered together:

- **Height** — cumulative depth of practice in this domain, all-time. Never decreases.
- **Condition** — how the domain is doing *right now*, from recent weeks only.

**Why this is split.** A single mutually-exclusive state cannot tell apart a domain that was built up over months and then lapsed from one that was never touched at all — both fall through to the same default. That collapses the one thing the spire is supposed to communicate. Two axes fix it: the lapsed domain renders **tall and visibly weathering**, the untouched one renders as **bare ground**. Height carries the history; condition carries the present.

Both remain fully derived. No new stored state was introduced to make this work.

### Height rule

`core/spire.ts` → `deriveHeight()`:

```
deriveHeight(domain, quests, logs, today) → { heightWeeks, heightTier }

  Consider every COMPLETED calendar week from the domain's first
  log entry through the most recent completed week.

  A week qualifies if ≥1 quest in the domain met its target during it.
  Retired quests count — past practice is still past practice.

  heightWeeks = number of qualifying weeks. Monotonic: never decreases.
  heightTier  = count of HEIGHT_TIER_THRESHOLDS entries ≤ heightWeeks
```

Three deliberate choices here:

**One quest is enough for a week to qualify.** Not *every* quest — that is the bar for `thriving`, and reusing it would mean a domain holding five quests almost never gains height, with each newly added quest silently stalling growth. The looser bar is what lets the two axes tell different stories.

**Height never decreases.** You did practice those weeks; that is a fact about the past and the spire is a record of what was practiced. All recency signal lives in `condition`. The practical benefit when debugging: a height that went *down* is unambiguously a bug, never a tuning question.

**Only completed weeks count.** Same boundary as the neglect rule, and it means the skyline does not shift mid-week — height changes on Monday or not at all.

### Condition rule

`core/spire.ts` → `deriveCondition()`. Checked in this order; order is part of the rule:

```
deriveCondition(domain, quests, logs, today) → SpireCondition

  1. If the domain has NO log entries at all, ever      → 'steady'
  2. If neglected (see below)                           → 'crumbling'
  3. If the domain has ≥1 ACTIVE quest
     AND every active quest met its target in each of
     the last THRIVING_STREAK_WEEKS completed weeks     → 'thriving'
  4. Otherwise                                          → 'steady'
```

Neglect beats thriving. A domain that was flourishing and then abandoned weathers — intended behavior per spec §4.

**Both guards exist to stop a specific silent bug. Do not remove them as redundant:**

- **Rule 1** stops a brand-new domain with *zero logs, ever* from rendering as `crumbling`. It only covers that one case, though — a domain with *some* logs, all still within the current in-progress week, gets past rule 1 fine. That second case trips `isNeglected` for the same underlying reason (see the Neglect rule below), so it's guarded there instead, once, rather than duplicated at every call site.
- **Rule 3's "≥1 active quest" clause** stops vacuous truth. "Every quest in an empty set met its target" evaluates to `true` in every language, so a domain with no active quests would render as `thriving` without this check.

`deriveSpire()` wraps both functions and returns a `DomainSpire`. That is what `core/selectors.ts` calls; views never call the two halves separately.

### Mapping to the spec's vocabulary

Spec §4 names three spire states. This model has two axes instead, so a reader holding both documents needs the bridge:

| Spec §4 term | This model |
|---|---|
| **Completed** | `condition: 'thriving'` |
| **Crumbling** | `condition: 'crumbling'` |
| **Scaffolding** | `condition: 'steady'` — actively under construction, neither flourishing nor neglected |
| *(no spec term)* | **Height** — the new axis; the spec had no way to express accumulated history |

The spec's intent is preserved. What it lacked was a way to say "tall *and* crumbling," which is precisely the state the rebuild-after-lapse case needs.

### Render combinations

`ui/components/Spire.tsx` receives `{ heightTier, condition }` and picks a sprite. The pairs that matter:

| heightTier | condition | Reads as |
|---|---|---|
| 0 | `steady` | Bare plot. Never practiced. |
| 1–2 | `steady` | Low structure, scaffolding up. |
| 1–2 | `thriving` | Low structure, actively building. |
| 3–5 | `thriving` | Tall and well-kept. |
| 3–5 | `crumbling` | **Tall and visibly weathering** — built, then lapsed. |
| 0 | `crumbling` | Rare, not strictly unreachable — see note below. |

The first and last-reachable rows are the entire reason for this design. They must not look alike.

**0-height crumbling is now rare rather than impossible.** It was briefly *believed* unreachable (condition rule 1 alone), until real use surfaced the gap that decision 8 in §9 fixes. After that fix it's still technically reachable one way: a domain that logged *some* activity in a completed week — never enough to hit any quest's target, so no height accrued — and then went fully silent in the most recent `NEGLECT_WEEKS`. That's a domain with genuine (if unproductive) history that then lapsed, which is arguably still an honest thing for `crumbling` to say. See the open question in §9 about whether "neglected" should mean *zero logged activity* (current behavior) or *zero quests actually completed*, which is closer to spec §7's literal wording.

**Provisional, and isolated on purpose:** the `thriving` rule is a stand-in. Spec §4 ties this notion to proximity to a *mastery threshold*, and Mastery Tree depth is deferred (spec §9). When it arrives, rule 3 is the only line that changes — see §7.

**Performance note.** `deriveHeight` scans all history for each domain on every render. Realistically that is ~9,000 log entries across ~6 domains, comfortably sub-millisecond, so no memoization is being built. If it ever does matter, the fix is to memoize on `logEntries.length` — do that when a profiler says to, not before.

### Neglect rule

`core/neglect.ts`, per your decision on fixed calendar weeks:

```
isNeglected(domainId, quests, logs, today) →
  If the domain has no logs at all, or its earliest log is still
  within the current in-progress week (no completed week has
  passed since it started) → NOT neglected. There's no completed-
  week history yet to judge — that isn't the same thing as
  abandonment, even though both currently sum to zero contributions
  in the completed-weeks window below.

  Take the last NEGLECT_WEEKS *completed* calendar weeks.
  (The current in-progress week is excluded — you can't be
   neglecting a week that hasn't finished.)
  Sum all LogEntry.count for quests in this domain with
  forDate inside those weeks.
  Neglected if that sum is zero.
```

Note this is scoped at domain level, not quest level, per spec §7. A single quest lapsing is not a trigger.

**The "too new to judge" guard is load-bearing, not defensive extra.** Without it, logging into a brand-new domain today reads identically to a domain abandoned two weeks ago — both sum to zero in the completed-weeks window, since today's log falls in the excluded in-progress week. This guard lives here, inside `isNeglected`, rather than only at each call site, specifically so `findNeglectedDomains` (the neglect-prompt trigger) gets the same protection `deriveCondition`'s crumbling check gets, from one place. Found via real use (see §9, decision 8) — not caught by design review, which is exactly why it's called out this explicitly now.

---

## 4. Module and file structure

```
inner-citadel/
├── index.html
├── package.json
├── vite.config.ts                  # Vite + PWA plugin config. Touched twice, ever.
├── tsconfig.json
├── docs/
│   └── architecture.md             # this document
└── src/
    ├── main.tsx                    # Mounts <App/> into the DOM. Nothing else.
    ├── App.tsx                     # Holds the state hook; switches between views.
    │
    ├── model/                      # ── Shapes only. Zero logic. Zero imports. ──
    │   ├── types.ts                # Every type in §2, in one readable file.
    │   ├── ids.ts                  # newId(prefix) → "qst_a1b2c3". Nothing else.
    │   └── factories.ts            # emptyAppState(), newQuest(), newDomain().
    │
    ├── core/                       # ── Pure rules. No React, no storage, no DOM. ──
    │   ├── rules.ts                # All tunable thresholds as named constants.
    │   ├── dates.ts                # Week boundaries, day keys, week keys, ranges.
    │   ├── tally.ts                # Quest progress: logs → { current, target, met }.
    │   ├── spire.ts                # deriveHeight() + deriveCondition() per domain.
    │   ├── neglect.ts              # isNeglected(), findNeglectedDomains().
    │   └── selectors.ts            # Composes the above into view-ready objects.
    │
    ├── actions/                    # ── The only code that produces new state. ──
    │   ├── logActions.ts           # logContribution(), removeLogEntry().
    │   ├── questActions.ts         # addQuest(), editQuest(), retireQuest().
    │   ├── domainActions.ts        # addDomain(), renameDomain(), archiveDomain().
    │   ├── sessionActions.ts       # closeDay(), saveReflection().
    │   └── promptActions.ts        # dismissNeglectPrompt().
    │
    ├── storage/                    # ── The JSON document boundary. ──
    │   ├── storage.ts              # load(), save() against one localStorage key.
    │   ├── migrate.ts              # schemaVersion upgrades, oldest → newest.
    │   └── transfer.ts             # exportToFile(), importFromFile() + validation.
    │
    ├── state/
    │   └── useAppState.ts          # THE hook. Holds state, applies actions, persists.
    │
    ├── ui/
    │   ├── views/
    │   │   ├── CitadelView.tsx     # The skyline. Spires only.
    │   │   ├── DailyView.tsx       # Today's quests + close-out + reflection.
    │   │   ├── DomainView.tsx      # One domain expanded: its quests and detail.
    │   │   ├── QuestEditorView.tsx # Add / edit / retire a quest.
    │   │   └── SettingsView.tsx    # Export, import, preferences.
    │   └── components/
    │       ├── Spire.tsx           # Renders one spire in one of three states.
    │       ├── QuestRow.tsx        # One quest: title, progress, log button(s).
    │       ├── ProgressBar.tsx     # Pixel-art progress indicator.
    │       └── NeglectPrompt.tsx   # The reflection prompt + dismiss.
    │
    └── dev/
        └── DebugPanel.tsx          # Raw state dump, derived-value inspector.
```

### One-line responsibilities

| Module | Single reason to exist |
|---|---|
| `main.tsx` | Mount the React tree. |
| `App.tsx` | Own the state hook and decide which view is on screen. |
| `model/types.ts` | Define the shape of every entity, in one place. |
| `model/ids.ts` | Generate unique, prefixed, human-readable IDs. |
| `model/factories.ts` | Produce valid new entities with defaults filled in. |
| `core/rules.ts` | Hold every tunable threshold as a named constant. |
| `core/dates.ts` | Convert between dates, day keys, week keys, and week ranges. |
| `core/tally.ts` | Compute one quest's progress within its current window. |
| `core/spire.ts` | Derive one domain's spire height and condition (`deriveHeight`, `deriveCondition`, `deriveSpire`). |
| `core/neglect.ts` | Decide whether a domain has gone untouched for two completed weeks. |
| `core/selectors.ts` | Assemble the above into the exact objects each view renders. |
| `actions/logActions.ts` | Add or remove a contribution. |
| `actions/questActions.ts` | Create, edit, or retire a quest. |
| `actions/domainActions.ts` | Create, rename, reorder, or archive a domain. |
| `actions/sessionActions.ts` | Close out a day and attach its optional reflection. |
| `actions/promptActions.ts` | Record that a neglect prompt was dismissed. |
| `storage/storage.ts` | Read and write the single JSON document. |
| `storage/migrate.ts` | Bring an older stored document up to the current schema. |
| `storage/transfer.ts` | Export state to a file and import it back safely. |
| `state/useAppState.ts` | Hold current state, apply actions to it, persist the result. |
| `ui/views/*` | Render one screen. |
| `ui/components/*` | Render one repeated visual element. |
| `dev/DebugPanel.tsx` | Show raw stored state and recomputed derived values side by side. |

### The action signature

Every function in `actions/` has the same shape, and there is no dispatcher, no action-type string, no reducer switch, no middleware:

```ts
logContribution(state: AppState, payload: {...}) => AppState
```

Pure in, pure out. Consequences worth having:

- Any action can be tested in three lines with no browser and no React.
- In DevTools you can call an action on a copy of your state and inspect the result before trusting it.
- There is no indirection between "I clicked the button" and "this function ran." The click handler calls the function by name.

This is simpler than Redux, not a variant of it. If you find yourself adding action-type constants, the architecture has drifted.

### Modules that know about more than one other module — the debugging hot spots

Four modules legitimately span boundaries. These are where bugs will be hardest to localize, so they are named here up front and kept as thin as possible.

**`core/selectors.ts`** — imports `tally`, `spire`, `neglect`, and `dates`. This is intentional; it is the composition point that keeps views from having to know about four modules each. *The constraint that keeps it safe:* selectors may only **call** those modules' exported functions. It may never reimplement a rule, inline a threshold, or make its own decision about spire state. If a rule appears in `selectors.ts`, that is a bug, regardless of whether the output looks right.

**`state/useAppState.ts`** — imports every action module plus `storage`. Unavoidable: something has to be the seam between "a change happened" and "it got saved." It is kept to roughly 40 lines and contains no rules whatsoever.

**`storage/migrate.ts`** — must know both old and new shapes of the data. Inherently double-knowledge; there is no way around it. Mitigated by writing each migration as a separate small function (`v1_to_v2`, `v2_to_v3`) applied in sequence, never one branching mega-function.

**`App.tsx`** — knows every view. Normal for a root component. It should contain routing and nothing else; the moment business logic appears here, it belongs in `core/` or `actions/`.

**No other module should import more than one sibling.** If a fifth appears on this list, that is a signal to reconsider, not to extend the list.

---

## 5. State flows, end to end

### (a) Logging a quest contribution

```
1. ui/components/QuestRow.tsx
   Tap a method button. onClick calls the handler passed down as a prop.

2. state/useAppState.ts
   apply(logActions.logContribution, { questId, methodId, count: 1,
                                       forDate: dates.todayKey() })

3. actions/logActions.ts → logContribution(state, payload)
   Builds a LogEntry via model/factories.ts + model/ids.ts.
   Returns { ...state, logEntries: [...state.logEntries, entry] }.
   Writes nothing. Computes no totals. Touches no other entity.

4. state/useAppState.ts
   setState(newState), then storage.save(newState).

5. React re-renders.

6. core/selectors.ts → getDailyView(state, today)
   Calls core/tally.ts for each visible quest.

7. core/tally.ts → questProgress(quest, logs, today)
   Uses core/dates.ts to get the current window's date range,
   filters logEntries by questId and forDate-in-range,
   sums count, compares to targetCount.

8. ui/components/ProgressBar.tsx renders the new number.
```

**The thing to internalize:** step 3 does not update a total anywhere. There is no `quest.currentCount` field to fall out of sync. The number on screen in step 8 is recomputed from the log array every render. If the displayed total is wrong, the bug is in `tally.ts` or `dates.ts` — never in `logActions.ts`, because `logActions.ts` doesn't know what a total is.

### (b) A domain's spire changes appearance

**Nothing changes it.** There is no transition function, no state machine, no event. This flow exists only in the sense that a *render* produces a different answer than the previous render did.

```
1. Any state change (a log added, a quest retired) OR the app opening
   on a new day causes a re-render.

2. ui/views/CitadelView.tsx calls core/selectors.ts → getCitadelView(state, today)

3. For each non-archived Domain, selectors calls
   core/spire.ts → deriveSpire(domain, quests, logs, today)

4. deriveSpire calls its two halves independently:

   a. deriveHeight  — walks every completed week since the domain's
      first log, asking core/tally.ts whether ≥1 quest met its target
      in that week. Returns { heightWeeks, heightTier }.

   b. deriveCondition — evaluates the four ordered rules in §3,
      calling core/neglect.ts for rule 2 and core/tally.ts for rule 3.
      Returns 'thriving' | 'steady' | 'crumbling'.

5. ui/components/Spire.tsx receives { heightTier, condition } and
   renders the matching pixel-art sprite (§3, render combinations).
```

**The two halves never consult each other.** `deriveHeight` does not know what `condition` is, and `deriveCondition` does not know how tall the spire is. That independence is what makes "tall and crumbling" expressible, and it means a wrong sprite is always traceable to one of the two functions rather than to an interaction between them.

**Different change rhythms, worth knowing when something looks frozen:** `heightWeeks` counts only completed weeks, so it can change *only* at a week boundary — a spire that hasn't grown mid-week is behaving correctly. `condition` is also computed over completed weeks and so moves on the same boundary, but it can move in either direction, and rule 1 means it stays `steady` until the domain's first log entry exists.

**Consequence for debugging:** a spire can never be "stuck," because nothing was stored to get stuck. If a spire looks wrong, one of the two functions is returning the wrong answer for the current data, and you can verify which in one console call each. There is no history to audit and no transition log to reconstruct.

**Consequence for the UI:** changes are silent — there's no event to hang an animation on. If you later want a "your spire gained a tier" moment, §7 notes where that would attach without giving up derivation.

### (c) The two-week neglect trigger fires

```
1. App opens, or the day rolls over. ui/views/DailyView.tsx (or CitadelView)
   calls core/selectors.ts → getNeglectPrompts(state, today)

2. core/neglect.ts → findNeglectedDomains(state, today)
   For each non-archived Domain:
     a. core/dates.ts → lastCompletedWeeks(today, rules.NEGLECT_WEEKS)
        returns the two most recent finished Mon–Sun ranges.
        The in-progress week is excluded.
     b. Gather quest IDs for this domain (including retired quests —
        past work still counts as past work).
     c. Sum LogEntry.count where forDate falls in those ranges.
     d. Zero → neglected.

3. Back in selectors: filter out any domain with a matching entry in
   state.dismissedPrompts for the current weekKey.

4. ui/components/NeglectPrompt.tsx renders the reflection prompt for
   whatever survives. Framing is a question, never a penalty (spec §7):
   "should this goal, or its difficulty, change?"

5. Dismissing calls actions/promptActions.ts → dismissNeglectPrompt(),
   which appends { kind:'neglect', domainId, weekKey } to dismissedPrompts.
   Because the record is keyed by weekKey, the prompt returns next
   cycle if the domain is still untouched.
```

**No scheduler, no background job, no timer.** The trigger is a question asked during render, not an event that fires. This means it cannot be missed while the app is closed, cannot double-fire, and cannot fire at 3am. If a prompt doesn't appear when you expect it, call `findNeglectedDomains(state, today)` in the console and read the answer directly.

---

## 6. Storage strategy

### On-disk shape

One `localStorage` key. That is the entire persistence layer.

```
Key:   "innerCitadel.v1"
Value: JSON.stringify(appState)

Key:   "innerCitadel.backup"
Value: the previous good document, written immediately before any import
```

To inspect the entire database: DevTools → Application → Local Storage → read the value. No object stores to click through, no async queries, no indexes.

### Size

Roughly: a `LogEntry` serializes to ~140 bytes. Five logs a day for five years is ~9,000 entries ≈ 1.3 MB, against a ~5 MB budget. Quests, domains, and sessions are negligible by comparison. Headroom is adequate for the MLP and well beyond it. `storage.ts` should still catch `QuotaExceededError` and surface it as a visible failure rather than a silent one — a save that fails quietly is exactly the black-box behavior this document exists to prevent.

### Read and write discipline

- **Load once, on app start.** `storage.load()` runs in `useAppState`'s initializer. Nothing else reads from `localStorage`.
- **Save after every state change**, debounced ~300ms so a burst of taps doesn't thrash. Writes are synchronous, so there is no async race and no ordering bug to chase.
- **`storage.ts` is the only module that touches the `localStorage` API.** Grep for `localStorage` — if it appears anywhere else, that is the bug.

### Missing or corrupt data

`storage.load()` returns a valid `AppState` or throws visibly. It never returns `undefined`, `null`, or a partial object, so no downstream module needs a defensive check.

```
load():
  raw = localStorage.getItem(KEY)
  if absent            → factories.emptyAppState()   (first run)
  if JSON.parse throws → surface a recoverable error offering
                         import-from-backup. Never silently reset.
  if schemaVersion < current → migrate.run(parsed)
  if schemaVersion > current → refuse to load; a newer document must
                         not be downgraded by an older build.
```

### Migrations

`migrate.ts` holds a list of single-step functions applied in order:

```ts
const migrations = [ v1_to_v2, v2_to_v3, /* ... */ ]
```

Each is small, independently readable, and never modified once shipped. Adding a field with a sensible default needs no migration — only breaking shape changes do. Bump `schemaVersion` only when the shape genuinely breaks.

### Export and import

Per spec §10, this is the backup story. There is no sync.

**Export** — `transfer.exportToFile()` serializes the current `AppState` to a downloaded `.json` file named `inner-citadel-YYYY-MM-DD.json`. The file is the same document that's in `localStorage`; there is no separate export format to keep in step.

**Import** — `transfer.importFromFile(file)`:

1. Parse. Reject unparseable input with a clear message.
2. Validate: `schemaVersion` present; `domains`, `quests`, `logEntries` are arrays. A shallow structural check, not a full schema validator — enough to catch "wrong file entirely," which is the realistic failure.
3. Write the current document to `innerCitadel.backup`.
4. Migrate the imported document if its `schemaVersion` is older.
5. Replace state wholesale and save.

**Import replaces; it does not merge.** Merging two divergent histories requires conflict resolution and identity reconciliation — real distributed-systems work, for a single-device app that has no way to produce a genuine conflict. Replacement is the honest behavior and the UI should say so plainly before proceeding.

---

## 7. Extension points — noted, not built

These are deferred per spec §9. Nothing below gets designed or built now. The point of this section is only to confirm that today's structure doesn't have to be torn up to accommodate them later.

**Growth Points** (spec §9)
Because `logEntries` is the append-only source of truth and no derived value is stored, GP *earnings* are computable from history retroactively — including for logs recorded before GP exists. A new `core/growth.ts` would compute earned points; the only genuinely new stored state is *spending* (a `growthSpends` array), since a spend is a choice and not reconstructable. That is one new array on `AppState` and one new `core/` module. Nothing existing changes.
*The one thing to watch:* GP would make log history economically meaningful, which weakens the "corrections are hard deletions" decision in §2.4. If GP is built, revisit that choice then — not now.

**Mastery Tree depth** (spec §9)
`Domain` gains a `nodes` field; a new `core/mastery.ts` computes node progress. The connection to today's code is exactly one branch: rule 3 in `deriveCondition` currently asks "did every active quest meet target for N weeks" and would instead ask `mastery.isThresholdReached(domain, ...)`. That one line is the entire integration surface, which is why §3 flags it as provisional and keeps it isolated.
*Second, smaller hook:* `HEIGHT_TIER_THRESHOLDS` is a plain week-count ladder today. If mastery nodes should drive tier instead, `deriveHeight`'s last line changes and `deriveCondition` is untouched — the two axes stay independently replaceable.

**Sentinel Mode** (spec §9, §10)
Requires native Android APIs, so it arrives with a Capacitor shell wrapping this same PWA. Architecturally it is a *new source of data*, not a change to existing flows — a `sentinel/` module producing its own entity type, kept out of `logEntries` since it isn't a quest contribution. The relevant protection today is that `storage.ts` is the single `localStorage` boundary: if the native shell needs a different persistence backend, one module changes and nothing above it notices.

**Formal weekly planning ritual UI** (spec §9)
A new view over existing data. Because weeks are computed by `core/dates.ts` rather than stored as entities, adding a weekly review screen needs no data model change at all.

**AI Quest Generator** (spec §9)
Scoped by the spec as a scaffolding tool for *authoring* quests, not a content engine — which keeps it entirely outside the runtime data flow. It would sit beside `ui/views/QuestEditorView.tsx` as a suggestion source: produce draft `Quest` objects via `model/factories.ts`, show them for editing, and hand the accepted one to `actions/questActions.addQuest()` like any hand-typed quest. Nothing in `core/` or `storage/` changes, and no new entity type is needed — a generated quest is just a quest.
*The constraint to hold:* this is the only prospective feature that needs network access, and Inner Citadel is offline-first (spec §10). Generation must stay strictly optional and strictly additive — quest authoring can never block on, or degrade without, a network call. If the generator is unreachable, the editor works exactly as it does today.

**Onboarding** (spec §8)
A view rendered when `domains` is empty, plus whatever identity-anchor fields that moment calls for. Deliberately not designed here.

**Spire transition moments**
If derived values later need to feel like events — an animation when a spire gains a height tier, or when condition drops to `crumbling` — the boring solution is to keep the last-rendered `DomainSpire` in memory and compare on render, without persisting it. Do not store height or condition to get an animation; that trade reintroduces exactly the drift this architecture exists to avoid. Height is the easier hook of the two, since it only ever increases and only at week boundaries.

---

## 8. If X breaks, look here

The section to read first when something is wrong.

| Symptom | Look here | How to inspect |
|---|---|---|
| **Quest won't save / log disappears on reload** | `storage/storage.ts` — is `save()` being called and is it throwing? Then `state/useAppState.ts` — did `apply()` actually call `setState`? | DevTools → Application → Local Storage → `innerCitadel.v1`. Is the entry in `logEntries`? If yes, it saved and the bug is in display. If no, it never got written. |
| **Progress number is wrong** | `core/tally.ts` first, `core/dates.ts` second. The window range is the usual culprit. | Console: `questProgress(quest, state.logEntries, todayKey())`. Then check `weekRange(todayKey())` returns the dates you expect. |
| **Contribution counted toward the wrong day or week** | `core/dates.ts`, and the `forDate` on the entry. | Read the raw entry's `forDate` vs `loggedAt`. If `forDate` is right but the tally is wrong, it's `dates.ts`. If `forDate` itself is wrong, it's whoever built the payload in `ui/`. |
| **Spire is the wrong height** | `core/spire.ts` → `deriveHeight`. Usually the per-week qualifying set: remember ≥1 quest is enough, retired quests count, and the in-progress week never counts. | Console: `deriveHeight(domain, quests, logs, todayKey())`. Compare `heightWeeks` against `HEIGHT_TIER_THRESHOLDS` by hand to see whether the bug is the count or the tier mapping. |
| **Spire height went *down*** | Always a bug, never tuning — height is monotonic by design (§3). Look for a filter in `deriveHeight` that reads recent weeks, or a quest whose `retiredAt` is excluding it from the historical scan. | Console: re-run `deriveHeight` and check whether the qualifying-week count dropped or only the tier did. |
| **Spire condition is wrong** | `core/spire.ts` → `deriveCondition`. Check the four rules **in order** — neglect beats thriving — and check both guards are intact (rule 1's "no logs ever", rule 3's "≥1 active quest"). | Console: `deriveCondition(domain, quests, logs, todayKey())`. Nothing is stored, so what this returns *is* what renders. |
| **Brand-new domain renders as crumbling** | Condition rule 1 was removed or bypassed. A new domain trips the neglect rule exactly like an abandoned one. | Check the domain has zero `logEntries` and confirm rule 1 fires before rule 2. |
| **Domain with no quests renders as thriving** | Rule 3's "≥1 active quest" guard is missing — "every quest in an empty set met its target" is vacuously `true`. | Count active (non-retired) quests for the domain; if zero, rule 3 must not be reachable. |
| **Neglect prompt didn't appear** | `core/neglect.ts` → `findNeglectedDomains`, then `state.dismissedPrompts`. | Console: run `findNeglectedDomains(state, todayKey())`. If the domain is listed, it was filtered by a dismissal — check `dismissedPrompts` for a matching `weekKey`. |
| **Neglect prompt won't go away** | `actions/promptActions.ts` — is the `weekKey` it writes the same one `selectors` filters on? | Compare the stored `weekKey` string against `dates.weekKey(todayKey())`. A mismatch here is the likely bug. |
| **Quest greyed out but shouldn't be / can't log on an off day** | `ui/components/QuestRow.tsx`. Something read `suggestedDays` as a gate. | Grep `suggestedDays` — it may appear only in rendering code. Any hit in `core/` or `actions/` is the bug. |
| **Import did nothing or wiped data** | `storage/transfer.ts` → validation step. | `innerCitadel.backup` holds the pre-import document. Recovery is possible; check it before doing anything else. |
| **App won't start after an update** | `storage/migrate.ts` — a migration threw, or `schemaVersion` is newer than the build. | Console: read `JSON.parse(localStorage['innerCitadel.v1']).schemaVersion` and compare to the current constant. |
| **UI won't update though data is correct** | `state/useAppState.ts` — an action mutated `state` instead of returning a new object. | Confirm every action returns `{ ...state, ... }`. React won't re-render on an in-place mutation. This is the single most likely React-specific bug in the codebase. |

**Two habits that make the above faster:**

`dev/DebugPanel.tsx` shows the raw stored document alongside recomputed derived values (each spire's `heightWeeks` / `heightTier` / `condition`, each quest tally, current neglect list). When display and data disagree, this tells you which side is lying, immediately. Showing `heightWeeks` next to `heightTier` matters — most "wrong height" reports are a tier-mapping problem, not a counting problem, and seeing both at once separates them instantly.

Expose `window.__ic = { state, core, actions }` in dev builds. Every rule in this app is a pure function, so the console is a genuine debugging tool — you can call any rule against your real data without touching the UI.

---

## 9. Decisions on record

These were open questions in the first draft. All are now settled. They are kept here rather than deleted so that a future reader — including a future session reading this file cold — can tell the difference between a deliberate choice and an unexamined default.

| # | Question | Decision | Where it lives |
|---|---|---|---|
| 1 | The "completed" spire rule | Reframed as the **`thriving` condition**, same underlying rule: every active quest met target for `THRIVING_STREAK_WEEKS` consecutive completed weeks. Still provisional pending Mastery Trees. | §3, condition rule 3 |
| 2 | Does a completed spire decay back to scaffolding? | **Superseded by the height/condition split.** It decays *gradually* — condition worsens while height persists. Nothing resets. | §3, the two-value model |
| 3 | `TARGET_MET_RATIO` | **Stays 1.0** — a quest counts as met only at 100% of target. Deferred for tuning after real use. | `core/rules.ts` |
| 4 | Day-window quests inside weekly rules | For `window: 'day'`, "met its target that week" means **the target was hit on every day the quest was active** that week. Deferred for tuning after real use. | `core/tally.ts` |
| 5 | Retired quests | Count toward **neglect** and **height** (past practice is still past practice); excluded from **`thriving`** credit (you can't be judged on a quest you retired). Asymmetry confirmed. | §3, both rules |
| 6 | What makes a week count toward height | **≥1 quest in the domain met its target.** Not every quest — that is the `thriving` bar, and reusing it would stall height for multi-quest domains. | §3, height rule |
| 7 | Does height ever decrease | **No — strictly monotonic.** All recency signal lives in `condition`. A height decrease is therefore always a bug, never tuning. | §3, height rule |
| 8 | Bug: a domain touched for the first time today read as `crumbling` | **Fixed.** `isNeglected` excludes the current in-progress week from its sum (correctly), but had no floor requiring any completed week to exist first — so a domain with no history yet summed to zero for the same reason genuine abandonment does. Found via real use: two domains with identical (zero) completed-week history rendered as `steady` and `crumbling` respectively, depending only on whether either had ever been logged into during the current week. Guard now lives inside `isNeglected` itself. | `core/neglect.ts`, §3 Neglect rule |

**Three constants are explicitly deferred for tuning after real use**, not left undecided by oversight: `TARGET_MET_RATIO`, `HEIGHT_TIER_THRESHOLDS`, and the day-window interpretation in decision 4. Each is a single named value in `core/rules.ts` or one function in `core/tally.ts`, so revisiting any of them is a one-line change. Per spec §11, real usage is what should validate or overturn them — not further design work now.

### Still genuinely open

**The `thriving` rule is provisional.** Spec §4 ties this notion to proximity to a *mastery threshold*, and Mastery Tree depth is deferred (spec §9). The current rule is a stand-in that produces sensible behavior today, isolated to one branch of one function so that when Mastery Trees arrive, exactly one line changes. See §7.

**Does "neglected" mean zero logged activity, or zero quests actually completed?** `isNeglected` currently sums raw `LogEntry.count` in the completed-weeks window — *any* logged effort, even far under target every time, counts as "not neglected." Spec §7's own wording is narrower: "zero contributing quests **completed** across two consecutive weekly planning cycles." Under the current code, a domain logged into weekly but never once hitting a target would never trigger the neglect prompt; under the spec's literal wording, it might should. Not changed as part of decision 8's fix — that was a clear bug with one obvious correct answer, this is a genuine design choice between two defensible readings, and conflating the two risks fixing a bug by accident redefining a rule nobody asked to redefine.

---

## 10. What implementation would look like, in order

Not a commitment — a proposed sequence, one reviewable increment at a time per your constraint. Each step is independently testable and produces something you can actually look at.

1. `model/types.ts` + `model/ids.ts` + `model/factories.ts` — the data model as code, nothing else. Small, and it makes §2 concrete enough to argue with.
2. `core/dates.ts` — pure date math, with tests. Everything else depends on getting this right, and it's the module most likely to harbor a subtle bug.
3. `storage/storage.ts` — load and save the document.
4. `core/tally.ts` — quest progress, with tests.
5. `actions/logActions.ts` + `state/useAppState.ts` — first end-to-end write path.
6. A crude `DailyView` + `QuestRow` — the first thing you can actually tap.
7. `core/spire.ts` + `core/neglect.ts` — the derived rules, with tests.
8. `CitadelView` + `Spire` — the skyline.
9. Remaining actions, `QuestEditorView`, `DomainView`.
10. `storage/transfer.ts` — export and import.
11. PWA manifest and service worker.
12. Pixel art and visual polish, last.

Steps 1, 2, 4, and 7 are pure functions with no React and no browser — they can be written and tested by either of us in isolation, which makes them the natural pieces to split.

### Notes for steps not yet built

Captured now so they aren't lost between conversations. None of this changes anything already built.

- **Desktop layout (touches step 9 and beyond).** Desktop isn't a different app — same components, more room. `CitadelView` and `DailyView` render side by side above some viewport width via CSS layout only; no new component, no new state, no platform-specific logic inside the views themselves.
- **The one genuinely platform-specific piece: storage location (step 9/10).** Manual export/import (built, §6) stays the phone path. Desktop should additionally be able to point storage at a real file — e.g. inside a Dropbox/Drive-synced folder — via the File System Access API, so syncing across desktops happens for free through whatever already syncs that folder, rather than manual export/import round-trips each time. This is a second storage backend behind the same `load()`/`save()` shape `storage.ts` already exposes — one module change, per the extension-point note in §7 about the native shell needing a different persistence backend. Scope this as its own increment: the File System Access API is Chromium-only (no Firefox/Safari desktop support), so it needs a feature-detected fallback to the existing manual flow, not a hard phone-vs-desktop branch.
- **Pixel art (step 12).** Non-integer scaling makes 8-bit sprites blurry, not crisp — this will read as a mistake on a large monitor even though the same asset looks fine on phone. When real sprites replace the current CSS block-stack placeholder in `Spire.tsx`: set `image-rendering: pixelated` on every sprite element, and size every instance at an integer multiple of the sprite's native resolution (2x, 3x, 4x…) — never an arbitrary width/height that lands between multiples.

---

*No implementation code will be written until this document is reviewed and approved.*
