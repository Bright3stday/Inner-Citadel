import type { Domain, DomainSpire } from '../../model/types'

type Props = {
  domain: Domain
  spire: DomainSpire
}

type Segment = 'base' | 'window' | 'battlement'

// The tower recipe per heightTier — bottom to top. Modular pieces
// composed per tier rather than a bespoke sprite per tier×condition
// combination (18 of them), per the earlier decision: keeps the
// asset count bounded, and a new combination never needs new art.
// Tier 0 has no recipe at all — same "bare plot" semantics as the
// CSS-block placeholder this replaces.
const TOWER_TIERS: Record<number, Segment[]> = {
  1: ['base'],
  2: ['base', 'window'],
  3: ['base', 'window', 'base'],
  4: ['base', 'window', 'base', 'window', 'battlement'],
  5: ['base', 'window', 'base', 'window', 'base', 'window', 'battlement'],
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
export function Spire({ domain, spire }: Props) {
  const recipe = TOWER_TIERS[spire.heightTier] ?? []
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
          </>
        )}
      </div>
      <div className="spire-name">{domain.name}</div>
      <div className="spire-meta">
        {spire.condition} · {spire.heightWeeks}w
      </div>
    </div>
  )
}

// A flag only makes sense once there's a battlement to plant it on —
// tier 4 is the first tier with one.
function tierWantsFlag(heightTier: number): boolean {
  return heightTier >= 4
}
