# Caustic Bloom — `linear-extended/acid`
Poison · zone · range 0–20 m (capture: 14 m) · zone radius 4.4 m · ≈ 7.3 s on screen (0.21 travel + 5.6 stand incl. 0.42 bloom + 1.5 inert)

## Read in one line
A slick of corrosion runs to the circle, the stone crazes and dissolves into a wet, lime-green acid pool ringed by a glowing collar, and a 5 m column of boiling toxic gas stands over it, venting in surges, until the pool goes inert and leaves a stain.

## Beats
| t (s) | Beat | On screen |
|-------|------|-----------|
| 0.00–0.21 | Anticipation + travel | Muzzle 0.5 m, flash 0.08; corrosion races at 68 m/s, laying acid marks 0.9 per metre. |
| 0.21–0.63 | Impact (bloom) | Pool opens over `bloomTime` 0.42 s; a ring snaps out along the boundary; 7.5 m shockwave (#8fff1e/#b6f05a); etch burn r 1.5 m. |
| 0.63–5.81 | Linger | The `_boil` envelope (rate 2.0) drives everything: pool channels brighten, gas swells from its feet up, ring gains, shimmer thickens, bubbles 44/s. When a surge crosses `boilThreshold` 0.55 the aura **vents**: a gout of gas, a ring across the pool, a 0.035 knock. Bodies inside go limp (zero-impulse ragdoll), drop into the pool and are stained then eaten on the boil's clock. |
| 5.81–7.31 | Exit | `fadeTime` 1.5 s: acid goes inert, gas sinks back into the floor; stain #2f4a08 remains. |

## Layers
1. **Acid pool** — `materials/AcidPoolMaterial.js`: two-nearest voronoi crazing over an alpha crust (sludge #0a1104, plate #24310c), pits eaten through, caustics, real specular — *wet* first. Acid #8fff1e / hot #dcff9a / edge #b6ff2e.
2. **Toxic mist column** — `materials/ToxicMistMaterial.js`: raymarched volume, 5.2 m high, analytic span, cut against the depth prepass so the character is *inside* it, lit from below by the pool (deep #0a1e05, body #4f8f1c, edge #b7f25a).
3. **Bubbles** — film bubbles (ring silhouette, catchlight, burst not fade) #e8ffbe → #1c3a06; plus motes, fog, splash particles.
4. **Heat distortion** — proxy on `LAYER.DISTORTION` rolling about the column.
5. **Ring** — flat annulus + 0.55 m standing collar (#9dff2b / #f4ffd6).
6. **Floor** — etch, stains, shockwave; light #7bf01c (r 20, low in the column).

## Signature
**A reaction, not a stack**: one boil envelope gains every layer and vents on threshold crossings — and there is no blast; bodies are dropped and dissolved where they stood.

## Palette
core #dcff9a, tint #b6ff2e, body #4f8f1c / #8fff1e, deep #0a1104

## Gameplay
`handlesOwnHits`: `_melt` finds bodies in the footprint, ragdolls them with zero blow, then corrodes them (`color` #1b2708, rim #9be62a, burn edge #d8ff7a). Cooldown 2.2 s.
