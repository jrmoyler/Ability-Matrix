# Mirage Procession — `matrix-expansion/mirage-procession`
Illusion · line · range 1–20 m · three lanes 1.8 m apart · ≈ 0.8 s travel (12 m/s) + 0.7 s break + 1.5 s linger

## Read in one line
Three lacquered masks walk down three lanes looking back at the caster, deep plum in the hollows and magenta on the lit planes; only one lane is real. At the end they rear, fall back onto the floor and sink, turning, into swirling pools of their own lacquer while the true lane's victim is answered by a looming mask that drives down on it.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|-------|------|------------------------------------------------|
| 0.00–0.25 | Anticipation | Three ~1 × 1.5 m sculpted half-face masks fade and grow in over the caster's lanes, 1.15 m up; glitter and soft puffs gather at each. |
| 0.25–arrival | Travel | The masks bob and sway out of step down the lanes (yaw π: faces toward the caster), veil plumes behind, eight mirror shards orbiting each; each lane carries a deep-plum haze with saturated violet shimmer bands; air shimmer (`LAYER.DISTORTION`) at the front. Identical in all three lanes. |
| on contact | True strike | Only for a committed hit: a 1.5× copy of the mask in hot magenta lacquer rises 1.1 m over the struck body, lunges 0.9 m down the line and burns away over 0.7 s; 1.8 m shockwave, puff burst, magenta flash, knock, light punch. |
| arrival | Impact | Three identical dark-magenta AIR shells (0.9 m), finale puffs, light punch, knock, flash. |
| +0.0–0.2 | Rear | The masks rear up 0.35 m, faces tipping up; shards peel outward. |
| +0.2–0.5 | Fall | Under gravity the masks drop back onto the floor at a 1 rad lean, faces still toward the viewer; shards rain down round them; three RIPPLE decals and a knock as they land. |
| +0.5–2.2 | Linger | A 1.35 m deep-plum pool spreads under each mask: saturated veins swirl round it, ripple fronts roll out to a pale broken lip. The masks turn 0.7 rad in their pools and sink 0.45 m; shards spiral inward. |
| last 55 % | Exit | The lacquer burns away through a noise dissolve with a white-hot edge; the pools dry from the lip inward; the lane haze fades. |

## Layers
1. Masks — `createMaskGeometry` (extruded, sculpted half-face) under `createMaskMaterial`: normal-blended, depth-writing, key-lit lacquer on the four-stop ramp, thin-film rim, scan bands, slice glitch, burn dissolve; engraving glints.
2. Veils (fluttered ribbon plumes).
3. Wakes — normal-blended deep haze + violet shimmer bands per lane.
4. Mirror shards (24 instanced) that peel, rain and spiral into the pools.
5. Particles: soft puffs (shared illusion system) + GPU glitter.
6. Finale shells, landing ripples, contact shockwave.
7. Shimmer on `LAYER.DISTORTION`.
8. Pools — `createPoolMaterial`, swirling lacquer linger (one shared material: lanes identical).
9. True strike — four pooled mask copies, honest feedback after a committed hit only.

## Signature
Masks that look back at you, fall, and melt into the floor — and the one that was real looms over its victim.

## Palette
core #fff4fb, pale #ffb3e6, body #d42a96, deep #2a0838; lanes #7a2fc4

## Gameplay
Unchanged: `handlesOwnHits`, only `trueLane` sweeps (`hitWidth` either side), each body once, same UCSM `hit` event and force. `impactDuration` 0.7 s unchanged; the linger (`lingerTime`) only lengthens the presentation fade, after every hit has landed. Nothing visible distinguishes the lanes before a hit commits.
