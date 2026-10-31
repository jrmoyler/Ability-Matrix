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

## Fix-up pass (2026-10-31)
The funnel was a translucent glassy teal sheet. Now: the dust shell has an opacity floor (`bodyFloor` 0.72) so it is a column of dirt everywhere, not a veil; storm-slate ramp (#05080b deep → #33434d body → #8499a4 tint → #c2d3da filament), the wind shell's teal glow halved (`innerOpacity` 0.08, `innerGlow` 0.3); medium-scale cloud bands that physically roll out of the wall (`bandBulge` 0.16, `bandFrequency` 0.75/m, contrast 0.75, `bandDark` 0.85) with their sun side lit (`sunLift` 0.35) so the column reads against the night sky; debris chips 0.4 m at 210/s carried up; scour disc 1.45 × skirt (≈3.5 m), deeper grooves, more grit and lip; impact shell slate not white; base warp halved so the lower funnel no longer refracts like glass. Height 4.3 m untouched (top stays in the 8 m frame; overshoot 6 %→2 %, top feather 0.16→0.22). New keys (3): `bandBulge, bodyFloor, sunLift`.

## Shape pass (2026-10-31, third pass)
The old read from f30 on was a flat, wide, pale cloud cap over a brown dust skirt. This pass changes the silhouette, not the colour. The **drawn** column now has its own presentation-only profile, separate from the lift profile (`height` 4.3, `baseRadius`, `topRadius`, `flare` are unchanged and still set where bodies are carried and hang, ≈2.7 m). The drawn column is 3.95 m tall (top under 4.3 m, inside the frame), with a 0.32 m rope-thin foot and a 2.7 m lip, and `funnelFlare` 2.3 keeps it a narrow tapering column that only opens in its upper third. The dust shell is dense dark slate (deep #06090c → body #2c363d → tint #5c6a73 → filament #9fb1ba, `bodyFloor` 0.86). Three **helical bands** (0.7 turns foot to lip) wrap it and are carried round by the shell's spin phase, so the rotation reads off the bands. They also roll out of the wall (`spiralBulge`), notching the outline as they wind. The horizontal band rolls were weakened so the helix leads. A **backlit rim** (`rimLight`) lifts the silhouette edge so the dark column reads against the night sky. The inner wall seen down the throat is darkened (`throatDark`), so the lip is a dark hollow, not a pale cap. A **ground-contact cloud** (320 puffs/s, held low) boils round the foot, and the dust soft-fade dropped to 0.35 m so it sits on the floor. The old tall brown skirt was cut (rate 200→110, rise 0.35→0.12). Debris is darker dirt that climbs slower (4.2 m/s, drag 0.7), carried up the sides inside the frame, and the streaks follow the drawn wall. The scoured floor now outlives 65 % of the collapse (`scourHold`). The sway (0.7 m) is unchanged and visibly leans the top.
New keys (18): `funnelHeight, funnelFoot, funnelTop, funnelFlare, spiralBands, spiralTurns, spiralWidth, spiralContrast, spiralLight, spiralBulge, throatDark, rimLight, dustSoftFade, footCloudRate, footCloudSize, footCloudHeight, footCloudSpread, scourHold` (178 keys total). No gameplay value changed.

## Layers
1. Dust devil (`createFunnelMaterial('devil')`).
2. Funnel — two parameter-space lathe shells drawn on their own presentation profile: lit dark-slate dust shell with helical bands, backlit rim and dark throat; additive wind shell.
3. Dust skirt + ground-contact cloud — low SMOKE boiling round the foot on a swirl anchor + DUSTRING decals.
4. Scoured floor — `createScourGeometry` + `createTempestScourMaterial` (new).
5. Debris — lit CHIPs up the column.
6. Wind streaks — STREAKs.
7. Distortion — LAYER.DISTORTION billboard.
8. Impact — AIR shell, SHOCKWAVE, flash, shake, light.

## New settings (22)
`colorFunnelDeep, deepMix, innerDeepMix, bandDark, outerDensity, scourRadius, scourGrowTime, scourOpacity, scourWind, scourGrooves, scourGrooveDepth, scourBowl, scourGrit, scourLipGlow, scourLift, telegraphScour, telegraphDust, telegraphRadius, colorScourDeep, colorScourBody, colorScourTint, colorScourLip`. Retuned: height 8.5→4.3, top 3.4→2.75, foot 0.55→0.85, wind shell glow 2.2→0.6, pale greys → storm slate, shock colours white → teal.

## Gameplay
Same capture rule, reach, lifetime, rise time and fling. Note: `height` is also the lift ceiling's scale, so bodies now hang at ≈2.7 m instead of ≈5.3 m (inside the frame); no damage/target/timing change.
