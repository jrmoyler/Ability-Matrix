# Spore Bloom — `collective/spore`
Fungal (poison / nature) · zone · range 2–16 m · zone radius 3.4 m · ≈ 7.5 s on screen (≈0.6 s lob + 5 s bloom + 1.6 s wilt)

## Read in one line
A glowing seed pod is lobbed on a green smoke trail from the hand, splits into a ball of spore dust on the circle, a lit mycelium network races out across the floor, clumps of luminous mushrooms shoot up where it has reached, and a slow vortex of green spore cloud turns over them, eating whatever stands inside.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|---|---|---|
| 0.00–0.1 | Anticipation | Cast arm swing; the pod (0.34 m radius husk, dark #1d2416 with lime veins pulsing toward its nose) leaves the hand at 1.4 m. |
| 0.1–≈0.6 | Travel | The pod tumbles along a 2.2 m-high parabola at 14 m/s. Behind it a **camera-facing smoke trail** laid along the lob itself (whole arc back to the hand, 0.2 m half-width, swelling just behind the pod and thinning to a thread at the hand): torn noise pouring back down it, bright lime body #5cc23a, hot thread #e8ffb0 down the middle near the pod, dark deep #123a14 at the tail. Dark spore puffs and lime motes are shed along the path. |
| ≈0.6 | Impact | Pod hidden; the trail's tail retracts into the impact over 0.45 s. An EARTH ball of spore dust (2.2 m, #6cbc46 → #0c2410), a ring of 42 smoke puffs rolled outward along the floor at 3.4 m/s, 26 lit husk chips thrown up, DUSTRING + SHOCKWAVE, a thin AIR shell, shake 0.14, low flash, light punch. |
| 0.6–5.6 | Linger | The mycelium ground shader spreads from the impact at 3.2 m/s (voronoi veins, radial runners, pulses outward over a dark moss stain). 7 clumps × 5 lathe mushrooms erupt where the network has reached (stem shoots, cap opens past full and settles, sway). From 0.25 s after landing the **standing cloud** turns: 90 puffs/s born in a 1 m band over the circle, carried round it at 1.1 m/s and drawn inward (#c8f47e → #6cbc46 → #2c6428 → #0c2410), so the cloud visibly drifts and churns. Caps puff smoke and motes on their own rhythm. Bodies in the cloud are stained, drop after 0.9 s exposure, then rot. |
| 5.6–7.2 | Exit | Staggered wilt: cap rims fall, stems bow and sink 0.6 m, veins dim, cloud thins. |

## Layers
1. Pod — sphere carrier + `createSporePodMaterial` (ridged veins, pulse, fresnel), LAYER.WORLD, shadow.
2. Trail — `createSporeTrailGeometry` strip + `createSporeTrailMaterial` (camera-facing in the vertex stage, scrolling noise, 3-stop ramp + HDR thread), rewritten every frame from the lob parabola.
3. Mycelium — `createSporeGroundMaterial` plane, sized from `zoneRadius`.
4. Mushrooms — instanced unit lathe (`createMushroomGeometry`) built in `createSporeMushroomMaterial`'s vertex stage, lit, SHAPED layer with matching depth material.
5. Particles — puff smoke (SMOKE, normal), motes (SOFT additive, curl), standing cloud (SMOKE, low drag, vortex emission), husk (CHIP, lit).
6. Landing — EARTH + AIR bursts, DUSTRING, SHOCKWAVE, flash, shake, breathing light.

## Signature
The bloom spreads as one organism: the network grows out of the landing and the mushrooms come up only where it has reached, under a cloud that turns.

## Palette
core #f4ffd0, tint #c8f47e, body #5cc23a / #6cbc46, deep #0c2410 (moss #0a120c)

## Gameplay
Unchanged: `handlesOwnHits`; bodies within `zoneRadius × cloudReach` once the first cap has puffed are corroded, dropped after `killTime` s of exposure and consumed. The trail, the vortex cloud and the landing burst are presentation only (the vortex does not drive `_cloud`, which still gates the hits).
