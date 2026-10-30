# Polarity Garden — `atlas/polarity`
Trap · zone · range 2–16 m · garden radius 3.2 m · ≈ 1.04 s throws + 0.98 s lattice + ≈ 1.4 s cascade + 0.6 s linger + 1.4 s fade; scorches stay 5 s

## Read in one line
Eight red and blue pylon-capsules are lobbed in high arcs and plant round the circle; a column of field rises over each pole, field lines whip across between them and the floor lights with the field itself; then they go off one by one round the ring, each pillar shooting up as its capsule bursts, the centre last and biggest.

## Beats
| t (s) | Beat | On screen |
|-------|------|-----------|
| 0.00–0.42 | Anticipation | Capsules leave the hand every 0.06 s (1.4 m up), tumbling 11 rad/s on 2.6 m arcs, spark trails. |
| 0.62–1.04 | Travel + plant | Each lands (0.62 s flight) on the ring at 0.74 × zone: hop, fins splay, DUSTRING 1 m + polarity shock ring, a tick of shake. The floor field switches on at 40 % at the first plant: iron filings, contour lines and a **pole halo** (0.75 m ring + core + outward pulse) in each pole's colour. A **flux pillar** rises over the capsule (0.3 s, outBack): a 2.6 m hourglass of field, 0.7 m base. |
| 1.12–1.57 | Lattice | Field lines (2 per link, 0.26 m ribbons) reach round the ring, across it and out from the centre; dashes crawl + → −; the floor field and pillars climb to full; crackle sparks run along the lines. |
| 1.57–2.02 | Armed | Lattice hums (screen shear), beacons blink faster, pillars pulse with the blink and swell in the last 0.28 s as the hull goes white-hot from the band. |
| 2.02 + k·0.13 | Impact ×7 | Round the ring from the caster's side, + − + −: flare star 1.8 m, STORM burst 1.6 m, SHOCKWAVE 3 m, SCORCH 1.2 m, sparks, smoke, warp ring, flash, shake, light punch; the pillar **shoots up** 1.6 × and burns out in 0.4 s; its tethers whip loose; bodies within 1.35 m thrown away from that capsule. |
| ≈ 3.04 | Finale | Centre capsule goes at 1.6 × after 0.25 s more; its pillar is 1.3 × the others. |
| 3.04–5.0 | Linger + exit | Smoke rises, scorches cool, the floor field goes with the last pole; fade 1.4 s. |

## Layers
1. Capsules (hero) — lathed gunmetal pylon 0.95 m tall with polarity band, beacon dome, hinged fins (`createCapsuleMineGeometry`, `createPolarityMineMaterial`: lambert + sky reflection + seams, band/beacon/heat).
2. Tethers — instanced Bézier ribbons with crawling dashes (`createPolarityTetherMaterial`).
3. Field plot — ground shader: summed point-charge field as filings + contours + per-pole halo rings (`createPolarityPlotMaterial`).
4. Detonations — flare stars, STORM bursts, SHOCKWAVE + SCORCH decals, STREAK sparks, lit SMOKE.
5. Lenses — LAYER.DISTORTION warp rings + lattice hum.
6. Flux pillars — lathed hourglass `createFluxTubeGeometry`, `createPolarityPillarMaterial` (additive, four-stop ramp up the height: white at the capsule → pale → polarity body → deep frayed top; field lines wound round with twist, flux flowing up out of + and down into −).

## Palette
core #fff3e8, + #ff4a3a, − #3a8bff, deep 0.22 × polarity / hull #0b0f15, scorch #ff7b2e → #1a0d08

## Gameplay (unchanged)
`handlesOwnHits`; harmless until it goes off; each detonation throws bodies within `killRadius` 1.35 m (× 1.6 for the centre) away from that capsule (`hit` 9 / 6 / 2.2). Only presentation and timing defaults changed (lattice/arm compressed so the cascade starts at ≈ 2 s).

## New settings (16)
plotContour, plotPlanted, poleRing, poleGlow, pillarHeight, pillarRadius, pillarCentreScale, pillarGlow, pillarLines, pillarTwist, pillarFlow, pillarRise, pillarBlast, pillarBlastHeight (+ defaults raised: mineSize 0.42 → 0.95, tetherWidth 0.07 → 0.26, plotGlow, flare/shock/scorch sizes).

## What the capture shows (upgrade L)
`/tmp/claude-0/-home-user-Ability-Matrix/8cc56224-c22f-51ae-821d-6da7489331c5/scratchpad/up-L/after3/atlas__polarity-sheet.jpg`: f8 big banded capsules tumbling out; f20 capsules planting with red/blue halos; f40 a ring of red and blue flux pillars over lit pylons with field lines and a lit field disc among the dummies; f70 the cascade under way — bursts, shock rings, pillars shooting up, bodies thrown. Before (regrade-a): 0.4 m dots, no impact in the window (6). After: 8. Short: the burst shells read near-white at the peak; flight frames put the capsules close to camera.

## Fix-up (fix-3) — no white blow-out at the detonation
The cascade used to stack a white-core star (glow 6), a white-rimmed STORM shell, a white shockwave edge, white-based pillars shooting up at 2.2× and a 0.16 flash, so the ring went white. Now:
- **Burst star** (`createPolarityFlareMaterial`) is normal-blended: the charge collapses into a near-black heart (`flareDark`), a ring of the pole's colour races out round it, spikes in the pole's colour; white only as a first-instant pinpoint (`flareHot`).
- **STORM shell + shockwave** in the pole's colour: rim `burstWhite` 0.15 toward white, body `burstDeep` 0.3 × the pole colour; `shockIntensity` 0.8.
- **Pillars**: base whiteness `pillarCoreMix` 0.25 (was full white), blast brightness `pillarBlastGlow` 0.9 (was a fixed 2.2).
- Flash 0.16 → 0.05, light punch 16 → 7, hull heat 5 → 2.5, spark head #ffe2c8.
- New settings (7): flareDark, flareHot, burstWhite, burstDeep, shockIntensity, pillarBlastGlow, pillarCoreMix. Gameplay and timing unchanged.
