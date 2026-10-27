# Equivalence Engine — `matrix-expansion/equivalence-engine`
Gravity · zone · range 17 m (min 2) · zone radius 3.8 m · ≈ 3.6 s on screen (16 m cast, lifetime 1)

## Read in one line
A tilting iron balance heaves out of the floor; its two counterweights share one unit of mass, and as the mass pours back and forth across the beam the heavy end slams down on its half of the circle — three times, turning between slams — before the masses are poured equal, the beam levels and the engine sinks into its well.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
| 0.00–0.45 | Anticipation | A bound pair of small spindle weights (≈ 0.34 m) leaves the hand circling each other (0.42 m orbit, 10 rad/s) at 1.3 m, shedding a SOFT lilac grain trail. At the target the floor's equipotential lines fade in (25 % → 100 %) and the 2.0 m turned fulcrum and 4.9 m arched beam heave up out of the floor (first half of the flight). |
| 0.45–0.70 | Travel | The pair keeps flying; mass pours into weight A (its seams heat from violet to white) and the full-size weights grow onto the beam ends while the pair shrinks into the fulcrum. Over the last third of the flight the beam swings A down with an accelerating (in-cubic) fall. |
| 0.70 | Impact (slam 0) | A's point lands on the floor on the docking frame: CHIP shrapnel (42), dark lit SMOKE dust (14), an EARTH dust ball to 2.1 m, a CRACK crater (r 2.1 m) + DUSTRING + SHOCKWAVE under the weight, a white-violet shock front across the floor contours, lens pressure ring, flash 0.1, camera knock 0.24, light punch 6. Enemies in A's half-disc are thrown outward. |
| 0.70–2.70 | Linger | The engine pours: ~180 grains peel off the heavy weight and arc 1.3 m over the beam to the light one; the flow sheath's pulses run toward the gaining end; the heavy weight cools and shrinks (1.14 → 0.46 m), the light one swells, heats and settles. At equality the beam trembles, then swings over (last 32 % of each 0.7 s period) while turning 0.62 rad round the fulcrum — slam 1 at 1.40 s on B's side, slam 2 at 2.10 s on A's side, each with the full slam set. The floor's contours bunch round whichever weight is heavy; a violet-black basin follows it. 0.6 s settle after the last slam. |
| 2.70–3.60 | Exit | The equivalence: in the first 45 % of the exit the masses are poured equal (both weights 0.8 m, seams at mid heat) and the beam levels with a small balance overshoot; then the whole engine sinks 2.2 m into the floor while the weights' seams and the floor contours dissolve through noise. Craters fade on their own 2.4 s clocks. |

## Layers
1. The engine — `createFulcrumGeometry` (turned tower: stepped plinth, waisted shaft, collar, bearing cradle), `createBearingGeometry`, `createBeamGeometry` (octagonal loft on an arch, swelling at the fulcrum, flared sockets; rewritten in place when reach/thickness/arch change); lit `MeshStandardMaterial` iron-stone #2a2236 with emissive #1c0d3a, `LAYER.WORLD`, casts shadows. `geometry.js`, `index.js`.
2. The counterweights — `createWeightGeometry` (plumb spindle with hook knob, collar, raised bands, pointed bulb) in `createShellMaterial`: opaque, lit (sun key, sky/ground ambient, gloss), ridged-noise seams whose heat and brightness follow the weight's share of the mass; slam flash; noise dissolve on exit. Size = mass. `materials.js`.
3. The mass stream — `createStreamMaterial`, an additive sheath on the beam geometry pushed out along normals; pulses run toward the gaining end, brightest while pouring.
4. The motes — `createMoteMaterial`, 256 GPU points; grain *i* owns share (i+½)/N of the mass and orbits A when its share < mA, B otherwise; the grains the pour is crossing ride an arc over the beam.
5. The floor — `createFieldMaterial` (additive): log-spaced equipotential contours of φ = mA/|p−a| + mB/|p−b|, the circle's rim, the A–B axis and each slam's shock front; `createWellMaterial` (normal-blended): a violet-black basin under the heavy weight. Plus CRACK, DUSTRING and SHOCKWAVE decals per slam.
6. The slam — expansion CHIP system (ramp gradient), `expansion.equivalence-engine.dust` lit SMOKE, `BurstMode.EARTH` dust ball, flash, shake, light punch.
7. The flight — the bound pair (same spindle + shell materials) and `expansion.equivalence-engine.grains` SOFT trail.
8. The exit — equalize, level, sink, dissolve.
9. The lens — `createLensMaterial` on `LAYER.DISTORTION`: gravitational pinch round the heavy weight, a pressure ring per slam.

## Signature
Inverse linked mass you can watch: one unit of mass shared by two counterweights (mA + mB = 1 every frame) pours visibly across the beam, and the balance answers — the heavy end slams its half of the circle, the engine turns and tips back.

## Palette
core #f6f1ff, tint #c4b2ff, body #6a3fd6, deep #150a2c (iron-stone #2a2236)

## Gameplay
- `handlesOwnHits`. Slam *j* lands at `j × tipPeriod × lifetime` after the impact (j = 0 is the impact frame), `tips` slams (default 3, capped at 6). Heavy end: A on even *j*, B on odd.
- A slam strikes only enemies inside the **heavy half-disc**: within `strikeReach × zoneRadius` of the fulcrum and on the heavy end's side of the line through the fulcrum square to the beam. The light half is spared. The beam turns `tipTurn` (0.62 rad) per swing, so successive slams sweep different sectors. Bodies are thrown outward from the fulcrum with `hitImpulse/hitLift/hitSpin` × explosion intensity.
- At most 8 targets per slam (≤ 48 per cast). Routed through `bindExpansionCombat` (UCSM `hit`, element `gravity`, `damage: hitDamage`, tag `equivalence-engine`), or `dummy.kill` on the dummy field when no binding exists.
- Interpretation: the registry's "inverse linked mass" is implemented against what the sandbox has — the cast's own two constructs carry the linked mass; no projectile capture or mass manipulation of other actors is claimed (the adapter reports both unsupported).
- Placement is derived: beam half-length = `armReach × zoneRadius`; the slam tilt is `asin((pivotHeight − r_heavy) / half)` so the heavy weight's point always lands on the floor; crater, dust ball, field and lens scale from `zoneRadius`.
- Reduced motion holds the orbit, seam flow, tremble and lens; slam timing and sectors are unchanged.
