# Umbra Grasp — `matrix-new/umbra`
Shadow · zone · range 14 m · zone radius 2.2 m · ~4 s on screen

## Read in one line
A puddle of dark races out from the caster's hand and opens into a ragged, violet-rimmed pool of ink. A black clawed hand about 3.4 m tall rises out of it behind the target and closes on everything in the circle. Then ink surges up each body's legs and the hand drags them under.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.3 | Anticipation | Violet burst at the caster's hand. |
| 0.3–0.6 | Travel | A dark puddle (0.45 m) races along the floor shedding dark smoke and violet motes. |
| ~0.6 | Impact | Ripple decal and a knock. The pool spreads over 0.45 s to 2.6 m, with tendrils writhing past its edge. |
| +0.25–0.8 | Rise | The hand (`handScale` 1.6) surges up behind the body it chose, fingers raised in a claw, and stands ~3.4 m. It is near-black smoke (`handErode` 0.28) with a thin violet rim and few embers. |
| +1.0–1.3 | Grip | The fingers flex open, then shut. The pressure shell, shockwave, flash and light punch fire, and violet streaks rush in. Everything in the circle is seized and folded into the fist. |
| +1.4–2.3 | Drag-under | The hand sinks into the pool. Each held body gets an **ink sleeve**: a flared, ragged collar of ink (0.42 m throat, base flaring ×2.4) that surges up its legs in 0.22 s to ≤1.6 m, pours downward and follows the body under. The body sinks visibly into it and the floor opens beneath. The sleeve closes over the spot. |
| +2.4–3.6 | Exit | The hand burns to smoke along a violet edge, the tendrils withdraw, the pool drains inward and leaves a dark SCORCH stain for 6 s. |

## Layers
1. Pool: ground-quad SDF ink shader, with swirl, veins, rim, tendrils and a hole.
2. Hand: 20 instanced capsule bones (`UmbraGraspGeometry`) with an opaque eroded smoke core shader.
3. Haze shell: the same bones, inflated, as soft dark alpha smoke.
4. Ink sleeves (new): `createUmbraSleeveGeometry` (instanced open tube, shaped in the vertex stage from `aSleeve`) with `createUmbraSleeveMaterial`. Opaque ink, flow pouring down it, violet rim and ragged glowing lip. Presentation only.
5. Particles: dark SMOKE (non-additive), SOFT violet motes, STREAKs into the fist.
6. Sinking warp on `LAYER.DISTORTION`. Beats: ripple, AIR shell, SHOCKWAVE, flash, shake, rumble, SCORCH stain.

## Signature
A black hand bigger than its victim. It closes, then the ink climbs the body and pulls it into the floor.

## Palette
core #f2e2ff (motes) · tint #b37dff · body #6a30c0 / rim #9b5cff · deep #030106 / #0e0519

## Gameplay
Unchanged. Seizure happens when the fist is 85 % shut, takes every body within `zoneRadius × grabReach`, then carries, sinks and consumes them. The sleeves read held bodies' positions and never write to them. The only side effect of the larger hand is that the fist starts higher and ends deeper. Held corpses therefore travel a little further, and they are consumed about 0.03 s earlier in the drag. Who is hit, and when, is unchanged.
