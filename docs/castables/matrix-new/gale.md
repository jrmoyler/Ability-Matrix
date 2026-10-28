# Gale Sever — `matrix-new/gale`
Wind · line · range 1–22 m · no zone (blade 4.8 m tip to tip) · ≈ 3.3 s on screen (≈0.6 travel at 28 m/s + 0.45 tear + 2.2 linger)

## Read in one line
A diagonal crescent of dense blue air is slashed off the hand, flies the line with its low tip cutting a dark furrow in the floor, tears apart over the targets in a pressure shell and a combed blast fan, and leaves its two tip vortices standing as 3.4 m counter-rotating funnels that lean apart, snake and unravel from the foot up.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|---|---|---|
| 0.00–0.22 | Anticipation | 46 white→sky wind lines sucked into the hand from 1.6 m (`castDraw`); dust gust at the feet; the blade snaps open off the hand over 0.12 s with an outBack. |
| 0.05–≈0.6 | Travel | The blade flies at 28 m/s, rolled 0.72 rad: a 4.8 m crescent from floor to ≈2.8 m, white cutting edge + chromatic fringe over a lit pressure sheath (deep #0e2234 underside → #4f97c6 → pale #d9f2ff top). Its low tip scrapes the floor; the scar opens exactly there (`_contactX`): dark slit, lit lips, scratches and a 1.5 m combed scour, glowing #bfe9ff just behind the blade. Spiral dust wake off both tips, wind lines pacing it, dust rings every 2.4 m, rumble. Bodies crossed are sliced. |
| ≈0.6 | Impact | The blade drifts 2.2 m on, opens ×1.7 and tears on a noise front with a frayed bright edge; AIR shell 4.5 m, shockwave 6 m, dust ring, 70 ribbons, flash, knock 0.32, light ×1.2. The blast fan (3.8 m, deep #15212b, combed forward, pale heaped rim) spreads over 0.3 s. |
| ≈0.6–2.6 | Linger | Two severed vortices rise with an overshoot (0.32 s) at ±1.8 m either side of the line: 3.4 m funnels (foot 0.26 m, top 1.05 m), helical white→#bfe6ff streamline core over a lit dust sheath (#0d2033 → #3f7fae), counter-rotating at 8 rad/s, leaning out 0.32 m/m, drifting apart 0.45 m/s, snaking. Dust drawn up their walls (120/s), wind lines wound round them; spiral footprints scoured into the floor under each foot. |
| ≈2.6–3.3 | Exit | The vortices unravel from the foot up along a burning edge over 0.75 s while lifting 0.9 m; the scar, fan and footprints erode raggedly. |

## Layers
1. Blade — parameter-space strip bent in the vertex stage (`assets/matrix-new/GaleSeverGeometry.js` `createGaleBladeGeometry`, `createGaleBladeMaterial`), additive edge + fringe + haze.
2. Pressure sheath — `createGaleTubeGeometry` along the same crescent arc, `createGaleSheathMaterial`: normal-blended, sun-lit lens-section cushion of dust; the mass that reads at 8 m.
3. Lens — the crescent on `LAYER.DISTORTION` (`createGaleWarpMaterial`).
4. Scar + blast fan + footprints — one ground strip (`createGaleScarMaterial`): slit/lips/scratches/scour under the low tip, the combed fan at the impact, two spiral footprints.
5. Severed vortices — 2 × (additive core + lit sheath) on `createGaleTubeGeometry` (`createGaleVortexMaterial`).
6. Particles — SMOKE wake/dust (spiral tip wake, floor dust, vortex updraft), STREAK wind lines (pacing, drawn-in, wound round vortices), curl STREAK ribbons.
7. World — AIR burst, SHOCKWAVE + DUSTRING decals, flash, shake, light punch; light rides the blade then sits with the vortices.

## Signature
A slash that leaves its own wingtip vortices behind: the crescent's two tips become two counter-rotating funnels that stand where it tore, and its low tip is what cuts the floor.

## Palette
core #ffffff, tint #d9f2ff / #bfe6ff, body #4f97c6, deep #0e2234 (ground deep #15212b, scour #8d9aa5)

## Gameplay
`handlesOwnHits`: unchanged — each frame the blade is sharp it slices (`dummy.kill(…, true)`) bodies behind its edge at their lateral offset within `halfWidth + sliceReach`; sharp for the first half of the tear. The vortices and fan are visual only.
