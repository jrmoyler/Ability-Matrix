# Crystalline Heart — `matrix-new/crystallineheart`
Crystal · zone · range 0–14 m · zone radius 5 m · ≈ 3.8 s after the mote lands (+ travel at 18 m/s)

## Read in one line
A rose mote arcs to the circle, a 2.3 m faceted crystal heart descends into a ribcage of rose quartz that rises from the floor to cradle it, and it beats faster and faster — each beat flexing the cage, flooding it with light and growing a quartz floor — until the last beat shatters heart and cage outward.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|-------|------|------------------------------------------------|
| 0–travel | Travel | A rose mote arcs from the hand, trailing glints. |
| +0.00–0.55 | Anticipation | The heart (2.3 m across) descends from 6.5 m to float at 2.5 m; ten rose-quartz rib blades shoulder out of the floor on a 2.75 m ring (outBack) and arch inward to 3.25 m; the quartz floor starts at a quarter of its reach; a ripple decal. |
| +0.75… | Beats (impact × 4) | Lub-dub, each gap × 0.72. Each lub: heart swells 28 %, inner light punches, ribs flex outward 0.1 rad and flood with light, ribs climb a step taller, the quartz floor grows a step (to 4.75 m) and flashes, a faceted ripple ring and a screen-space shock run out, glints shower, small shake/flash. |
| +2.6 | Impact (shatter) | Final beat: heart bursts into 56 shards (0.42 m) thrown under drag and gravity; ribs blown open 0.45 rad; AIR shell, SHOCKWAVE + FROST decals, heavy shake, flash, light punch; every dummy within the zone is thrown outward. |
| +2.6–3.4 | Linger | Shards land, hop and skid; ribs keep toppling outward with fading aftershock pulses of light; the floor's seams crack open in a running wave and glow, crawling and cooling. |
| last 60 % of fade | Exit | Ribs sink back into the floor; the quartz floor burns out through noise; rings fade. |

## Layers
1. Heart — `createHeartGeometry` gem cut, dispersive refraction shader (back + front passes).
2. Ripple rings + sigil — `createHeartRingMaterial`.
3. Shockwaves — `createHeartShockMaterial` on `LAYER.DISTORTION`.
4. Glints — pooled SOFT.
5. Shatter — 72 instanced shards, `createHeartShardMaterial`; AIR burst; decals.
6. Cage — `createHeartRibGeometry` (five-sided twisted quartz blade swept along an inward arc), lit flat-shaded `createHeartRibMaterial` on `LAYER.WORLD`, casting shadows.
7. Quartz floor — `createHeartFloorMaterial`, normal-blended voronoi plates with a deep tone, beat flash and shatter cracks.

## Signature
The heartbeat drives everything: the rhythm accelerates (solved so the last beat lands at the end of `lifetime`) and every beat visibly pumps the cage, the floor and the light until it breaks.

## Palette
core #ffffff, tint #ff8cc6, body #ff7ab8 (quartz #9a2e64), deep #2a0616

## Gameplay
Unchanged: `handlesOwnHits`; the shatter throws every dummy within `killReach × zoneRadius` outward with `killImpulse`/`killLift`/`killSpin`.
