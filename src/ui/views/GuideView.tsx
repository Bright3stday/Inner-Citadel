// A standing reference, not a scripted first-run flow — reachable any
// time from its own tab, and the tab a brand-new install lands on
// (App.tsx picks 'guide' as the initial tab when there are no domains
// yet). One screen, collapsible sections, so it's scannable rather
// than a wall of text — consistent with the text-density pass elsewhere
// in this app (see docs/decision-log-and-roadmap.md).
export function GuideView() {
  return (
    <div className="view guide-view">
      <h1>Guide</h1>
      <p className="settings-hint">
        Inner Citadel is a personal capability-building practice tool — not a habit tracker. No streaks, no
        guilt copy, no punishment for missing a day. Everything here is meant to be an honest record, not a
        score.
      </p>

      <details className="guide-section" open>
        <summary>Domains &amp; quests</summary>
        <p>
          A <strong>domain</strong> is a real area you're building (Fitness, Reading, Photography). Add one
          from the Citadel tab.
        </p>
        <p>
          A <strong>quest</strong> is recurring practice inside a domain: a target quantity, over a day or
          week, logged through one or more methods (e.g. "3 sessions / week" via Push-ups or Squats). Tap a
          method on Today to log it — logging early or banking ahead of a "suggested day" is always allowed;
          suggested days only dim a quest's display, they never block logging.
        </p>
      </details>

      <details className="guide-section">
        <summary>Today &amp; the Forge</summary>
        <p>Today lists your quests grouped by domain. Tap a method to log a contribution.</p>
        <p>
          The <strong>Forge</strong> at the top is a short-window momentum signal (roughly the last 3 days,
          across every domain) — separate from the Citadel's slower signals, so something visibly responds
          to what you did today, not just this week.
        </p>
        <p>
          A domain with two full weeks of zero activity gets a gentle neglect prompt — a question, not a
          warning, and it never appears while that domain is resting at the Inn.
        </p>
      </details>

      <details className="guide-section">
        <summary>The Citadel &amp; spires</summary>
        <p>Each domain renders as a spire on the skyline. Three independent signals, not one score:</p>
        <p>
          <strong>Height</strong> — how many mastery nodes you've unlocked in that domain. Moves rarely, a
          real milestone. <strong>Construction progress</strong> — the bar under the spire, tracking practice
          toward whichever node is still locked. Meant to move most weeks. <strong>Condition</strong> —
          thriving / steady / crumbling, from recent weeks only. A tall, crumbling spire is real: built up,
          then lapsed — height never resets just because condition worsens.
        </p>
      </details>

      <details className="guide-section">
        <summary>Mastery nodes &amp; Growth Points</summary>
        <p>
          Open a domain (tap its spire) to see its <strong>mastery nodes</strong> — a small ordered path of
          self-authored capabilities, not activities ("can hold a plank without form breaking down," not
          "do planks"). Each has your own criteria for how you'll know you've genuinely met it — the app
          never judges that text, you do.
        </p>
        <p>
          Logging contributing quests earns practice toward a node's threshold. Cross it and the node goes{' '}
          <strong>eligible</strong> — done, waiting on you. Unlocking is a deliberate act: it spends Growth
          Points (earned from logging, shown on the Citadel tab) and re-shows your own criteria for you to
          confirm before it fires.
        </p>
        <p>
          Nodes can be authored by hand, or via "Copy mastery node prompt" on a domain page — pastes into any
          AI you use, interviews you, and hands back JSON you paste back in to import. No AI calls happen
          from inside this app itself, ever.
        </p>
        <p className="settings-hint">
          This whole system is a first skeleton, not a finished design — numbers and rules here are expected
          to change.
        </p>
      </details>

      <details className="guide-section">
        <summary>The Inn (recovery)</summary>
        <p>
          A small tavern on the Citadel screen, below the skyline. Manual only — nothing sends you there
          automatically. Pick <strong>Reduced</strong> (same quests, smaller targets, for now) or{' '}
          <strong>Resting</strong> (quests pause and drop off Today; an optional recovery quest set can fill
          the gap). Neglect and crumbling never fire while something's resting. Returning restores your
          original targets.
        </p>
      </details>

      <details className="guide-section">
        <summary>Weekly Review &amp; Trends</summary>
        <p>
          The Review tab covers the most recently completed week: what was met, a day-by-day breakdown per
          quest, and an optional intent for the week ahead. Toggle to <strong>Trends</strong> for a monthly
          hit-rate rollup per quest — useful for spotting one that's chronically too easy or too hard.
        </p>
      </details>

      <details className="guide-section">
        <summary>Settings</summary>
        <p>
          Export/import your data as a file (this app is offline, single-device — export is also your
          backup), pick which day the week starts on, set an optional weekly-review reminder (best-effort —
          checked while the app is open, not a true background notification), or reset everything.
        </p>
      </details>

      <p className="settings-hint">Built and tested in the open — expect rough edges and changing numbers.</p>
    </div>
  )
}
