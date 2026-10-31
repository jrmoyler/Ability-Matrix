# Miasma Spit — `codex/miasma`
Poison · line (lobbed) · range 17 m · pool 2.6 m · ~4.6 s total

## Read in one line
A dark, murky glob of bile arcs from the hand, splashes into a tall sludge crown and leaves a near-black bubbling pool that boils off thick dark-green plumes of reek.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.22 | Anticipation | Glob swells at the hand, motes drawn in. |
| 0.22–0.9 | Travel | 0.34 m glob, deep bile swirled through saturated green, arcs 2.4 m high, sheds hissing drips, trailing blobs. |
| ~0.9 | Impact | 2.0 m crown of fingers (deep-to-body shaded sheet), drops thrown off, WATER shell, shockwave, flash, shake; splash catch. |
| 0.9–3.5 | Linger | Crown stands 1.3 s and tears; pool spreads to 2.6 m: near-black middle, olive edge, bubble domes popping, lime seam where it eats the floor; plumes of dark fume every ~0.32 s; bodies melt into it. |
| 3.5–4.6 | Exit | Pool evaporates from the thin edge inward, stain lingers then fades. |

## Layers
1. Glob + trailing blobs (`createBileGlobMaterial`).
2. Sludge pool floor shader (`createSludgePoolMaterial`).
3. Spatter / hiss marks.
4. Splash crown (`createSplashCrownMaterial`, now lit deep→body).
5. Particles — fumes and plumes (SMOKE, normal), bubbles, motes, drips.
6. Fume warp on LAYER.DISTORTION.

## Signature
A lobbed gob of sludge and a pool that eats bodies.

## Palette
core #a6f03a (thin seam, pops), tint #d4f590, body #4f9a14 (pool #22400a), deep #0b1a03 (pool #050c01 — the dark sludge middle); fumes #4a5e22 → #101408

## Gameplay
Splash catch in `splashRadius`, pool melt grips. Unchanged.
