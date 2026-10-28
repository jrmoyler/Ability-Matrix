# Pressure Inversion — `matrix-expansion/pressure-inversion`
Wind · zone · range 1–18 m · well radius 4 m · ≈ 4.5 s on screen (≈0.5 travel at 28 m/s + 3.2 well + 0.85 settle)

## Read in one line
The caster breathes in — motes are sucked into a knot of wind at the hand — the knot skims to the circle, a dark spiral bowl opens and a 4.2 m waisted funnel of teal storm air rises out of its eye, pinches and burns at the waist as the well drags everything in, then inverts: the funnel blows out into a squat bell that tears apart while a gust front combs the floor outward and throws the bodies clear.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.30 | Anticipation | The carrier knot (0.7 m radius, 1.4 m tall spiral) is born at full size at the hand; 40 motes are drawn into it from 1.5 m over 0.3 s. |
| ≈0.05–0.5 | Travel | The knot skims to the target at 28 m/s, breathing, kicking dust. |
| ≈0.5 | Touchdown | The knot sinks into the eye; dust ring 3.2 m, light ×1.2. The pressure bowl opens (normal-blended, #06201d deep, dust dragged into 3 spiral arms) under the additive isobars. |
| ≈0.5–2.6 | Linger 1 — the pull | The pressure column rises out of the eye over 0.5 s with an overshoot: a 4.2 m funnel, foot 0.8 m, top 2 m, waist at 40 %; additive white→#c7fff1 streamline core over a lit dust sheath (#05231f → #2b9e8c), turning with the four 2.6 m-high vortex ribbons. Inflow motes, swirling dust and rim streaks are dragged in; bodies are knocked down and carried to the centre. Over the last 22 % the waist pinches (0.18 → 0.8) and burns white, the eye brightens, the light climbs, the rumble grows. |
| ≈2.6 | Impact — the inversion | Every layer reverses on one frame: AIR shell 4.5 m, SHOCKWAVE 6 m, DUSTRING 5 m, flash 0.12, knock 0.3, light ×3; dust and streaks thrown radially; held bodies shoved out at 12 m/s. |
| ≈2.6–3.7 | Linger 2 — the gust | The column blows out into a squat bell (radius ×2.5 at mid height, 50 % of its height lost) and tears apart from the rim inward along a frayed bright edge; ribbons bloom outward; the gust front crosses the floor, combing the bowl radially behind it with a pale heap #b9d8cf at the front. |
| ≈3.7–4.55 | Exit | Everything fades over the settle; gravity is returned to bodies the moment the gust ends. |

## Layers
1. Carrier / sink knot — `createVortexMaterial` at small size.
2. Vortex ribbons ×4 — `createVortexMaterial`, parameter-space spirals.
3. Pressure column core + sheath — `createColumnGeometry` + `createColumnMaterial(false/true)` (the hero).
4. Pressure bowl — `createWellBowlMaterial` on the well disc (normal-blended deep floor).
5. Well floor — `createWellFloorMaterial` (additive isobars, arms, eye, gust front).
6. Motes — 128 GPU points (`createMoteMaterial`).
7. Particles — SOFT inflow (+ hand draw), SMOKE swirl dust, curl SMOKE gust dust, STREAK.
8. Lens — `createPressureLensMaterial` on `LAYER.DISTORTION`.
9. World — decals, burst, flash, shake, light.

## Signature
Two breaths on one clock: a funnel that visibly *tightens* before it bursts — the waist pinch is the anticipation, the blown-out bell is the release.

## Palette
core #ffffff, tint #c7fff1, body #2b9e8c, deep #05231f (bowl #06201d, dust #4f7a71, heap #b9d8cf)

## Gameplay
Unchanged: `handlesOwnHits`; standing bodies in the circle are knocked down (gently) and carried inward (`Dummy#carry`, ≤ `maxHeld` 12), shoved outward once at `inversionPoint`, released when the gust ends; pooled bodies reclaimed by another cast are never touched.
