// All tunable thresholds, in one place. See docs/architecture.md §3.
// When the citadel behaves in a way you don't like, this is the first file to open.

/** Consecutive completed calendar weeks with zero contributions
 *  before a domain is considered neglected. Spec §7. */
export const NEGLECT_WEEKS = 2

/** Consecutive completed weeks in which every active quest in a domain
 *  met its target, before the domain's condition reads as 'thriving'. */
export const THRIVING_STREAK_WEEKS = 2

/** Fraction of a quest's target that counts as "met" for spire purposes.
 *  1.0 = must hit target exactly. Deferred for tuning after real use. */
export const TARGET_MET_RATIO = 1.0

/** heightWeeks thresholds that bump the render tier (0..5).
 *  A domain crosses into tier N once heightWeeks >= thresholds[N-1].
 *  Deferred for tuning after real use. */
export const HEIGHT_TIER_THRESHOLDS = [1, 4, 12, 26, 52]

/** How many trailing days (today inclusive) count toward forgeHeat.
 *  A calibration guess, not a considered value — correct after real use. */
export const FORGE_WINDOW_DAYS = 3

/** Total LogEntry.count summed across the window, across ALL domains,
 *  that bumps forgeHeat to the next of its 5 states. A calibration
 *  guess, not a considered value — correct after real use. */
export const FORGE_HEAT_THRESHOLDS = [1, 3, 6, 10]
