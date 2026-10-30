# Tempest Spiral — `collective/tempest`
Wind · zone · range 2–16 m · zone r 3.2 m · ≈5 s on screen (≈0.8 s travel + 3.2 s column + 1.1 s collapse, × `global.lifetime`)

## Read in one line
A dark dust devil leaves the hand and skims to the circle while the floor there is already being raked; it stands up into a heavy storm-slate tornado over a scoured, groove-wound dirt bowl, winds the bodies up its throat inside the frame, and throws them clear as it thins from the bottom up.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.8 | Anticipation + travel | Devil (2.3 m tall, lip 0.85 m, opacity 0.9) spins up off the hand and skims at 14 m/s kicking brown dust and grit; at the circle dust is drawn in and wound up (`telegraphDust`) and the scour starts raking the floor (to 35 % of its radius). |
| 0.8 | Impact | Column rises (riseTime 0.55 s, overshoot 6 %); AIR pressure shell squashed flat, teal SHOCKWAVE r 5.5 m, DUSTRING, 40 dust puffs, shake, flash, light. |
| 0.8–4.0 | Linger | Funnel 4.3 m tall (kept inside the 8 m frame), foot 0.85 m → lip 2.75 m. Dust shell is dense (`outerDensity` 2.2) and coloured by a four-stop ramp driven by filament/band light: deep #0b141b → body #2c4a57 → tint #7fb3c4 → filament #a9dcea; dirt-dark #3a2e22 at the floor. Dark gaps between cloud bands (`bandDark`). Faint additive counter-spinning wind shell inside. Scoured floor spreads to 3 m over 0.6 s: log-spiral grooves lit off a bump normal, a gouged bowl under the foot ringed with grit, turning with the spin; dust rings every 0.32 s; lit CHIP debris (0.26 m) orbits up; streaks; base warp. Bodies knocked off their feet and wound up to 0.62 × height. |
| 4.0–5.1 | Exit | Funnel thins bottom-up with a ragged edge, bodies flung outward, 110 chips thrown; scour fades with it. |

## Layers
1. Dust devil (`createFunnelMaterial('devil')`).
2. Funnel — two parameter-space lathe shells: lit dust shell with four-stop ramp, additive wind shell.
3. Dust skirt — SMOKE on a swirl anchor + DUSTRING decals.
4. Scoured floor — `createScourGeometry` + `createTempestScourMaterial` (new).
5. Debris — lit CHIPs up the column.
6. Wind streaks — STREAKs.
7. Distortion — LAYER.DISTORTION billboard.
8. Impact — AIR shell, SHOCKWAVE, flash, shake, light.

## New settings (22)
`colorFunnelDeep, deepMix, innerDeepMix, bandDark, outerDensity, scourRadius, scourGrowTime, scourOpacity, scourWind, scourGrooves, scourGrooveDepth, scourBowl, scourGrit, scourLipGlow, scourLift, telegraphScour, telegraphDust, telegraphRadius, colorScourDeep, colorScourBody, colorScourTint, colorScourLip`. Retuned: height 8.5→4.3, top 3.4→2.75, foot 0.55→0.85, wind shell glow 2.2→0.6, pale greys → storm slate, shock colours white → teal.

## Gameplay
Same capture rule, reach, lifetime, rise time and fling. Note: `height` is also the lift ceiling's scale, so bodies now hang at ≈2.7 m instead of ≈5.3 m (inside the frame); no damage/target/timing change.
