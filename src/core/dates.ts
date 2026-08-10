// Calendar math over "YYYY-MM-DD" day keys. Weeks are fixed Mon-Sun,
// per the architecture decision in docs/architecture.md §0. No Date
// objects cross this module's boundary — everything else in the app
// works with day keys and week ranges only.

export type WeekRange = {
  startKey: string // Monday, "YYYY-MM-DD"
  endKey: string // Sunday, "YYYY-MM-DD"
  weekKey: string // "YYYY-Www", stable label for this week
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

/** The Monday, "YYYY-MM-DD", of the week containing `key`. */
export function weekStartKey(key: string): string {
  const dow = dayOfWeek(key)
  const diffToMonday = dow === 0 ? -6 : 1 - dow
  return addDays(key, diffToMonday)
}

/** Standard ISO week number, computed off the week's Monday. */
function isoWeekLabel(mondayKey: string): string {
  const monday = parseKey(mondayKey)
  const thursday = new Date(monday)
  thursday.setDate(monday.getDate() + 3)
  const year = thursday.getFullYear()
  const firstThursday = new Date(year, 0, 1)
  const firstThursdayDow = firstThursday.getDay() === 0 ? 7 : firstThursday.getDay()
  firstThursday.setDate(firstThursday.getDate() + (4 - firstThursdayDow))
  const weekNum =
    1 + Math.round((thursday.getTime() - firstThursday.getTime()) / (7 * 86_400_000))
  return `${year}-W${String(weekNum).padStart(2, '0')}`
}

/** The full Mon-Sun range containing `key`. */
export function weekRange(key: string): WeekRange {
  const startKey = weekStartKey(key)
  const endKey = addDays(startKey, 6)
  return { startKey, endKey, weekKey: isoWeekLabel(startKey) }
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
export function lastCompletedWeeks(today: string, n: number): WeekRange[] {
  const currentWeekStart = weekStartKey(today)
  const weeks: WeekRange[] = []
  let cursorEnd = addDays(currentWeekStart, -1)
  for (let i = 0; i < n; i++) {
    const cursorStart = addDays(cursorEnd, -6)
    weeks.push({ startKey: cursorStart, endKey: cursorEnd, weekKey: isoWeekLabel(cursorStart) })
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
export function completedWeeksSince(fromKey: string, today: string): WeekRange[] {
  const firstWeekStart = weekStartKey(fromKey)
  const lastCompletedStart = addDays(weekStartKey(today), -7)
  if (firstWeekStart > lastCompletedStart) return []

  const weeks: WeekRange[] = []
  let cursorStart = firstWeekStart
  while (cursorStart <= lastCompletedStart) {
    const cursorEnd = addDays(cursorStart, 6)
    weeks.push({ startKey: cursorStart, endKey: cursorEnd, weekKey: isoWeekLabel(cursorStart) })
    cursorStart = addDays(cursorStart, 7)
  }
  return weeks
}

export function isWithinRange(key: string, range: WeekRange): boolean {
  return key >= range.startKey && key <= range.endKey
}

/** The 7 day keys in `range`, Monday through Sunday. */
export function daysInRange(range: WeekRange): string[] {
  const days: string[] = []
  let cursor = range.startKey
  while (cursor <= range.endKey) {
    days.push(cursor)
    cursor = addDays(cursor, 1)
  }
  return days
}
