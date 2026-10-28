# Countermand Sigil — `matrix-expansion/countermand-sigil`
Arcane · zone · range 2–16 m · zone radius 3.6 m · about 3.2 s on screen

## Read in one line
A standing seal of black arcane glass is thrown into the circle, serves every
enemy inside a silver writ, answers any other spell cast into it, then drives
its veto bar through and nails every writ into the floor.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|---|---|---|
| 0.00–0.22 | Anticipation | A small obsidian seal forms at the hand; violet motes gather; the target floor scorches faintly. |
| 0.22–~0.6 | Travel | The seal flips like a coin on an arc, shedding violet streaks. |
| ~0.6 | Impact (the plant) | It lands edge-on and unfolds with overshoot (0.32 s) into a 4.3 m standing ring that bites a slot into the floor: crack, dust ring, sparks, obsidian chips, camera knock. Up to 7 enemies (nearest first) each get a silver rune-nail writ hanging point-down over them, with a reticle burnt beneath. |
| ~0.6–1.65 | Linger (the watch) | The seal turns to face each marked body in turn; the outer ring wheels while the silver glyph ring counter-turns; sixteen glyph cells light clockwise from twelve (the countdown); the veto bar hangs on the diagonal; motes stream up into the eye; the air pulls inward. A foreign spell landing inside is countermanded: the seal flares, adds a writ over the spot, and the verdict comes sooner and harder. |
| ~1.65 | Impact (the verdict) | The seal squares to the caster, the eye pinches shut, the veto bar drives through the ring (0.16 s), every writ drives into the floor through its target: bodies thrown away from the seal, storm shell, shockwave, scorch, arc burns, flash and light punch. |
| ~1.65–2.6 | Linger II | The struck-through seal recoils and sinks back into its slot; embedded writs shatter to chips; floor seams flare and cool. |
| ~2.6–3.2 | Exit | Everything dissolves through noise with a burning lip; the scorch outlives the cast. |

## Layers
1. **The seal** — extruded crenellated ring with four clasps and a silver glyph ring with runes cut through (`createSealGeometry`, `createGlyphRingGeometry`); lit, shadow-casting engraved glass (`createEngravedMaterial`, patched `MeshStandardMaterial`) on `LAYER.WORLD`.
2. **The veto bar** — chisel-ended extruded blade in the same glass with a racing chevron channel.
3. **The iris / eye** — pupil that leads the seal's turn and pinches shut at the verdict.
4. **Writs** — silver rune-nails, lit, one per mark (max 16 hits with countermand splash).
5. **Floor** — the planting slot, reticles under each writ, scorch and seams that cool.
6. **Particles** — violet motes (A–D ramp), obsidian chips, streak sparks.
7. **Impact & verdict** — storm shell, crack / shockwave / scorch / arc decals, flash, shake, light punch.
8. **Distortion** — the inward pull through the ring during the watch.

## Signature
A construct, not a drawing: the sigil stands up, watches, and *strikes its own order through* with a physical veto bar. The glyph countdown written on the seal is the timer the player reads.

## Palette
core #fff2fd, tint #f6a6ff, body #a33cff, deep #1a0630 · obsidian #1d0b2a · silver #b9a7d9

## Gameplay
Planting marks up to `maxMarks` (7) enemies in the zone, nearest first. Any other spell that lands inside during the watch is countermanded (extra writ, verdict sooner and harder). At the verdict each writ deals `verdictDamage` once through the expansion combat binding (or `dummy.kill` standalone), thrown away from the seal. Hits are bounded (≤ 16 per cast).
