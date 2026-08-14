// Calendar math over "YYYY-MM-DD" day keys. Weeks are fixed calendar
// weeks (not rolling 7-day windows), per the architecture decision in
// docs/architecture.md §0 — but which day they START on is a real
// setting (Settings.weekStartsOn, §2.7), threaded through every
// function below as an explicit parameter rather than assumed. No
// Date objects cross this module's boundary — everything else in the
// app works with day keys and week ranges only.

export type WeekRange = {
  startKey: string // the week's first day, "YYYY-MM-DD"
  endKey: string // the week's last day, "YYYY-MM-DD"
  weekKey: string // stable label for this week — just startKey; unique and correct for any weekStartsOn
}

function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d) // local midnight
}

function formatKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayKey(): string {
  return formatKey(new Date())
}

export function addDays(key: string, n: number): string {
  const date = parseKey(key)
  date.setDate(date.getDate() + n)
  return formatKey(date)
}

/** 0=Sun .. 6=Sat */
export function dayOfWeek(key: string): number {
  return parseKey(key).getDay()
}

/** The first day, "YYYY-MM-DD", of the week containing `key`. */
export function weekStartKey(key: string, weekStartsOn: 0 | 1): string {
  const dow = dayOfWeek(key) // 0=Sun..6=Sat
  const diffToStart = weekStartsOn === 1 ? (dow === 0 ? -6 : 1 - dow) : -dow
  return addDays(key, diffToStart)
}

/** The full week range containing `key`. */
export function weekRange(key: string, weekStartsOn: 0 | 1): WeekRange {
  const startKey = weekStartKey(key, weekStartsOn)
  const endKey = addDays(startKey, 6)
  return { startKey, endKey, weekKey: startKey }
}

/**
 * The last `n` calendar month labels ("YYYY-MM"), oldest first, ending
 * with the month containing `today`. Independent of any quest/log
 * data — used so a monthly table's column headers are fixed and every
 * row lines up under them, regardless of how much history each row's
 * own quest happens to have.
 */
export function lastMonths(today: string, n: number): string[] {
  const [y, m] = today.split('-').map(Number)
  const labels: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const total = y * 12 + (m - 1) - i
    const yy = Math.floor(total / 12)
    const mm = (total % 12) + 1
    labels.push(`${yy}-${String(mm).padStart(2, '0')}`)
  }
  return labels
}

/**
 * The `n` most recently COMPLETED weeks, excluding the current
 * in-progress week. Most recent first.
 */
export function lastCompletedWeeks(today: string, n: number, weekStartsOn: 0 | 1): WeekRange[] {
  const currentWeekStart = weekStartKey(today, weekStartsOn)
  const weeks: WeekRange[] = []
  let cursorEnd = addDays(currentWeekStart, -1)
  for (let i = 0; i < n; i++) {
    const cursorStart = addDays(cursorEnd, -6)
    weeks.push({ startKey: cursorStart, endKey: cursorEnd, weekKey: cursorStart })
    cursorEnd = addDays(cursorStart, -1)
  }
  return weeks
}

/**
 * Every COMPLETED week from the week containing `fromKey` through the
 * most recently completed week, ascending. Empty if `fromKey` falls
 * inside the current in-progress week (nothing has completed yet).
 * Used by core/spire.ts to scan a domain's full history for height.
 */
export function completedWeeksSince(fromKey: string, today: string, weekStartsOn: 0 | 1): WeekRange[] {
  const firstWeekStart = weekStartKey(fromKey, weekStartsOn)
  const lastCompletedStart = addDays(weekStartKey(today, weekStartsOn), -7)
  if (firstWeekStart > lastCompletedStart) return []

  const weeks: WeekRange[] = []
  let cursorStart = firstWeekStart
  while (cursorStart <= lastCompletedStart) {
    const cursorEnd = addDays(cursorStart, 6)
    weeks.push({ startKey: cursorStart, endKey: cursorEnd, weekKey: cursorStart })
    cursorStart = addDays(cursorStart, 7)
  }
  return weeks
}

export function isWithinRange(key: string, range: WeekRange): boolean {
  return key >= range.startKey && key <= range.endKey
}

/** The 7 day keys in `range`, in order from its start day. */
export function daysInRange(range: WeekRange): string[] {
  const days: string[] = []
  let cursor = range.startKey
  while (cursor <= range.endKey) {
    days.push(cursor)
    cursor = addDays(cursor, 1)
  }
  return days
}
