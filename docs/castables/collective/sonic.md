# Resonance Pulse — `collective/sonic`
Sound · line · range 3–18 m, train 17 m/s · ≈4 s on screen (0.65 s train launch + ≈0.8 s flight + 1.9 s hang + 0.9 s exit, × `global.lifetime` on the hang)

## Read in one line
A long, dark, turbulent body of shoved air — a blunt bulging front with a bow-wave wake that spreads and lies down on the floor behind it — ploughs down the line, peeling dust and grit off the floor and swelling with a bead for every pulse of the train; it piles up on the target and bursts outward into a dark torn pressure burst, the floor heaves into a lit crater lip round a Chladni plate, and a dust ring rolls out.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.65 | Anticipation | One dark RING muzzle puff per pulse at the hand (every 0.13 s), a tick of shake and a light thump on each. |
| 0.00–≈0.7 | Travel | The **hull** rides the lead ring: blunt half-ellipsoid nose (0.55 × R) with a bulge and a thin hot crest (tint → white, the only hot stop), behind it a sheath up to 5.6 m long that keeps the front's width, spreads 1.9× and flattens to 0.3× toward its tail, boiling with noise that grows toward the tail and tears into ragged holes there. Cross-section 1.9 m half-width × 0.72 at the target end, 42 % buried. Lit by the sun: deep #14042a → dusty #57505f, streaks running back along it; violet only as a thin fresnel edge. Each later ring is a swell running up through the sheath. Dust (SMOKE) and grit (CHIP, falls under gravity) peel off the floor at both flanks every 0.45 m and stream up and back into the wake. Behind it the Chladni lane (dark stain, faint sand ridges) is sorted out of the floor and stays. |
| ≈0.7–1.35 | Pile-up | The lead ring lands; the rest of the train runs into the body, which shortens 25 % and swells 15 % over the target. |
| ≈1.35 | Impact (boom) | The body **bursts**: over 0.45 s it blows out 2.6× wider, lies down to 45 % height, its turbulence triples and it tears into holes until gone — a dark pressure burst, not a dome. Faint dark EARTH dust ball (opacity 0.22), DUSTRING decal r 6 m, 110 dust thrown low in 16 spokes, a white→violet SHOCKWAVE ring r 6.5 m, the dark filled pressure band racing out 9 m behind one hot crest, shake 0.55, flash 0.18, light 22. The **crater lip** heaves up in 0.16 s (outBack): r 3.6 m crest, 1.9 m wide, 0.65 m high, steep inside, long slope outside, lumpy. |
| +0.2 → +1.9 s | Linger | The lip stands lit by the sun, breathing ±10 % with the 2.6 Hz hum; violet shows only in its cracks on each beat; dust leaks off the crest (7 puffs/s). Inside it the Chladni plate morphs between modes (3, 2.5) ↔ (5, 3.5) every 1.4 s; the lane stays. |
| +0.9 s | Exit | The lip sinks back into the floor and dissolves; plate and lane blow away grain by grain. |

## Layers
1. Hull — `createResonanceHullMaterial('color')`: lofted in the vertex stage from a 44 × 84 grid in line space (nose, bulge, sheath, beads, bow-wave spread/flatten, burst), finite-difference normals, lit, normal-blended, soft-faded into the floor. `ResonancePulseMaterial.js`.
2. Hull warp — same loft, `'warp'` pass on `LAYER.DISTORTION` along the silhouette and front; faint ring warps (`ringWarp` 0.35) at each pulse.
3. Peel — `sonic.dust` SMOKE + `sonic.grit` CHIP thrown up and back from under the front; flank dust under each ring.
4. Crater — `createResonanceCraterMaterial`: 80 × 12 annulus heaved in the vertex stage, lit earth, violet cracks on the beat.
5. Chladni plate + lane — `createResonancePlateMaterial` ('disc' / 'lane').
6. Boom — hull burst, EARTH dust ball, DUSTRING + SHOCKWAVE decals, `createResonanceFloorMaterial` pressure band + warp, low dust ring, flash, shake, light.
7. Muzzle — one dark RING puff per pulse.
8. Legacy (off by default, still live): per-ring lens shells (`ringShellOpacity`), boom domes and hum (`boomDomeShow`), RIPPLE decals (intensity 0.05).

## Signature
Sound made visible by what it does to matter: a body of shoved air you can see the length of, ploughing the floor up, and the floor left heaved and sorted into the sound's figure.

## Third pass (2026-10-31) — shape change
The end-on train of shells read as nested violet rims from the camera behind the caster, and the boom as a saturated violet dome. Both replaced: the train is carried by one long lit hull with a bow-wave wake; the boom is that hull bursting dark, plus a dust ring and a heaved crater lip that stays. 63 new keys (156 → 219): `ringShellOpacity, ringWarp`, 31 `hull*`/`colorHull`, 10 peel/grit (+4 `colorGrit*`), `boomDustLow, boomRingRadius, boomRingLife, boomRingIntensity, boomDomeShow`, 11 `crater*`/`colorCrater`. Retuned defaults: burst colours dark and opacity 0.22, boomDust 36→110, flash 0.3→0.18, muzzle 3→1 dark, lane ridges 0.2→0.03, plate violet lift 0.55→0.15, ripples 0.22→0.05. Timing, speed, pulse count/interval, range and hit capsule unchanged.

## Palette
core #fff4fb, tint #ff86d2, body #8e1fe0 (edges and cracks only), deep #14042a; hull dust #57505f, earth #57505c, grit #8c7a8f → #120c18.

## Gameplay
Engine default line capsule (unchanged): the lead ring's front fells what it passes. `speed`, `pulseCount`, `pulseInterval` and range are unchanged; `lifetime` 1.9 s and `fadeTime` 0.9 s only lengthen the hang after the last ring lands.

## Fix-up (coordinator read, 2026-10-31)
- Hull is now a dense dust-laden air front. Opacity 1, it writes depth, it ramps from its own dark stop `colorHullDeep` #17130f to grey-brown `colorHull` #6e6152, and it has almost no violet (`hullEdge` 0.04). The nose has a sharp crest line (`hullCrest` 3.5, width 0.09 R, `hullCrestHot` 0.85 toward white). Tendril streaks and holes stretched along the body make the wake tear into streaming dust. Dust and grit are grey-brown, and 7 dust puffs peel off per side.
- Lane cut to a faint scuffed track: `laneStain` 0.22, ridges 0, ripples 0.
- The SHOCKWAVE outline is off (`shockIntensity` 0, new key). The boom's floor band is rolling dust in the dust ramp with a soft tan front: `floorWidth` 0.4, `floorIntensity` 0.2, `floorWakeLength` 3.4, `floorTime` 1.5. The DUSTRING decal is stronger.
- The crater lip is earth-toned (dark stop is the hull's dust-deep, `colorCrater` #5e5246). The plate's violet is cut to cracks only.
- New keys: `colorHullDeep`, `hullCrestHot`, `shockIntensity` (219 → 222).
