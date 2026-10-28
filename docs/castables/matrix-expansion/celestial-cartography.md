# Celestial Cartography — `matrix-expansion/celestial-cartography`
Cosmic · zone · range 2–18 m (capture ≈ 13 m) · zone radius 4.2 m · ≈ 7.5 s on screen (0.8 s travel + 6 s chart + 1.2 s collapse)

## Read in one line
A tumbling orrery of three stars streaks out to the circle, an astrolabe plate of dark violet bronze rises out of a night-dark star map and turns overhead, its stars bend rays onto the nearest enemy and a meteor drops onto it, kicking the plate into a fast spin.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|---|---|---|
| 0.00–0.80 | Travel | Orrery: three faceted stars (≈1.4 m across) tumbling inside a graduated ring at 1.4 m, shedding a wake of violet streaks and glitter along the whole path (`travelGlitter`, `travelStreaks`). |
| 0.80–1.25 | Anticipation (open) | The rete (8.4 m plate, 0.16 m thick) lifts from 0.9 m to 2.6 m and opens with a 12 % overshoot, tilted 0.45 rad toward the caster; the level armillary band rings it; the floor under the circle darkens into a filled star-map (deep #140b2c → nebula #3a2a7a) while the eight constellation links are drawn by a pen, in the sky and on the floor at once. |
| 1.25–1.67 | Mark | The nearest enemy inside the chart is marked: a compass of the true strike radius on the floor, eight convergence rays (0.8 m) bending from the plate's stars onto it, a meteor (head 1.1, tail ×2.2) falling down a rising column; the plate's engraving floods with the charge. |
| 1.67 | Impact | Meteor lands: STORM burst (≤4 m), shockwave, 3-ring corona ×1.8, 12 shards ×1.8, 80 glitter, flash, camera knock, light punch; the plate flashes white and is kicked into a 3 rad/s spin. |
| 1.67–6.8 | Linger | The plate keeps turning (0.25 rad/s + the decaying kick), a pen sweep runs round its engraving, meridians counter-rotate, star dust drizzles; on the floor a scorch with a violet lip spreads from the struck point (1.6 × strike radius) and stays; the rete casts the constellation's shadow across the star-map. |
| 6.8–8.0 | Exit | The chart collapses: shrinks toward its centre by 80 % and sinks, everything fades with it. |

## Layers
1. Rete (hero) — `celestialReteGeometry` (extruded, bevelled limb with teeth, eccentric ecliptic, two bars, eight curved star pointers with diamond tips on the stars, pole boss), `createReteMaterial` (patched MeshStandardMaterial, metal 0.75 / rough 0.32, engraved emissive scale + pen sweep + charge), `LAYER.WORLD`, casts shadows. `cosmic/CelestialGeometry.js`, `cosmic/CelestialMaterials.js`.
2. Star-map floor — `createChartGroundMaterial`, normal-blended deep disc with nebula, projected links, rim, spreading scorch; plus the additive floor chart (rings, ticks, rays).
3. Sky light — nebula veil, armillary band, two meridians, eight faceted stars, pen-drawn links, 40 grains of dust (all additive starlight shaders).
4. Mark — compass, convergence rays (soft depth fade), meteor head + rippling tail, column, gravitational lens on `LAYER.DISTORTION`.
5. Strike — STORM burst, SHOCKWAVE decal, corona, shards, flash/shake/light.
6. Particles — orrery streaks (STREAK), meteor streaks (STREAK), ambient motes (SOFT), glitter (SOFT).

## Signature
A real astrolabe rete whose star pointers end exactly on the chart's stars: the plate is the constellation, and it turns.

## Palette
core #f2eaff, tint #d5bbff, body #ac84ff, deep #140b2c (bronze #3a2c63)

## Gameplay
`handlesOwnHits`: after `armDelay` marks the enemy nearest the centre (UCSM actors with combat on, dummies otherwise); strikes after `strikeDelay` only if the target is still within `strikeRadius` of the mark. One strike per cast; combat-mode change voids it.
