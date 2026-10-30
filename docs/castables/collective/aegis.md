# Aegis Bulwark — `collective/aegis`
Shield (force) · zone · range 0–16 m · dome r 3.2 m (sigil 3.6 m) · ≈6 s on screen (≈0.3 s travel + 4.5 s stand + 1.2 s dissolve, × `global.lifetime`)

## Read in one line
A blue anchor of light streaks out over the floor, a filled rune sigil spins up, and a hex-lattice dome of deep navy glass slams out of it, flinging everyone inside outward — then stands, its cells alive with a running radar sweep, a heartbeat band climbing the wall and ripples where it is struck, until it burns away cell by cell.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.30 | Anticipation + travel | The sigil draws itself in round the target (sweep, 0.45 s): a deep navy field (#020818 → #0b2e78) filling a 3.6 m disc, faint floor hex seams, two bounding circles with ticks, 14 hashed runes turning, a counter-rotating hexagram. The anchor races out at 30 m/s at shin height shedding motes and a wake of blue streaks. |
| 0.30 | Impact (the slam) | Dome rises floor→2.6 m in 0.32 s with a 12 % overshoot and a wobble climbing the wall; cells light floor→crown in a jittered wave; AIR shell (#9fe2ff → #1e78e6 → #06205a) to 4 m, SHOCKWAVE r 5.8 m, DUSTRING, 70 streaks shot up the wall, 36 glass shards kicked off the rim, 80 motes, light punch 18, shake 0.4, a muted blue flash (0.12). Bodies inside thrown outward from the centre. |
| 0.9–4.8 | Linger (the standing life) | Deep navy glass (bodyOpacity 0.88) with saturated blue lit cells and pale seams. The lattice slides round (0.035 turns/s); a radar arm of lit cells with a cooling tail runs round (0.42 turns/s, plus a fainter opposite arm); every 0.62 s a heartbeat band of cells climbs floor→crown, the dome swells 2.5 %, a ripple runs out across the floor field and a ring of sparks leaves the foot; random cells flare on their own clocks; stray hits ripple the dome 2.4×/s, each spitting motes and sparks; sparks skim up the wall; motes rise inside. Anything that walks in is thrown back out. |
| 4.8–6.0 | Exit | Cell-by-cell dissolve with a burning edge; the cells release motes and drop glass shards; the sigil and floor field fade with it. |

## Layers
1. Dome — `PlaneGeometry` grid wrapped in the vertex stage into an ellipsoidal cap (`createAegisDomeMaterial`): hex lattice on its own uv, forming wave, scan lines, impact ripples (6 slots), sweep / heartbeat / cell flares, fresnel, back face, soft depth fade, cell dissolve. Premultiplied over-blending: the deep body occludes, the light adds. `AegisBulwarkMaterial.js`.
2. Sigil + floor field — ground quad (`createAegisSigilMaterial`): deep filled disc, floor hex footprint, rune band, hexagram, hot foot under the wall, heartbeat ripple. Premultiplied.
3. Motes — `aegis.motes` SOFT additive, curl: rising inside, travel trail, released on dissolve.
4. Sparks — `aegis.sparks` STREAK additive, stretched: slam streaks, wall skimmers, impact spits, heartbeat ring, travel wake.
5. Shards — `aegis.shards` CHIP, lit, non-additive glass plates (#9fe6ff → #2f86e6 → #0d2f7a → #030c26): slam and dissolve.
6. Slam — AIR burst, SHOCKWAVE + DUSTRING decals, flash, shake.
7. Light — cool blue (#3a9cff) standing in the dome, humming, punched on the slam.

## Signature
A dome of dark glass whose lattice keeps working after it lands — a radar sweep and a heartbeat running through its cells.

## Palette
core #e8fbff, tint #7fd4ff, body #2a86f0 / #1450c0 → #0c3a96, deep #030c26 (floor #020818)

## Gameplay
`handlesOwnHits`: on the slam every body within `zoneRadius` is thrown outward from the centre (`hit` impulse 7.5 / lift 4.2 / spin 1.6), and while it stands (`repel`) anything that walks in is thrown out. Unchanged by the 2026 upgrade.
