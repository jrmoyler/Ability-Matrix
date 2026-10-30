# Second Self — `codex/secondself`
Time · line · range 2–18 m · finale throw radius 4.2 m · ≈3.7 s on screen at 11 m (≈1.1 heartbeat travel + 0.42 lag + 0.75 finale + 1.5 fade; the double stands ≈0.85 s, pours away over ≈1.1 s)

## Read in one line
A solid, sunlit golden copy of you — a head taller, dark bronze on its shadow side — peels out of your body and runs the line a heartbeat behind a gold thread that lays down its footprints on a dark-bronze worn band; at the end it plants on a clock face that spreads across the floor, the last heartbeat throws everything near, and it turns round to face you, swelling with each beat while the dial's hand jumps backwards, before it pours away as sand from the crown down.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.3 | Anticipation | A 2.35 m gold mannequin (14 lit capsules, bulk 1.22) slides out of the caster 0.35 m to the side; a small heartbeat ring off its chest. |
| 0.0–1.1 | Travel (heartbeat) | A gold thread runs down the line at 10 m/s weaving ±0.5 m; behind it a 1.7 m-wide grained dark-bronze band fills in and 0.6 m footprints glow #ffb04a. Bodies it passes are marked gold. |
| 0.42–1.5 | Travel (the double) | The double runs the weave, landing in each print (flare #fff4d2, cooling to #5a2c0c), two afterimages eaten by noise behind it, two gold ribbons braided round its path, dust off each footfall, a dark contact shadow under it. Bodies within 0.9 m are thrown forward. |
| ≈1.5 | Impact (lub) | It plants. A 3 m clock dial spreads out from under it (0.35 s): filled #1c0b02 face, #9a5a14 body, 12 #ffc860 hour wedges, minute ticks, bezel. Shock decal (dim amber), shake, light. |
| ≈1.7 | Impact (dub) | AIR shell (#fff6dc → #ffcf7a → #6a3208), 160 sparks, a bright front runs out across the dial, flash 0.25, everything within 4.2 m thrown outward. |
| ≈1.8–2.4 | Linger | The double stands, turns 180° to face the caster (0.55 s), swells ±6 % on every heartbeat; the dial's hand jumps back one hour per beat with a fan of swept gold behind it; prints cool to embers. |
| ≈2.4–3.5 | Exit | A white-hot line runs down the figure crown → heels; above it the gold is gone, below it remains; gold grains pour off the line (STREAK, gravity). Afterwards the dial, band and prints fade over the fade phase. |

## Layers
1. The figure — `createFigureMaterial`: instanced swept capsules (CPU pose → `aA/aB/aR`), depth-writing, lit off `uLightDir` with a 4-stop ramp, fresnel rim, time-bands, noise dissolve for echoes, top-down sand dissolve (`uSandY`). `SecondSelfMaterials.js`.
2. The dial — `createDialMaterial`: flat quad at the end, premultiplied: filled face + emissive wedges/ticks/hand/fan/dub front. Radius `dialScale × finaleRadius`.
3. The run — `createRunMaterial`: premultiplied floor strip: dark-bronze worn band (`trailWidth`), seam, thread, analytic footprints, contact shadow.
4. The braid — two camera-facing ribbons twisted round the path.
5. Particles — SOFT motes, SMOKE dust per footfall, small RING per heartbeat, STREAK sparks (finale, hits, and the poured sand).
6. Distortion — `LAYER.DISTORTION` wake ripples off the double, finale shock ring.
7. Finale — SHOCKWAVE ×2 (dimmed, `shockIntensity`), AIR shell, flash, shake, light punch.

## Signature
A solid gold you runs your line, turns round on a rewinding clock and runs out of time as sand.

## Palette
core #fff6e2 · tint #ffe2a0 · body #e0a02c · deep #3a1a05 (figure); dial #fff2d0 / #ffc860 / #9a5a14 / #1c0b02; band #6e3c0c / #1e0d03.

## Gameplay
Unchanged: mark by the heartbeat front, strike within `hitRadius` of the running double, finale strike within `finaleRadius` on the dub. The linger and dial are presentation only.

## New settings (presentation)
`lightWrap`, `specular`, `trailWidth`, `trailOpacity`, `trailGlow`, `colorTrailDeep`, `colorTrailBody`, `lingerHold`, `turnBack`, `turnTime`, `lingerPulse`, `sandTime`, `sandEdge`, `sandGlow`, `sandRate`, `sandLife`, `shadowOpacity`, `shadowSize`, `dialScale`, `dialOpen`, `dialOpacity`, `dialGlow`, `dialTicks`, `dialSweep`, `colorDialDeep`, `colorDialBody`, `colorDialTint`, `colorDialCore`, `shockIntensity` (29).
