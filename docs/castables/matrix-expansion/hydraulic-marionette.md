# Hydraulic Marionette — `matrix-expansion/hydraulic-marionette`
Water · zone · range 11 m (min 2) · zone radius 3.4 m · ≈3.7 s screen time (× global lifetime)

## Read in one line
A spool of water flung from the caster's hand unfolds over the circle into a puppeteer's cross of liquid. Strings fall from it, hook every enemy inside, haul them up and inward to dance on pumped tugs, then the control jerks up, the strings snap and the puppets are slammed down into the pool spreading beneath.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|---|---|---|
| 0.00–0.28 | Anticipation | Water spins up at the hand (1.35 m): lit droplets thrown up in a 0.55 m ball, and the folded control (0.28× scale, a tight bead) turning fast. Colour tint #8fe9ff over body #1c8ad4. |
| 0.28–0.80 | Travel | The spool arcs to the circle, peaking 1.8 m above the straight line. It unfolds as it flies: bars stretch from 15 % to full span (main 2·0.8R = 5.4 m, cross 2·0.56R = 3.8 m). The **feed line** (6.5 cm sagging tube of water) pays out from the hand behind it the whole way. |
| 0.80–0.96 | Strings fall | The control settles at 3.3 m with a small bounce. Six strings (5 cm, tapering from 1.35×) drop from its four bead ends and two inner points, sagging as they fall. |
| 0.96 | Impact (hook) | Every string hooks on the same frame: each tethered enemy is yanked off its feet toward the centre; a splash crown (0.55 m) rises at every hook with droplets and spray; RIPPLE decals at the hooks, a FOAM decal the size of the pool; light punch, flash, camera knock. The pool starts to spill out. |
| 0.96–2.66 | Linger (the dance) | The control rocks (±0.2 rad, 1.1 Hz) and slowly turns. Pulses are pumped down each string in a rolling wave round the control (0.13 s apart, 1.5 Hz): each pulse swells and lights the string as it descends and lands as a jerk. Hooked bodies are pinned by `Spine2`, hoisted to 1.6 m over 0.55 s and hauled to the 0.42R ring; every jerk bobs them 0.38 m and they swing round the ring. Floor strings stay in the floor and ring the pool. The pool (1.12R, dark #04223f with body-blue stirred water, glints and foam lace) spreads over 0.35 s and ripples off every tip; the lens refracts it. Drips fall from strings and bead ends; the end beads swell with each tug. |
| 2.66–2.98 | The cut | The control jerks up 0.9 m; the strings whip back into it, the feed line lets go and whips back to the hand. On the first frame the puppets are slammed down (9 m/s) and on toward the centre (6 m/s): crowns 1.6× at each landing and at the centre, WATER splash dome to 0.8R, SHOCKWAVE + RIPPLE decals, slam ring in the pool and the lens, heavier knock, flash, light punch. |
| 2.98–3.73 | Exit | The control rains out through a noise dissolve with a pale foam edge while droplets pour from under it; the pool drains in patches, not as a shrinking disc. Decals linger 2.6 s. |

## Layers
1. The control — lofted beaded bar (main + cross, `createBarGeometry`), onion reservoir with spout (`createReservoirGeometry`), four teardrop end beads (instanced `createDropGeometry`); `createLiquidMaterial` (opaque, lit, world layer, shadows); span derived from `zoneRadius`; `geometry.js`, `materials.js`.
2. The strings + feed line — 7 tubes rewritten each frame from a sag/ripple/pulse centreline (`writeString`, parallel-transport frames) with teardrop hooks at the tips; liquid material with the per-vertex pumped glow.
3. The pool — floor field shader (`createPoolMaterial`): spill edge from fbm, ripple rings off 8 tips, normal from the ripple field for glints, foam lace, patchy drain.
4. Splash crowns — 16 instanced flared cups torn into fingers in the vertex stage (`createCrownMaterial`, additive).
5. Particles — lit DROPLETs (gather, drips, splashes, rain-out) and SMOKE spray puffs (`hydraulicMarionette.drops/.mist`).
6. Impact — WATER burst dome, RIPPLE / FOAM / SHOCKWAVE decals, flash, shake, light punches (hook and slam).
7. Lens — `LAYER.DISTORTION` disc: pool ripple refraction, slam pressure ring (`createLensMaterial`).
8. Light — follows the spool, then hangs under the control.

## Signature
Puppet strings of water: a liquid control hovering over the circle holds up to six enemies on tethers, moves them where it wants (up and in) on a rolling wave of pumped tugs, and cuts them down.

## Palette
core #f2feff, tint #8fe9ff, body #1c8ad4, deep #04223f

## Gameplay
- On arrival the tether is chosen: the `stringCount` (≤ 6) nearest enemies inside `zoneRadius`, ties by id. Spare strings hook the floor.
- Hook (`dropTime` after arrival): one hit each (`hookDamage`), knockback pointed at the centre (`hookImpulse/Lift/Spin`). Through the UCSM bridge each also takes the water status (`wet`, tagged `tether`, `statusSeconds`) and the pool is spawned as a water disc region (r = `poolScale`·R) — combat mode only.
- Hold (`holdTime`): felled bodies are pinned to their strings (`pinJoint`, `pinStiffness`) — their movement belongs to the control. Through the bridge the felled body is found with `findBodies` at the actor's position.
- Cut: bodies are unpinned and shoved down/inward (`slamDown`, `slamImpulse`); through the bridge any tethered actor still alive takes a second hit (`cutDamage`) toward the centre. At most 2 blows per tethered target, 12 per cast.
- Interpretation: the note's "liquid movement tether" is read as tethering enemy *movement*: no projectiles or allies are needed; the sandbox's dummies are the puppets. Hit timing is unaffected by reduced motion (which stills the rock, turn, sway and string ripple).
