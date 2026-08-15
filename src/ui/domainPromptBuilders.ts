// Prompts in the same copy-paste-only library as questGeneratorPrompt.ts,
// domain-specific so they need real data — built here at copy time
// rather than stored as static text. Still no AI calls from this app.

import { getQuestMonthlyBreakdown } from '../core/selectors'
import { todayKey } from '../core/dates'
import { MASTERY_NODE_PROMPT } from './masteryNodePrompt'
import type { AppState, Domain, Quest } from '../model/types'

const RECALIBRATE_LOOKBACK_MONTHS = 3

function questLine(quest: Quest): string {
  const methods = quest.methods.map((m) => m.label).join(', ')
  return `- "${quest.title}": ${quest.targetCount} ${quest.unitLabel} / ${quest.window}, methods: ${methods}`
}

/**
 * Recalibration prompt: current quests plus their real recent hit-rate
 * (from the same monthly breakdown Trends shows), so recalibration
 * advice is grounded in what's actually happened, not just the
 * targets as originally set.
 */
export function buildRecalibratePrompt(state: AppState, domain: Domain): string {
  const quests = state.quests.filter((q) => q.domainId === domain.id && !q.retiredAt && !q.isRecoveryQuest)
  const today = todayKey()

  const lines = quests.map((quest) => {
    const months = getQuestMonthlyBreakdown(state, quest, today, RECALIBRATE_LOOKBACK_MONTHS)
    const recent = months
      .map((m) => (m.total > 0 ? `${m.met + m.over}/${m.total}` : 'no data'))
      .join(', ')
    return `${questLine(quest)}. Last ${RECALIBRATE_LOOKBACK_MONTHS} months, hit rate by month (oldest first): ${recent}.`
  })

  return `You're helping recalibrate quests for one domain ("${domain.name}") inside a personal practice app called Inner Citadel. This is not a game to optimize — the goal is quests that actually match real capability and real available time, based on what's genuinely happened, not what was hoped for when they were set.

Current quests, with their real recent performance (a "hit" means the period's target was met or exceeded; the fraction is hits out of periods actually judged that month — periods where the quest was resting or reduced at the Inn are excluded, not counted as misses):

${lines.join('\n')}

For each quest, tell me:
1. Whether the target looks too easy, too hard, or about right, based on the actual hit-rate pattern above — not a guess.
2. A specific new number if a change is warranted, with your reasoning.
3. Whether a quest should be retired instead of adjusted — chronically near-zero performance over months may mean the goal itself was wrong, not just the number.
4. Whether a quest that's been consistently exceeded should be raised, or is actually fine to leave as an easy maintenance floor.

Keep it concrete and specific to the data above, not generic goal-setting advice. If the data is too sparse to say anything confident about a quest, say so rather than guessing.`
}

/**
 * Strategies prompt: just the current quests, wrapped in a request for
 * practical tactics to actually stay consistent with them — no
 * targets discussed, no data needed beyond what the quests already
 * are. Cheap on purpose: serializing existing data with a wrapper.
 */
export function buildStrategiesPrompt(domain: Domain, quests: Quest[]): string {
  const lines = quests.map(questLine)

  return `Here are my current quests for "${domain.name}" in a personal practice app called Inner Citadel:

${lines.join('\n')}

I'm not looking to change the targets — I want practical strategies for actually staying consistent with these as they are. Concrete tactics, environmental tweaks, or habit-stacking ideas grounded in how real practice actually sticks for this kind of thing, not generic productivity advice.`
}

/**
 * Mastery node prompt + this domain's current quests appended, so
 * Step 1's Q2 ("paste of my current quests") is already answered by
 * the time this lands in a conversation — the prompt's own preamble
 * already says to skip anything already answered. The prompt text
 * itself (masteryNodePrompt.ts) stays untouched and reusable
 * elsewhere; this only appends real data at copy time, same pattern
 * as the two prompts above.
 */
export function buildMasteryNodePrompt(domain: Domain, quests: Quest[]): string {
  if (quests.length === 0) return MASTERY_NODE_PROMPT

  const lines = quests.map(questLine)
  return `${MASTERY_NODE_PROMPT}

My current quests for "${domain.name}", so you don't need to ask:

${lines.join('\n')}`
}
