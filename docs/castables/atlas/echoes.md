# Hall of Echoes — `atlas/echoes`
Illusion · zone · range 0–16 m (capture ≈ 11.2 m) · zone radius 3.2 m · ≈ 4.2 s on screen (0.4 travel + 2.2 hall + 1.5 shards)

## Read in one line
A projector circle on black glass unfurls, a horseshoe of tall arched mirror panes comes up out of the floor round its far side, three 2.6 m holograms of you print in orbit, swap through the middle, the panes craze — and everything shatters into killing mirror while the floor cracks.

## Beats
| t (s) | Beat | On screen |
|-------|------|-----------|
| 0.00–0.40 | Anticipation + travel | Violet glow at the hand; a thread of pixels runs to the zone at 28 m/s. |
| 0.40 | Impact | SHOCKWAVE (#ef9dff), shake; black-glass disc (#0c0618, sky-mirroring) and dais unfurl over 0.4 s. |
| 0.45–1.2 | Hall rises | 7 round-arched mirror panes (1.3 × 3.3 m, bevelled, metal, lit, shadow-casting) rise sweep-ordered from the back across 3.9 rad of the far side (outBack overshoot); the three copies print slice by slice (0.55 s each, staggered 0.14 s) at 1.45× size under projector beams. |
| 1.35–2.1 | Linger / swap | Copies orbit (0.55 rad/s), then cross the middle bowed past each other (0.6 s, glitch spike); panes sway; silvered rims and scanlines live. |
| 2.0–2.45 | Craze | Pane cracks (voronoi seams) light up, panes shake; copies tear (pre-shatter glitch). |
| 2.45–2.65 | Break | Each copy shatters into 36 faceted mirror shards (lethal), panes burst into 8 cosmetic shards each and sink; AIR shell, SHOCKWAVE 1.6 R, flash 0.3, cracked-lens warp; floor cracks run out from the centre. |
| 2.65–4.2 | Exit | Shards tumble, skitter, fade; cracks cool; the black glass fades last. |

## Layers
1. Holograms — caster clones (`CasterDouble`), `createEchoHoloMaterial`.
2. Hall panes (hero) — `createHallPanelGeometry` + `createEchoPanelMaterial` (MeshStandard metal mirror, LAYER.WORLD, patched rim/scan/cracks).
3. Black glass floor — `createEchoFloorMaterial` (deep tone, sky reflection, cracks).
4. Dais — `createEchoDaisMaterial`.
5. Projector beams.
6. Mirror shards (instanced, env-reflecting).
7. Pixels (SOFT) + glitter (STREAK).
8. Cracked lens (LAYER.DISTORTION), AIR burst, decals.

## Signature
A real hall of mirrors, opened toward you like a stage, that breaks with the illusion.

## Palette
core #ffffff, tint #ffd2ff, body #ef9dff, deep #0c0618

## Gameplay
`handlesOwnHits`: only copy shards kill (younger than 0.9 s, below head height); pane shards are cosmetic. Unchanged.

## What the capture shows (after)
`sheets/atlas__echoes-sheet.jpg`: f20 back panes rising over the violet dais; f40/f70 full horseshoe of glowing arched panes with three copies inside; f90 mirror shards sprayed across the zone, panes sinking, floor cracked. Short: panes read more as glowing arches than as reflective mirror at 8 m.
