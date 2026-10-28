# Blink Step — `collective/blink`
Movement (light / space) · line · range 3–18 m (capture ≈ 13.5 m) · no zone · ≈ 3.0 s on screen (0.5 s transit + 1.7 s arrival/linger + 0.8 s exit)

## Read in one line
The air tears open where the caster stands and swallows them, a white streak burns a slipstream scar down the floor, a second tear splits at the far end and spits them back out — and both tears seal slowly while light drains down the cooling scar.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|---|---|---|
| 0.00–0.16 | Anticipation | 90 cyan streaks implode onto the body from a 1.8 m shell; a 14-shard crown closes on it; the body squeezes to a sliver (0.08 × 1.35). A **2.5 m jagged tear splits open** where they stand (outBack): black-teal void, white-hot lip, slipstream streaks racing up through it. Screen pinch. The departure scorch spreads (1.5 m), combed forward. |
| 0.12–0.6 | Travel | The body is gone; the crown bursts outward. A white-headed streak (0.16 m, 9 m tail, spiralling filaments) runs the line at 28 m/s, shedding sparks and flickering afterimages every 2.2 m. Behind it the **floor scar is written**: a 1.3 m burnt lane with a hot seam and dashed skid lanes, white just behind the head, cooling to teal and deep behind. 0.12 s before landing the **arrival tear splits** 0.3 m short of the end. |
| ≈0.6 | Impact | The body is moved to the end and reforms out of the tear with an overshoot; 14 shards fan out along the floor to 2.6 m; a low squashed AIR shell, SHOCKWAVE + DUSTRING, two SCORCH decals (both ends, 5 s), sparks, motes, screen bulge, light punch, shake, flash. The landing crater (2.4 m) spreads with 22 skid spokes and a splash ring. |
| 0.6–2.3 | Linger | An **echo** of the caster stands in front of the sealing departure tear for 1.9 s, dissolving edge-first. Both tears gape (quivering) then **seal** in-out back to a hairline over 1 s while cracks crawl 1.1 m out through the air round them. The planted shard ring stands round the crater with a pulse running round it (1.6 Hz), then sinks into the floor. Knots of light keep **draining down the seam** toward the landing at 9 m/s as the scar cools along the ramp (1.6 s); residue motes rise off both ends. |
| 2.3–3.1 | Exit | The tears' hairlines fade; the scar dissolves through noise with a hot edge; the SCORCH decals outlast it. |

## Layers
1. The rifts (hero) — `createRiftGeometry` (`assets/collective/BlinkStepGeometry.js`, parameter grid `(v,u)`) placed in the vertex stage by `createBlinkRiftMaterial`: pointed almond lens, noise-jagged lips, belly bulge 0.22 m, crack halo 1.1 m; normal-blended void + HDR lip + ridged-noise cracks. 2.5 × 1.15 m. Two instances (departure, arrival).
2. The scar (floor) — `createScarGeometry` laid down the line by `createBlinkScarMaterial`: burnt lane, seam, skid lanes, departure scorch, landing crater with spokes, draining pulses, dissolve.
3. The streak — `createBlinkTrailMaterial` on a bolt-ribbon ladder.
4. Afterimages + the echo — `createBlinkGhostMaterial` SDF billboards (16 max).
5. Shard crowns — `createBlinkShardMaterial` on crystal prisms (24 per crown); arrival crown plants, hums and sinks.
6. Particles — implosion (STREAK), sparks (STREAK), motes/residue (SOFT, curl).
7. Impact — AIR shell, SHOCKWAVE, DUSTRING, 2× SCORCH, flash, shake, light punch.
8. Distortion — pinch on departure, bulge on arrival (`createBlinkWarpMaterial`, LAYER.DISTORTION).

## Signature
Two tears in the air joined by a burnt slipstream: you are swallowed by one and spat out of the other, and both heal slowly behind you.

## Palette
core #ffffff, tint #b4fff0, body #2fd8c8, deep #06202e

## Gameplay
Unchanged: default line capsule hits (`DummyField`) along the dash. The caster is moved on impact (x/z only) by the safe take/hide/move/restore pattern; every exit path (arrival, clear, retire, a second blink) hands the body back at full scale and visible; a blink cleared mid-transit leaves the caster where it started.
