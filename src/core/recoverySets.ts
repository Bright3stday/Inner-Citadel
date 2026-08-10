import type { RecoveryQuestSet } from '../model/types'

// Built-in recovery quest sets, offered when sending quests to rest in
// the Inn. Deliberately generic — recovery quests are mostly about the
// person, not the paused domain, so the same handful of basics apply
// whether Fitness or Photography got paused. The domain-specific part
// is what's resting; what replaces it is fairly universal. Kept
// gentle and non-prescriptive on purpose, especially the mental-health
// set — small, real actions, nothing that reads as the app treating
// anything. Editing/adding custom sets is a follow-up piece, not built
// yet; these are the fixed starting point.
export const BUILTIN_RECOVERY_SETS: RecoveryQuestSet[] = [
  {
    id: 'physical-injury',
    name: 'Physical injury',
    templates: [
      { title: 'Gentle mobility work', targetCount: 1, window: 'day', unitLabel: 'sessions' },
      { title: 'Ice or heat as needed', targetCount: 1, window: 'day', unitLabel: 'times' },
      { title: 'Follow prescribed care', targetCount: 1, window: 'day', unitLabel: 'times' },
      { title: 'Sleep 7+ hours', targetCount: 1, window: 'day', unitLabel: 'nights' },
    ],
  },
  {
    id: 'illness',
    name: 'Illness',
    templates: [
      { title: 'Rest', targetCount: 1, window: 'day', unitLabel: 'times' },
      { title: 'Hydrate', targetCount: 4, window: 'day', unitLabel: 'glasses' },
      { title: 'Eat something', targetCount: 1, window: 'day', unitLabel: 'times' },
      { title: 'Sleep 7+ hours', targetCount: 1, window: 'day', unitLabel: 'nights' },
    ],
  },
  {
    id: 'mental-health',
    name: 'Mental health',
    templates: [
      { title: 'Step outside', targetCount: 1, window: 'day', unitLabel: 'times' },
      { title: 'Reach out to someone', targetCount: 1, window: 'week', unitLabel: 'times' },
      { title: 'Gentle movement', targetCount: 1, window: 'day', unitLabel: 'times' },
      { title: 'Sleep 7+ hours', targetCount: 1, window: 'day', unitLabel: 'nights' },
    ],
  },
]
