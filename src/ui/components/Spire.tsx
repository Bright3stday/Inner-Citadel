import type { Domain, DomainSpire } from '../../model/types'

type Props = {
  domain: Domain
  spire: DomainSpire
  hasRepaired?: boolean // ever returned from the Inn — see actions/restActions.ts
}

type Segment = 'base' | 'window' | 'battlement'

// The tower recipe per heightTier — bottom to top. heightTier is now
// unlocked-mastery-node count (core/spire.ts), unbounded by design —
// bounded by nodes authored, not a hardcoded week-count ceiling — so
// this is a formula, not a hand-authored lookup table capped at 5.
// One body segment per tier, alternating base/window starting at the
// foot; a battlement caps every tier from 4 up. Tier 0 has no recipe
// at all — same "bare plot" semantics as the CSS-block placeholder
// this replaces.
function buildTowerRecipe(tier: number): Segment[] {
  if (tier <= 0) return []
  const segments: Segment[] = []
  for (let i = 0; i < tier; i++) {
    segments.push(i % 2 === 0 ? 'base' : 'window')
  }
  if (tier >= 4) segments.push('battlement')
  return segments
}

// Placeholder shapes only, same status as Forge.tsx — a hand-composed
// pixel tower (Castlevania-esque stone keep) standing in for real art
// (architecture.md §10 step 12). Condition is an overlay on top of the
// height recipe, not a separate sprite: steady renders the recipe
// plain; crumbling adds cracks to every base segment, drops one
// merlon from the battlement, and scatters rubble at the foot;
// thriving lights the topmost window and adds a pennant to the flag.
//
// The one deliberate exception to the app's strict greyscale palette
// (spec §2), matching the Forge's fire: a thriving tower's topmost
// window glows warm, the same "sign of life" logic as embers. Every
// other pixel — stone, cracks, rubble, the flag pole — stays on the
// existing --fg/--muted/--bg scale.
//
// A patched-stone overlay (hasRepaired) marks a domain that's ever
// returned from the Inn — deliberately permanent once earned, not
// tied to the domain's current condition. The gap doesn't get quietly
// erased; the citadel shows evidence of repair instead. Still
// greyscale — a texture, not a color.
export function Spire({ domain, spire, hasRepaired = false }: Props) {
  const recipe = buildTowerRecipe(spire.heightTier)
  const windowIndices = recipe
    .map((segment, i) => (segment === 'window' ? i : -1))
    .filter((i) => i >= 0)
  const topmostWindowIndex = windowIndices.at(-1)
  const hasBattlement = recipe.includes('battlement')
  const isCrumbling = spire.condition === 'crumbling'
  const isThriving = spire.condition === 'thriving'

  return (
    <div className={`spire spire-${spire.condition}`}>
      <div className="tower-stack">
        {recipe.length === 0 ? (
          <div className="spire-plot" />
        ) : (
          <>
            {hasBattlement && (
              <div className="tower-battlement">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`tower-merlon${isCrumbling && i === 1 ? ' tower-merlon-broken' : ''}`}
                  />
                ))}
                {tierWantsFlag(spire.heightTier) && !isCrumbling && (
                  <div className="tower-flag">
                    <div className="flag-pole" />
                    {isThriving && <div className="flag-pennant" />}
                  </div>
                )}
              </div>
            )}
            {recipe
              .map((segment, i) => (
                <div key={i} className={`tower-segment tower-${segment}`}>
                  {segment === 'window' && (
                    <div className={`tower-slit${i === topmostWindowIndex && isThriving ? ' tower-slit-lit' : ''}`} />
                  )}
                  {segment === 'base' && isCrumbling && <div className="tower-crack" />}
                </div>
              ))
              .reverse()}
            {isCrumbling && <div className="tower-rubble" />}
            {hasRepaired && <div className="tower-patch" title="Returned from the Inn" />}
          </>
        )}
      </div>
      <div className="spire-name">{domain.name}</div>
      <div className="spire-meta">
        {spire.condition} · {spire.heightTier} node{spire.heightTier === 1 ? '' : 's'}
      </div>
      {spire.nextNode && (
        // The dead-zone fix: this is meant to move most weeks, even
        // between node unlocks — the thing the old week-count ladder
        // had nothing to show between the Forge's 3-day window and a
        // whole-week height bump. See docs/decision-log-and-roadmap.md.
        <div className="spire-construction" title={spire.nextNode.title}>
          <div className="spire-construction-bar">
            <div
              className="spire-construction-fill"
              style={{
                width: `${Math.min(100, (spire.nextNode.practiceCount / spire.nextNode.practiceThreshold) * 100)}%`,
              }}
            />
          </div>
          <div className="spire-construction-label">
            {spire.nextNode.practiceCount} / {spire.nextNode.practiceThreshold}
          </div>
        </div>
      )}
    </div>
  )
}

// A flag only makes sense once there's a battlement to plant it on —
// tier 4 is the first tier with one.
function tierWantsFlag(heightTier: number): boolean {
  return heightTier >= 4
}
