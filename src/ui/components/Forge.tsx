import type { ForgeHeat } from '../../model/types'

type Props = {
  heat: ForgeHeat
}

const LABELS: Record<ForgeHeat, string> = {
  cold: 'Cold ash',
  embers: 'Banked embers',
  'low-flame': 'Low flame',
  'working-heat': 'Working heat',
  striking: 'Hammer striking',
}

// Placeholder shape only, same as Spire.tsx — a CSS heat meter standing
// in for real pixel art (architecture.md §10 step 12). No guilt copy:
// a cold forge just shows a cold forge, nothing more.
export function Forge({ heat }: Props) {
  return (
    <div className={`forge forge-${heat}`}>
      <div className="forge-pit">
        <div className="forge-fill" />
      </div>
      <div className="forge-label">{LABELS[heat]}</div>
    </div>
  )
}
