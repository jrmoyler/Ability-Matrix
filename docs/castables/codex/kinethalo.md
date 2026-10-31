# Kinetic Halo — `codex/kinethalo`
Motion · zone · range 18 m · zone radius 4.7 m · ~2.8 s on screen (travel ≈ 0.25 s at 36 m/s, impact 1.25 s, fade 1.25 s)

## Read in one line
A heavy gunmetal ratchet flywheel is thrown rolling on its edge, slams flat over the targets at the size of the circle, and spins and wobbles down like a coin on a table, scraping a glowing groove and throwing sparks off at a tangent, before it lies flat, cools and sinks into the floor.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.05 | Anticipation | Hand flare and sparks. The wheel leaves the fist standing on its edge. |
| 0.00–0.25 | Travel | A 0.75 m wheel rolls on its edge from the hand down the line, spinning. The throw is eased (`wheelThrowEase` 1.8) so it shows in two or more frames. Over the last half it tips over and swells to 0.78 × the circle (≈3.7 m rim radius). |
| 0.25 | Impact | It drops 0.9 m and lands flat with a bounce: shake, flash, chips, dust roll and residue decal. Bodies are hit and carried round in orbit (template carry). |
| 0.25 → 2.0 | Linger | Euler-disk wobble: the rim tilts 0.34 rad (the high side is about 2.5 m up), and the low point rolls round the circle, faster and faster (×3.2) as the tilt dies. Friction heats only the tooth tips orange; the rest is dark sun-lit steel under a low red cast light. An additive smear trails each tooth. Under it, a filled scorched disc carries a hot groove that glows just behind the contact point and tangential score marks. Sparks fly off at a tangent from the contact point. |
| clock 1.45 → 2.0 | Exit | It slaps flat, the spin runs down to 25 %, the heat cools to dark steel, and it sinks 0.7 m into the floor. The scorch disc fades over the last 12 %. |

## Layers
1. Flywheel: `KineticHaloSignatureGeometry.createKineticHaloWheelGeometry`, an eight-face machined section swept round with 16 ratchet teeth. `writeKineticHaloWheel` rewrites it in place to its size in metres, so the rim keeps its thickness while the radius grows. The material is `createKineticHaloWheelMaterial` (patched MeshStandard, LAYER.WORLD, casts shadows).
2. Smear: an additive sheet in the wheel's plane with a comet tail behind each tooth, scaled by spin speed (`createKineticHaloSmearMaterial`).
3. Scraped floor: a filled disc (`createKineticHaloScrapeMaterial`) with scorch, score marks and the hot groove behind the contact.
4. Sparks: a STREAK particle system `kinethalo.spark`, emitted tangentially at the contact point.
5. Template: the ground field at 0.45 opacity under the scrape, plus dust, chips, motes and the aftershock.
6. Turned down: sigil body (0.05), voice, hero rig, detail pieces, burst dome, shock ring.

## Signature
The coin-on-a-table wobble. The rim's contact point runs round the circle, faster as the wheel lies down, and it is the only place sparks come from, always thrown at a tangent.

## Palette
core #ffe6d4 · tint #fa5b38 · body #3b3d44 (gunmetal) · deep #111216 (scorch #0e0302)

## Gameplay
Unchanged. All hits land on the beat (`commit`) within the circle, and the template blow and orbit carry are kept. The landed wheel radius is derived from `zoneRadius × wheelFit`, so the circle slider re-fits it mid-cast.
