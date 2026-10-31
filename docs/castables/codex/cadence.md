# Cadence Volley — `codex/cadence`
Sound · line · range 2–18 m · no zone · ≈2.9 s on screen (≈0.5 s travel at 27 m/s for a 13 m cast + 1.15 s impact + 1.25 s fade)

## Read in one line
A volley of heavy forged tuning forks, each one bigger than the last, is thrown stem-first on staggered arcs down the line. Each is driven upright into its strike point as a beat, punching a dark pan into the floor. The forks hum with their tines visibly spreading and closing, ring together once more on the downbeat, then topple over one after another and crumble.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.5 | Anticipation / travel | A hand flare. `count` (7) forks leave the fist stem first, rolling at 9 rad/s on arcs up to 2.4 m high. Each flight is solved back from its part's strike time, so the near forks land first. The forks grow from 1.4 m (first) to 2.3 m (last). |
| on each landing | Impact (×7) | The fork is driven upright 10 % into the floor at its strike point (±1.24 m across the line), tines across the line facing the caster. It rocks 0.22 rad and its yoke flashes white-hot. A dark beat pool opens under it (radius 0.5 × height) with a heaved lip and pressure waves running out. A dust ring, chips and dust puffs follow, plus shake and light scaled 0.45 → 1 along the bar. Bodies in reach are thrown along the line. |
| ≈0.5 | Impact (end) | Template end beat: shake 0.5, a 0.05 flash, a light punch, a low dust shell and the SCORCH residue. |
| 0.5–1.4 | Linger: the hum | Each planted fork rings: its two tines swing apart and together (vertex bend, 7 % of height at the tips, 30 rad/s), with a lime hum on their silhouettes, decaying at 1.5/s. Hum motes rise off the tines, and the pools keep running waves. |
| ≈0.92 | Downbeat | 0.42 s after the last fork, the whole bar rings together once more. Every yoke flashes, 10 sparks fly off each fork's tines, every pool throws a bright swell, and there is a dust ring at each, with shake 0.3, a 0.05 flash and light 7. |
| 1.9–2.9 | Exit | From 60 % of the life the forks topple sideways one after another (0.06 s apart, 0.32 s fall) to the side they lean, then crumble on noise behind a hot edge. The pools fray out from 72 %. |

## Layers
1. Forks (hero): `createTuningForkGeometry`, a tube swept along a planar path with a pointed stem, grip collars, a round yoke and two long squared tines. Instanced (max 12) on `LAYER.SHAPED`, casting shadows. `createCadenceForkMaterial` is lit dark olive steel: deep #080c04, body #323a26, rim #c4dc86. It has a brushed grain, a sun glint, tine spread in the vertex stage, a lime #a7e33b rim hum, a white-hot #f4ffe0 yoke strike and a crumble.
2. Beat pools: `createCadencePoolMaterial`, up to 12 filled dark pans in one plane over the strip, as a sun-lit heightfield. Each has a heaved lip, outward pressure waves and the downbeat swell. They fray out at the end.
3. Engine decals: DUSTRING per landing and on the downbeat, plus the template SCORCH residue and aftershock.
4. Particles: dark olive dust, lit chips, streak sparks (downbeat), hum motes.
5. World: a landing punch per fork scaled by its place in the bar, the end beat, the downbeat.

Turned off in the config: white body arches, voice, lens, template floor-grid strip, shared rig, detail pieces, ribbon, scar, wake decals, shock ring.

## Signature
A bar of music you can see: the beats land in order, each heavier than the last, and you see every fork still ringing before the downbeat.

## Palette
core #f4ffe0 · tint #c4dc86 / #a7e33b hum · body #323a26 steel · deep #080c04 (forks) / #050803 (pools)

## Gameplay
Unchanged. `handlesOwnHits`, `WHEN = 'part'`: part *i* strikes its point (`(i+0.5)/n` along the line, lane ±`sweep`) when the front passes it, and the fork's touchdown is timed to that strike. Bounded by `count` ≤ 12.
