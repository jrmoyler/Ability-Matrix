# Doppel Lance — `codex/doppel`
Illusion · line · range 2–18 m · no zone · ≈2.8 s on screen (≈0.4 s travel at 32.4 m/s + 1.15 s impact + 1.25 s fade)

## Read in one line
A flickering glamour image of a drilling lance flies late down the aim line. A body-width to the side, the real lance cuts unseen, shown only as a haze rim. On the beat the image shatters into panes, and the real lance burns into view from the tip back: near-black crystal-steel with magenta only on its flute edges, slammed steeply into the floor beside the line and drilling itself down until it is eaten into glamour motes.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.4 | Anticipation / travel | The decoy, a 4.6 m drill-lance image (dark plum #3a0826 body, hot pink #ff6cb8 edge, crawling scanlines, slices stuttering sideways), flies down the aim at 1.35 m, drilling at 26 rad/s and running late (u^1.6). Both lances fly crabbed 0.8 rad across the line (the decoy one way, the real one the other) and dip 0.4 rad, so their length reads from behind the caster. On the hit offset (`thickness × 4` = 1.12 m to the side) the real lance flies at the head as a rim of heat haze only (45 %). Bodies on that offset fall as it passes. The template scar is left down the cut. |
| ≈0.4 | Impact | The decoy shatters where the line ends into 22 tumbling panes (0.4–1.2 m), thrown 4.2 m/s out and 3.2 m/s up. The real lance burns into view from the tip back in 0.14 s behind a white-hot front, and in 0.16 s (outBack) is slammed down from its flying line to 0.95 rad, leaning back and out to the side. The tip is buried 0.55 m. A cracked floor (r 1.6 m), a dust ring, 24 chips and 14 puffs follow, with shake 0.3 and light 8, plus the template beat. |
| 0.6–1.9 | Linger | The lance drills: it spins at 14 rad/s, slowing at 1.4/s, and sinks a further 0.7 m down its own axis. Chips and sparks spray off the floor at its foot as the spin slows, and the flute ridges and hot tip pulse. The panes land and lie flat, flickering, and wink out one by one over 0.9–1.5 s. |
| 1.95–2.8 | Exit | From 62 % of the life the lance is eaten from the butt to the tip behind a hot bite edge, shedding glamour motes. The crack and residue stay. |

## Layers
1. Real lance (hero): `createDrillLanceGeometry`, a loft with a three-fluted blade twisted 2.5 turns, a guard, a wrapped grip and a pommel. It is on `LAYER.WORLD` and casts shadows. `createDoppelRealLanceMaterial` is lit near-black crystal-steel: deep #060208, body #231020, flute edge #e0408e, white-hot #fff0f8 (the burning-in front). It has a glint, glowing flute ridges, a tip-first reveal and a butt-first dissolve.
2. Decoy and cloak: the same geometry, instanced ×2, with `createDoppelGhostMaterial` (scanlines, slice stutter, pink edge; mode 1 is rim-only haze).
3. Panes: `createDecoyShardGeometry`, instanced (max 32) with the ghost material. Their ballistic fall is solved per pane from its dice.
4. Floor: the template scar down the cut (darkened), a CRACK and DUSTRING where the lance is driven in, and the SCORCH residue.
5. Particles: lit chips and sparks off the drill, glamour motes off the dissolve, dust.
6. World: the template beat plus the plant punch.

Turned off in the config: pink fan body, voice, lens, template ground field, ribbon, shared rig, detail pieces, shock ring.

## Signature
The lance you watched was never there: it breaks into panes, and the real one is already standing in the floor a body-width to the side.

## Palette
core #fff0f8 · tint #e0408e (flute edges) · body #231020 · deep #060208

## Gameplay
Unchanged. `handlesOwnHits`, `WHEN = 'travel'`: the cut is gathered every travel frame at the head plus `thickness × 4` to the side, within max(0.35, hitRadius), and thrown along the line (`slice`). The reveal, the drill and the panes are presentation only.
