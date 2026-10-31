# Filament Volley — `codex/filament`
Light · line · range 2–18 m · 8 bolts across a 3.6 m lane fan · ≈2.8 s on screen (≈0.3 s volley + 1.25 s impact + 1.25 s fade)

## Read in one line
A volley of braided golden filaments hops in arcs from the hand, from landing to landing, across the line. Each bolt drives a gilt barb into the floor where it lands. Together the arcs and a taut floor seam stitch the path shut. The stitch cinches tight and twangs, light runs down it again and again, and then it unravels from the hand end while the barbs sink.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.3 | Anticipation / travel | The hand flare and sparks. Bolt i is drawn as a braid of 3 strands (0.05 m each, braid radius 0.1 m) on a parabolic arc, 0.55 m + 0.4 m per metre of span high. It starts from the previous barb's head (bolt 0 from the hand) and has a white-hot head that sheds sparks. It lands on `_partPoint(i)` at the moment its part hit lands. |
| per landing | Impact (×8) | A 1.5 m gilt barb is driven in from 1.4 m up in 0.08 s, leaning 0.38 rad back along its arc, with 30% buried and a wide crossguard. It brings a scorch (0.7 m), a spray of sparks and chips, a tick of shake and light, and white-hot heat down its head. A seam thread is pulled along the floor from the previous barb. |
| ≈0.3 | Beat | The template beat (shake, flash, light, residue). |
| 0.3–1.5 | Linger | Over 0.45 s the arcs cinch to half height and twang sideways (24 rad/s, decaying). A current runs down the stitch chain at 7 stitches/s, again and again, throwing motes off the barbs. The barbs cool from amber heat to gilt with dark bronze grooves. |
| 1.5–2.8 | Exit | From 1.2 s after the beat the stitches unravel one by one from the hand end, each burning away from its start over 0.4 s. Its barb then sinks into the floor. Scorches and the floor scar stay. |

## Layers
1. Filaments (hero): a `PlaneGeometry` grid carrier laid along an arc in the vertex stage (`createFilamentVolleyFilamentMaterial`). Instanced: 3 braided strands per bolt plus a floor seam per stitch. Four stops across the strand: deep #3d2200 at the silhouette → body #ffb40f → tint #fff1a8 → core white (HDR). It has a bolt head, a burning unravel edge and a running current.
2. Barbs: `createBarbGeometry` (diamond shaft, crossguard, head), instanced on `LAYER.SHAPED` with shadows. `createFilamentVolleyBarbMaterial` gives lit gilt #d4a017 with bronze #2e1d04 engraved grooves, a sun glint, sky reflection and cooling heat #ff9a1a.
3. Floor: the template scar along the lanes, per-barb scorches, wake scorches and the residue decal. The ground field is turned down to 0.22.
4. Particles: head sparks, landing sparks and chips, current motes, and the template shed.
5. World: per-landing shake and light, plus the beat.

Turned down in the config: body sheet, voice, shared rig, detail pieces, lens, and the template trail ribbon (it arched the whole line into the white "picket curtain" over the caster).

## Signature
Light that sews: bolts hop barb to barb and the stitch pulls tight.

## Palette
core #ffffff · tint #fff1a8 · body #ffb40f / gilt #d4a017 · deep #3d2200 / bronze #2e1d04

## Gameplay
Unchanged. Hits are per part (`WHEN = 'part'`), each when the head passes its point. The barbs are planted from the same strike call, so they land where the hits land.
