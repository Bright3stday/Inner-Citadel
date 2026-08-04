import { FORGE_WINDOW_DAYS, FORGE_HEAT_THRESHOLDS } from './rules'
import { addDays } from './dates'
import type { ForgeHeat, LogEntry } from '../model/types'

const STATES: ForgeHeat[] = ['cold', 'embers', 'low-flame', 'working-heat', 'striking']

function recentDayKeys(today: string, windowDays: number): string[] {
  return Array.from({ length: windowDays }, (_, i) => addDays(today, -i))
}

/**
 * A short-window, whole-app readout of recent momentum — deliberately
 * NOT driven by, and does not feed into, spire height or condition
 * (those are weekly and barely move day to day; this is the thing
 * that visibly responds to today). Never stored, recomputed on every
 * render, same discipline as everything else derived.
 */
export function deriveForgeHeat(logs: LogEntry[], today: string): ForgeHeat {
  const window = new Set(recentDayKeys(today, FORGE_WINDOW_DAYS))

  const recentCount = logs
    .filter((log) => window.has(log.forDate))
    .reduce((sum, log) => sum + log.count, 0)

  const tier = FORGE_HEAT_THRESHOLDS.filter((threshold) => recentCount >= threshold).length
  return STATES[tier]
}
