import type { Domain, DomainSpire } from '../../model/types'

type Props = {
  domain: Domain
  spire: DomainSpire
}

// Placeholder shape only — greyscale blocks stacked by heightTier,
// styled by condition. Real pixel art is architecture.md §10 step 12.
export function Spire({ domain, spire }: Props) {
  // Tier 0 renders zero blocks — a bare plot for a domain never
  // practiced, distinct from any domain with real (if lapsed) history.
  const blocks = Array.from({ length: spire.heightTier })

  return (
    <div className={`spire spire-${spire.condition}`}>
      <div className="spire-stack">
        {blocks.length === 0 ? (
          <div className="spire-plot" />
        ) : (
          blocks.map((_, i) => <div key={i} className="spire-block" />)
        )}
      </div>
      <div className="spire-name">{domain.name}</div>
      <div className="spire-meta">
        {spire.condition} · {spire.heightWeeks}w
      </div>
    </div>
  )
}
