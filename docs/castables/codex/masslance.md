# Mass Lance — `codex/masslance`
Gravity · line · range 18 m · ~2.8 s on screen (travel ≈ 0.45 s at 21.6 m/s, impact 1.15 s, fade 1.25 s)

## Read in one line
A 4.8 m jousting lance of near-black lead, with a fluted shaft, guard disc, counterweight pommel and a hot leaf head, is lobbed side-on down the line. Its heavy pommel swings down, it plants butt-first at the end of the trench it tore open, and it stands at a steep diagonal, head up, sinking under its own weight.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.12 | Anticipation | The lance swells out ahead of the fist. Earth flare at the hand. |
| 0.00–0.45 | Travel | The lance flies a visible lob (1.6 m extra height at mid-flight). It is turned 1.2 rad across the line (`lanceYaw`), so from behind the caster its full length shows side-on: pommel, grip, guard disc, slender fluted shaft and a leaf head about five times as wide as the shaft. The blade's flat face stays toward the camera (no roll by default). From 55 % of the flight (`lanceTurnAt`) the counterweight swings down: the lance turns to a head-up lean, and its pivot slides from its middle to the pommel so it comes down on the line. Behind it the trench opens from 2.2 m out: ragged stone lips with a copper seam down the bed, hottest under the lance. Bodies are hit as the head of the line passes (unchanged). |
| 0.45 | Impact | The pommel drives into the trench end in 0.14 s (0.45 m under, 0.4 m slide on). A crush ring 1.35 m across heaves up round the butt, a filled crush field opens, and there is shake and flash. |
| 0.5 → 2.3 | Linger | The lance stands at 0.92 rad (about 53°) from the floor, its lean turned 0.95 rad across the line so the diagonal reads on screen. The head and its glowing edges stand high above the trench. It sinks 0.75 m over the linger while its seams cool, pulses run along the trench toward it, the lips slump, and dust slides into the trench. |
| clock 1.72 → 2.0 | Exit | The trench lips and the crush ring sink into the floor. |

## Layers
1. Lance: `MassLanceSignatureGeometry.createMassLanceLanceGeometry`. It is one mesh: a 16-sided lathe (oblate counterweight pommel, wrapped grip, vamplate flaring to radius 1, a shaft tapering from 0.3 to 0.16 with eight flutes, a socket collar) plus a four-sided leaf head flattened to a lozenge blade 0.8 wide. The material is `createMassLanceLanceMaterial`: dark lead with copper seams at the pommel, guard rim and socket, a weight pulse running pommel to point, and hot cutting edges and point on a dark head. It is oriented with a basis that keeps the blade's wide axis toward the sky, on LAYER.WORLD, and casts shadows.
2. Trench: `createMassLanceTrenchGeometry` and `createMassLanceTrenchMaterial`. It ends at the pommel.
3. Crush ring and crush field, centred on the planted pommel.
4. Template: a warm ground strip, dust falling into the trench, chips, and a reduced trail ribbon.
5. Turned down: the cream detail spheres and hero ram, the ring placements, voice, burst dome, shock ring and wake decals.

## Signature
It is heavy, and the floor shows it. The lance is thrown like a weighted javelin, the counterweight pulls it down butt-first, and it stands in the trench it tore open, buried deeper the longer you watch.

## Lance keys (editor folder "15 · The lance")
New in this pass: `lanceYaw` (side-on in flight), `lancePlantYaw` (planted lean across the line) and `lanceTurnAt` (when the counterweight swings down). Reinterpreted: `lanceStab` is now the planted lean with the head up, `lanceBury` is how deep the pommel goes under, `lanceRadius` is the vamplate radius, and `lanceLead` places the lance's middle.

## Palette
core #fff3dc · tint #c47a3e · body #3a2c22 · deep #0a0706 (stone #2b2420)

## Gameplay
Unchanged. Hits fire while travelling (WHEN `travel`) at the head of the line with `hitRadius` and the slice blow; the lance pose is presentation only. All placement derives from `this.front`, `this.length` and the lance settings each frame.
