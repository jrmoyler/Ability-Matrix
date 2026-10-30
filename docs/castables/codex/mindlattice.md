# Mind Lattice — `codex/mindlattice`
Arcane (illusion) · zone · range 2–18 m · zone 4.5 m · ≈ 3.3 s on screen (≈0.4 travel at 22 m/s + 0.68 drop/lock + 1.5 hold + ≈0.75 fold)

## Read in one line
A violet cut-gem thought flies to the circle and unfolds into a turning tesseract of solid violet crystal; twenty faceted crystal bars drop round the rim onto a deep-violet lattice disc and lock — then, while it holds, the cage turns, twists into a hyperboloid and cinches its crown in over the fallen.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.4 | Anticipation + travel | A 0.43 m spinning violet octahedron (tint body, HDR heart) at head height flies down the line shedding violet motes. |
| 0.4–0.85 | Impact (drop) | It rises to the 2.35 m hub as sixteen cut-gem nodes spring out and 32 hexagonal crystal edges draw in (outBack). The deep-violet disc (#1a063c, warming to the body tone at its heart) races out to the rim with its triangular lattice. Bars drop round the rim one after another, top ring first, each striking the floor with violet sparks. |
| ≈0.8 | Lock | Last bar lands, bottom ring closes: violet flash, shake 0.4, SHOCKWAVE 7.5 m (#7426e0→#e2c8ff), STORM shell 2.2 m (#f1e2ff→#9a52f0→#2a0a5c), light punch. Bodies inside fall (engine hits). |
| 0.8–2.3 | Linger | The cage is never still: the ring turns 0.35 rad/s, the top ring sways ±0.75 rad against the bottom so every bar leans (a twisting hyperboloid), and over 0.9 s the crown cinches 32 % inward — a closing crown over the catch. The tesseract turns through XW/YW/ZW (inner cube rolls through the outer). Packets of thought run down each bar's white-hot filament; synapses flare edges and pulse rings across the floor; radar sweep turns. |
| 2.3–3.0 | Exit | Bars withdraw upward, the twist unwinds, the tesseract spins up ×6 and folds back into a point that winks out (small flash + spark burst); the disc fades. |

## Layers
1. Beams — `createMindBeamMaterial`: hexagonal crystal prisms, faceted (derivative normals), sun-lit deep→body→tint rim, cut-glass glint, a thin HDR filament (`coreWidth`) with packets and synapse flares. Normal-blended, depth-writing.
2. Nodes — `createMindNodeMaterial`: 16 cut violet gems + the travelling thought.
3. Floor — `createMindFloorMaterial`: solid deep-violet disc (`gridWash`, `floorHeart`), triangular lattice, rings, crossing nodes, sweep, synapse pulses.
4. Motes (SOFT) and sparks (STREAK) on the arcane gradient.
5. Field — glass bands on `LAYER.DISTORTION` (kept faint so bars stay ruled).
6. Beat — flash, shake, SHOCKWAVE, STORM shell, light.

## Signature
A ruled crystal cage that twists and closes like a thought tightening — straight lines only, but the silhouette changes every frame while it holds.

## Palette
core #f1e2ff (HDR only in thin filaments) · tint #c48bff · body #7426e0 · deep #1a063c

## Gameplay
Unchanged: engine hits — everything inside the circle falls on arrival. Presentation only.
