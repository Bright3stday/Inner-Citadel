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

// Ember intensity per cell, 0 (dark, no glow) to 3 (white-hot). Hand-
// authored per heat tier rather than computed, so the fire reads as a
// scatter of distinct embers — not a gradient, and not one flat block
// dimmed or brightened uniformly. 8 columns × 5 rows, top row nearest
// the mouth of the arch, bottom row is the coal bed. Grid dimensions
// stay fixed across every tier; only which cells are lit changes, so
// swapping tiers never shifts layout.
const EMBER_PATTERNS: Record<ForgeHeat, number[][]> = {
  cold: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  embers: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 0, 1, 1, 0, 1, 0],
  ],
  'low-flame': [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 0, 0],
    [0, 1, 1, 2, 1, 1, 0, 0],
    [1, 2, 1, 2, 2, 1, 2, 1],
  ],
  'working-heat': [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 0, 0, 1, 0, 0],
    [0, 1, 2, 2, 1, 2, 1, 0],
    [1, 2, 3, 2, 3, 2, 2, 1],
    [2, 3, 2, 3, 3, 2, 3, 2],
  ],
  striking: [
    [0, 1, 0, 1, 1, 0, 1, 0],
    [1, 2, 2, 1, 2, 2, 1, 1],
    [2, 3, 3, 2, 3, 3, 2, 2],
    [3, 3, 2, 3, 3, 2, 3, 3],
    [3, 3, 3, 3, 3, 3, 3, 3],
  ],
}

// Placeholder shapes only, same status as Spire.tsx — a small
// blacksmith-shop scene (stone-block wall, hanging sword, anvil and
// hammer) standing in for real pixel art (architecture.md §10 step
// 12). Everything here is static set dressing except the forge itself
// — the wall, sword, and anvil don't respond to anything and never
// will; they exist so the widget doesn't read as a lone icon floating
// in whitespace. No guilt copy on the forge itself: a cold forge just
// shows a cold forge, nothing more.
//
// The one deliberate exception to the app's strict greyscale palette
// (spec §2): the coal glow is warm amber so fire reads as fire. Every
// other pixel here — wall, sword, anvil, hammer, scattered coal, the
// label — stays on the existing --fg/--muted/--bg scale.
export function Forge({ heat }: Props) {
  const pattern = EMBER_PATTERNS[heat]

  return (
    <div className={`forge forge-${heat}`}>
      <div className="forge-scene">
        <div className="forge-sword">
          <div className="sword-peg" />
          <div className="sword-pommel" />
          <div className="sword-hilt" />
          <div className="sword-guard" />
          <div className="sword-blade" />
        </div>

        <div className="forge-structure">
          <div className="forge-arch">
            <div className="forge-coal-grid">
              {pattern.flatMap((row, rowIndex) =>
                row.map((intensity, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`forge-ember forge-ember-${intensity}`}
                    style={
                      intensity > 0
                        ? { animationDelay: `${((rowIndex * 8 + colIndex) % 7) * 130}ms` }
                        : undefined
                    }
                  />
                )),
              )}
            </div>
          </div>
          <div className="forge-scatter" />
        </div>

        <div className="forge-anvil">
          <div className="anvil-horn" />
          <div className="anvil-top" />
          <div className="anvil-waist" />
          <div className="anvil-base" />
          <div className="anvil-hammer">
            <div className="anvil-hammer-handle" />
            <div className="anvil-hammer-head" />
          </div>
        </div>
      </div>
      <div className="forge-label">{LABELS[heat]}</div>
    </div>
  )
}
