# Starfall Rite — `matrix-new/starfall`
Light · zone · range 0–20 m (capture ≈ 14 m) · zone radius 5.5 m · ≈ 6 s on screen (0.7 s travel + 0.5 s drawing + 1.8 s fall + 1.2 s linger + 1.0 s close)

## Read in one line
A herald star streaks from the hand into the sky over the circle, a constellation draws itself there, then its stars come down one by one as white-hot crystal stars that stick in the floor, crater it, and are joined by the figure's lines re-drawn on the ground.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.70 | Travel | The herald (0.45 m spiked star) climbs from 1.4 m to 3.4 m along the line with a 3 m meteor trail and gold glitter. |
| 0.70–1.25 | Anticipation | Shockwave ring at the zone; the constellation (8 stars, r 3.6 m, tilted 0.5 rad toward the caster, at 3.4 m) lights star by star and its lines (0.12 m) are drawn on; the circle darkens (deep #2a1606); soft gold pools gather on the floor under each star 0.45 s before it drops. |
| 1.25–3.1 | Impacts | Every ≈0.25 s a star swells and falls (0.3 s) as a tumbling cut crystal star (r 0.55 m) at the head of a 5 m trail; on landing: radiant floor star (2.6 m), shockwave, AIR shell, glitter + sparks, flash, knock, light jump, kills within 1.25 m. The crystal sticks upright, leaning, with a crater (1.1 m, dark core, molten lip, glowing radial cracks) under it. |
| 1.25–4.3 | Linger | Landed stars turn slowly about their faces like wheels and cool from white through gold to a pulsing ember; the figure's lines are re-drawn on the floor between landed stars (from the first to land toward the second, 0.35 s each); star dust sifts from the ghost figure. |
| 4.3–5.3 | Exit | The ghost figure dims and its lines fold to their midpoints; the crystals sink into the floor and shrink; the field fades. |

## Layers
1. Crystal stars (hero) — `createStarCrystalGeometry` (20-facet star ornament), `createStarCrystalMaterial` (patched MeshStandardMaterial, per-instance heat), InstancedMesh on `LAYER.WORLD`, casts shadows.
2. Star field (floor) — `createStarFieldMaterial`: deep disc, craters with cracks, floor lines between landed stars.
3. Sky — instanced star points (spikes/halo), view-facing link strips.
4. Meteors — instanced trail strips (+ the herald's slot).
5. Floor telegraph + radiant bursts — instanced floor quads.
6. Particles — SOFT glitter, STREAK sparks, SOFT curl dust; SHOCKWAVE decals, AIR shells.

## Signature
The constellation comes down out of the sky and is written onto the ground: stars stuck in the floor, joined by its lines.

## Palette
core #ffffff, tint #fff0b0, body #ffd26a / #ffc060, deep #2a1606

## Gameplay
`handlesOwnHits`: each landing kills every body within `blastRadius`, thrown away from the point. Bounded by the star count.
