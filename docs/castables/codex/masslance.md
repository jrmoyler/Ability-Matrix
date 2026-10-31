# Mass Lance — `codex/masslance`
Gravity · line · range 18 m · ~2.8 s on screen (travel ≈ 0.45 s at 21.6 m/s, impact 1.15 s, fade 1.25 s)

## Read in one line
A 4.2 m forged lance of near-black lead rides down the line nose-first and drags a torn trench open behind it. At the end it stabs into the floor and keeps sinking under its own weight.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.12 | Anticipation | The lance swells out at the fist, tail first. Earth flare at the hand. |
| 0.00–0.45 | Travel | The lance (radius 0.5 m, eight-sided) flies a shallow lob (1.5 m extra height at mid-flight) 0.6 m ahead of the head, rolling slowly. Its pitch follows the arc: nose up as it leaves the hand, dipping as it comes down, so its length shows from behind the caster. Copper seams pulse from tail to nose, and the nose is hot. Behind it the trench opens from 2.2 m out: two ragged stone lips 0.2 m tall, 1.7 m apart, with a copper seam down the bed that is hottest under the lance and cools over 4.5 m. Bodies are hit as the head passes. |
| 0.45 | Impact | The lance drives nose-down into the floor in 0.14 s (stab 0.8 rad, nose 0.55 m under), sliding 0.6 m on. A crush ring of stone 1.35 m in radius heaves up with hot inner cracks, a filled crush field 2.6 m across opens, and there is shake and flash. The white crack and dust-ring decals are off (`shockRadius` and `aftershockRadius` are 0). |
| 0.5 → 2.3 | Linger | The lance stands at about 45° with its tail 2+ m up and keeps sinking (0.9 m over the linger) while its seams cool. Pulses run along the trench bed toward it, the lips slump to 60 %, dust slides down the trench walls, and the crush field's striations are dragged inward to a dark heart. |
| clock 1.72 → 2.0 | Exit | The trench lips and the crush ring sink into the floor, and the lance is mostly buried. |

## Layers
1. Lance: `MassLanceSignatureGeometry.createMassLanceLanceGeometry` (lathe spindle with collar and band) and `createMassLanceLanceMaterial` (patched MeshStandard, flat-shaded lead, emissive seams, pulse and nose). It is on LAYER.WORLD and casts shadows.
2. Trench: `createMassLanceTrenchGeometry` (real lofted geometry with ragged lips, scaled to the distance covered) and `createMassLanceTrenchMaterial` (stone with a bed seam that cools with metres back and pulses).
3. Crush ring: `createMassLanceCollarGeometry` and `createMassLanceCollarMaterial`.
4. Crush field: a filled disc (`createMassLanceCrushMaterial`) with inward striations.
5. Template: a warm ground strip under the line, dust (gravity −1.4) falling into the trench, chips, and a reduced trail ribbon.
6. Turned down: the cream detail spheres and hero ram, the ring placements (body 0), voice, burst dome, shock ring, wake decals.

## Signature
It is heavy, and the floor shows it: a trench torn open behind the lance, and the lance itself buried deeper the longer you watch.

## Palette
core #fff3dc · tint #c47a3e · body #3a2c22 · deep #0a0706 (stone #2b2420)

## Gameplay
Unchanged. Hits fire while travelling (WHEN `travel`) at the head with `hitRadius` and the slice blow. All placement derives from `this.front`, `this.length` and the lance settings each frame.
