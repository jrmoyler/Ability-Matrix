# Whiteout Needle — `codex/whiteout`
Frost · line · range 2–18 m · no zone (volley 1.5 m round the end) · ≈3.5 s on screen at a 13 m cast (≈0.5 travel at 26 m/s + 0.45 volley + 0.3 fall + 1.0 hold + 1.3 sublime)

## Read in one line
A low navy storm cloud runs down the line over the caster's aim and rains slanted icicles point-first into the floor; behind the front a **3.6 m wall of blowing snow** stands over the lane — navy and thick at the floor, steel-blue in its body, pale ice only where it thins, white driving streaks racing through it — and it keeps rolling down the line through the whole hold while a forest of ice stands in it, then sublimes away with the cloud.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.1 | Anticipation | The cloud (navy belly #0f1e38, steel lobes #7f9fc4) opens 3.5 m ahead at 4 m, billowing down to ≈3.4 m — inside the 8 m shot. |
| 0.1–≈0.5 | Travel | The front runs down the line at 26 m/s; icicles (1.7 m, slanted 0.42 rad, root burning #a8dcff) streak down from the cloud and drive a third of their length into the floor, each with a puff, chips and every 3rd a frost decal. Behind the front the blizzard volume and the combed drift are revealed with ragged noise edges. |
| ≈0.5–1.25 | Impact | The last volley of 18 big icicles rings the end point (centre last); flash (0.18, #8fc4f0, never white-out), steel-blue frost shell, shockwave #4f86c0→#cfe8ff, light punch 18, shake. Bodies caught are knocked flat and pinned by 3 icicles each. |
| ≈1.25–2.25 | Linger (hold) | The ice forest stands in the blizzard. The blizzard's fbm rides the wind down the line at 5.5 m/s and rolls over itself; gusts pulse through it; white streaks race through; the combed drift keeps running at 1.6 m/s; a ground blizzard of puffs (26/s) keeps blowing down the whole lane. Nothing is static. |
| ≈2.25–3.55 | Exit | Icicles sublime root-first, the blizzard and drift erode in patches, the cloud thins out. |

## Layers
1. Icicles — lathed five-facet spears, `createIcicleMaterial` (opaque, `LAYER.WORLD`, shadows). Ice #6fa6d6, milk #a9cdeb, glow #a8dcff.
2. Cloud — billowed grid, `createCloudMaterial`.
3. Snow — STREAK driving snow, SOFT flakes, SMOKE ground blizzard (ramps end in navy #16294a / #14274a).
4. Snowed floor — `createDriftMaterial`, navy troughs #1c3658 → steel #8fb4dc → crests #d6e9f8, streaks scrolling with the wind; cold-air sheet on `LAYER.DISTORTION` (warp kept at 0.12 — at 0.7 it smeared the icicles into the flat white sheet the audit saw).
5. Strikes / volley — puffs, chips, FROST decals, FROST burst, SHOCKWAVE, flash, light.
8. Blizzard — `createBlizzardMaterial`: a unit box carrier (`createBlizzardGeometry`) raymarched 18 steps through wind-advected fbm with gusts and driving streaks; ramp core #eef7ff (streaks only) / pale #9fc1e2 / body #3a6292 / deep #0a1631.

## Signature
Everything comes down: slanted icicles nailing the lane under a low cloud, inside a standing, rolling wall of navy blizzard.

## Palette
core #eef7ff / #ffffff (streaks, falling roots) · tint #9fc1e2 / #a8dcff · body #3a6292 / #6fa6d6 · deep #0a1631 / #0f1e38

## Gameplay
Unchanged: same front speed, `fallTime`, `volleyTime`, `holdTime`, `lifetime`, `cooldown`, hit radius, pins and impulses. `cloudHeight` 6.5 → 4.0 only changes how far the icicles are drawn falling (same fall time).

## New settings (presentation)
`colorSnowCrest`, `driftWind`, `blizzardHeight`, `blizzardWidth`, `blizzardDensity`, `blizzardScale`, `blizzardWind`, `blizzardGust`, `blizzardStreakGlow`, `blizzardOpacity`, `lingerHazeRate`, `colorBlizzardCore`, `colorBlizzardPale`, `colorBlizzardBody`, `colorBlizzardDeep` (15).

## Fix 4 (navy, not washed out)
Coordinator read: lane pale white-blue; cloud at the top edge. Changes: ice #2c5a91 / milk #5d8cc2 / glow #7fb6ea, trail 1.0, land 1.2, env 0.15; blizzard pale #5a81b2 / body #1e3d6c, density 2.0, streak glow 0.9; drift #45699a / troughs #0c1a33 / crests #9dbde0, edge glow 0.8; puffs, frozen bodies, volley burst (now ice-coloured, 0.9) and shock all darker; frost decals now `colorFrostDecal` #1f3c66 at `frostDecalIntensity` 0.25; snow streak A #b9d4f0. Cloud lowered 4.0 → 2.3 m, starts 6 m out, belly #14284a, plus a heaped upper shell (`cloudTower` 1.3 m, `cloudTowerShade`). 4 new keys, in the editor.
After: `/tmp/claude-0/-home-user-Ability-Matrix/8cc56224-c22f-51ae-821d-6da7489331c5/scratchpad/fix-4/r4/codex__whiteout-sheet.jpg`. Honest 7.5–8: lane and ice read navy/saturated; the cloud still shows mostly as an arc at the top of the frame (the chase camera sits under it).
