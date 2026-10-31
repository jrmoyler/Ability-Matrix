# Resonance Pulse — `collective/sonic`
Sound · line · range 3–18 m, rings 17 m/s · ≈4 s on screen (0.65 s train launch + ≈0.8 s flight + 1.9 s hang + 0.9 s exit, × `global.lifetime` on the hang)

## Read in one line
A train of six filled, deep-violet pressure lenses — each with a thick vortex lip rolling at its front — pulses out of the hand and down the line over a strip of sand sorted into standing-wave stripes; the last one lands as a pair of domes that slam over the target, and the floor there sorts into a Chladni figure that keeps crawling between modes under a small dome still humming over it.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.65 | Anticipation | A ring leaves the hand every 0.13 s: RING muzzle particles, a tick of shake, the light thumps on each. |
| 0.00–≈1.45 | Travel | Each shell opens 0.3 → 2.1 m: a normal-blended, sun-shaded lens of compressed air sitting low on the ramp (`bodyTone` 0.16: mostly #14042a deep, lifted toward #8e1fe0 only where swirling pressure cells compress it), emissive body glow and beat bands cut to a faint shimmer (`bodyGlow` 0.04, `bodyOpacity` 0.03) so end-on the train reads as dark plum lenses with soft rims rather than nested neon outlines; its lip rolls back into a deep-toned lit vortex tube (10 % of the radius) with only a narrow hot crest. Warp twin bends the frame at each rim. Dust shoved out to both flanks; behind the lead ring a **Chladni lane** (dark stain, bowed sand ridges across the path at 0.9 m, widening with the rings) is sorted out of the floor and stays. |
| ≈1.45 | Impact (boom) | Two filled pressure **domes** stand on the floor (4.4 m, half-angle 1.2 rad, opens in 0.32 s; echo 0.2 s later at 0.72×; body a little brighter than the rings, `boomDomeGlow`), AIR shell 3.4 m inside them (opacity 0.55, #ffffff → #ff6fd0 → #2c0b52), SHOCKWAVE r 6.5 m, and the **shockwave proper**: a filled band of dark compressed air 2.6 m deep with a ragged inner edge, dragged across the floor to 9 m behind a single hot crest (`floorWake`, `floorWakeLength`), 36 dust, shake 0.55, flash 0.24, light 22. The **Chladni plate** (r 4.6 m) is revealed with the ripple front. |
| +0.35 → +1.9 s | Linger | The plate is a solid stain (deep → violet, `plateStain` 0.9, `plateBodyMix` 0.55) ringed by a pressed crater lip at 0.74 R that glows on each hum beat — the floor mark that stays. A filled **hum** dome (1.9 m, half-angle 1.3) stands over the plate and breathes ±14 % at 2.6 Hz; the plate's nodal figure morphs from mode (3, 2.5) to (5, 3.5) and back every 1.4 s, its sand ridges glowing on each breath; the lane hums with it. |
| +0.9 s | Exit | Hum and domes fade; plate and lane blow away grain by grain (noise dissolve) as they fade. |

## Layers
1. Shells — `createResonanceShellMaterial`: cap + rolled vortex lip built in the vertex stage from a plain grid; filled, normal-blended body; four-stop ramp; HDR only on rim, crest and band peaks.
2. Warp — `createResonanceWarpMaterial` on `LAYER.DISTORTION`, per ring, per dome; floor ripple warp.
3. Dust — `sonic.dust` SMOKE, non-additive, #9a8aa6 → #1c1428.
4. Ripples — RIPPLE decals under every 3rd ring, faint (intensity 0.22, life 1.2 s) — the lane carries the floor now.
5. Muzzle — `sonic.muzzle` RING particles per pulse.
6. Boom — domes (same shell material stood on the floor), AIR burst, SHOCKWAVE, `createResonanceFloorMaterial` chromatic ripple train.
7. Chladni plate + lane — `createResonancePlateMaterial` ('disc' / 'lane'): dark stain at the antinodes, gritty ridges on the nodal lines, morphing modes, pulsing with the hum.
8. Hum — a third dome breathing over the plate through the linger.

## Signature
Sound made visible by what it does to matter: dense lenses of air with rolling lips, and sand on the floor sorting itself into the cast's standing-wave figure.

## Fix-up pass (2026-10-31)
New keys (12): `bodyGlow, bodyMottle, bodyMottleScale, bodyShade, bodyTone, floorWake, floorWakeLength, boomDomeFill, boomDomeGlow, plateBodyMix, plateRimGlow, plateRimWidth`. Retuned: rim 1.7→0.45 bright / 0.055→0.07 wide, chroma 0.045→0.02, lip bright 1.0→0.4 and size 0.13→0.10, intensity 2.2→1.3, floor ripple additive chromatic rings → normal-blended filled band + one crest. Timing, speed, pulse count/interval, range and hit capsule unchanged.

## Palette
core #fff4fb, tint #ff86d2, body #8e1fe0, deep #14042a (chroma accents #ff2f8f / #a8d8ff / #5a3cff)

## Gameplay
Engine default line capsule (unchanged): the lead ring's front fells what it passes. `speed`, `pulseCount`, `pulseInterval` and range are unchanged; `lifetime` 1.9 s and `fadeTime` 0.9 s only lengthen the hang after the last ring lands.
