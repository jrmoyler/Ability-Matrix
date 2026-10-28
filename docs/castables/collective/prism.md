# Sunfall Prism — `collective/prism`
Light · zone · range 2–16 m (capture ≈ 11.8 m) · zone radius 3.2 m · ≈ 5 s on screen (0.6 s travel + 0.3 s charge + 1.8 s sweep + 0.5 s hold + 2.2 s scorch fade)

## Read in one line
The caster throws a spinning crystal dart on a thread of sunlight; a sun shaft opens where it lands and a three-metre prism drops into it, a white beam strikes it and it fans six spectral beams that sweep the circle, glassing the floor into a crazed rainbow mirror.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.60 | Travel | A 0.55 m crystal dart spins at 1.4 m along the line; a 0.07 m thread of gold-white sun (the lance) runs from the hand to it; glints skim the floor. The sun shaft (2.6 m at the floor, 3.6 m at the sky) is already coming down over the circle and the prism (r 1.05, h 3.0 m) falls 12 m → 2.3 m through it. |
| 0.60–0.85 | Anticipation | The dart climbs into the shaft and is gone, the lance fades; the prism hangs, bobs and gathers light; a sun pool on the floor. |
| 0.85–0.93 | Strike → split (impact) | A white beam (0.4 m) drives into the stone and floods it; 0.08 s later: flash, AIR shell 3.6 m, shockwave 5 m, glints, knock, light punch; six spectral beams (0.26 m) fan from the stone to the floor. |
| 0.93–3.2 | Linger (sweep + hold) | The contacts spiral 1.9 rad outward across the circle, each burning a 0.34 m line hot→char and throwing coloured sparks; behind them the floor fuses into a dark crazed glass whose cell edges throw the spectrum; the stone spins faster; bodies a contact crosses are cut down. |
| 3.2–5.4 | Exit | The prism shatters into 320 glints in every hue, anything left in the circle is thrown out; the lines and the glassed floor cool and fade over 2.2 s. |

## Layers
1. Prism (hero) — procedural bipyramid (`assets/collective/SunfallPrismGeometry.js`), dispersive refracting glass shader with inner spectral fire.
2. Dart + lance (travel) — the same stone in miniature with its own glass material; a `lance` role of the beam shader.
3. Shaft, strike and spectral beams — one beam shader (`createPrismBeamMaterial`).
4. Scorch + glassed floor — analytic char/heat passes (`createPrismScorchMaterial`) with the new field: dark crazed glass (voronoi), spectral caustic rays by bearing, a hot spreading edge; SCORCH decals along the lines.
5. Particles — SOFT motes in the shaft, STREAK sparks per hue, SOFT glints.
6. Impact — AIR shells, SHOCKWAVE decal, flash, knock, light that turns through the spectrum.

## Signature
A falling prism splits the sun into a fan that sweeps and glasses the floor in its own spectrum.

## Palette
core #ffffff, tint #fff1b0, body #ffe08a (and the spectral hues), deep #2b1d16 char

## Gameplay
`handlesOwnHits`: bodies a beam contact crosses are killed (sliced); on the shatter everything still in the circle is thrown outward.
