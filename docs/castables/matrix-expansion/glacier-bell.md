# Glacier Bell — `matrix-expansion/glacier-bell`
Frost · zone · range 18 m · zone radius 4 m · ~3.0 s on screen (travel ≈ 0.4 s + 1.4 s ring + 1.2 s linger)

## Read in one line
An ice needle lobs onto the circle, a 3.6 m-wide faceted ice bell slams down out of the sky and swings, and as its frost ring spreads, a glacier of dark-blue spikes breaks the floor wherever the ring reaches.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.0–0.4 | Anticipation + travel | telegraph ring at full radius; a spinning ice needle on a high lob, tethered trail |
| landing | Impact | the bell drops 3.5 m in 0.14 s to hang 0.55 m above the floor; small frost shell, shockwave + frost decals, flash, shake |
| 0–1.4 | Ring (hits) | the frost front grows 0 → 4 m (the hit radius); deep ice floor fills exactly that radius; spikes (26, 0.6–2 m, leaning out) pop up as the front reaches each; the bell swings ±0.2 rad at 1.3 Hz across the line of sight, a pale band runs up it each half-swing, its lip quivers |
| 1.4–2.1 | Linger | swing dies away, rime crawls up the bell from the lip, spikes keep creeping up, motes drift |
| 2.1–2.6 | Exit | bell dissolves from the lip up with a white burning edge; spikes sink and crumble; floor fades |

## Layers
1. Bell — authored faceted lathe (12 sides, half-turned rings, jittered corners, 3 crystal crown prongs), bespoke lit ice shader, opaque, LAYER.SHAPED, shadows (GlacierBellBody.js)
2. Glacier spikes — instanced hexagonal ice shards, same ice shader
3. Deep ice floor — normal-blended disc, blue-black plates with pale fracture borders, at the hit radius
4. Shared engine layers: rime seal, lattice, teeth, spears + motes, small clapper bell, fragments, contacts, burst particles, release, cold-refraction warp (dual-pulse/*)

## Signature
A swinging bell of cut ice whose ring raises a glacier exactly where the frost has reached.

## Palette
core #f4feff, tint #8fdcff, body #1d63a6, deep #04122b (rime #8fbcdc)

## Gameplay
Unchanged: the frost radius grows to `zoneRadius` over `lifetime` (1.4 s) and strikes each enemy once (`impulse` 6, `lift` 3). `fadeTime` (now 1.2 s) is the linger after the last possible hit.
