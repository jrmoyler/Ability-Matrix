# Faultwake Bastion — `matrix-expansion/faultwake-bastion`
Earth · line · range 2–18 m · strip half-width 1.5 m · ~3.5 s on screen (travel ≈ L/14 s + 0.45 s eruption + 2.3 s stand/fold)

## Read in one line
A molten fault splits the floor from the caster's feet, and a zigzag chain of splayed basalt slabs heaves up on either side of it, climbing toward the target, shuddering under rolling aftershocks before it folds back into the scar.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|---|---|---|
| 0.00–0.1 | Anticipation | dust ring at the caster's feet; a pulsing ember seam runs 2.5 m ahead of the front |
| 0.0–~0.7 | Travel | the white-hot slit (0.17 m core, ember lips) opens behind a 14 m/s front; the first 2.6 m stay open fissure so the caster stays visible, then slabs break the floor alternately ±0.95 m left/right of the fault: spire, fin, block in turn, each splayed 0.2–0.5 rad outward, heights climbing from 0.45× to 2.7 m at the far end; each throws three boulders, dust, chips and burns a 1.5 m scorch round its foot |
| end of travel | Impact | the terminal (tallest) slab; shock disc 2.6 m, CRACK + DUSTRING decals, 40 chips, 34 dust puffs, flash, shake, light punch (no dust dome) |
| +0.0–~1.6 | Linger | aftershock waves roll down the chain every 0.62 s at 11 m/s: each slab jolts up 9 %, rocks, flares its veins and sheds grit; slabs keep grinding up 12 %; veins seal from orange to dark basalt; embers rise off the fissure, heat veil shimmers |
| last ~1.0 | Exit | far end first, slabs sink under the floor and crumble with a burning edge; the fissure cools to a dark scar and erodes |

## Layers
1. Slabs — instanced hexagonal basalt prism (authored, jointed, slanted crown), per-instance non-uniform scale for spire / fin / block silhouettes, `createRockMaterial` (lit, opaque, LAYER.WORLD, shadows, magma veins via `aHeat`), FaultwakeBastion.js
2. Rubble — instanced lumpy boulders, same rock shader
3. Fissure — ground strip shader: white-hot core, ember lips, branch cracks, scorched scar, telegraph seam; heat veil on LAYER.DISTORTION
4. Per-slab SCORCH decals (dark char + ember glints) that last the whole linger
5. Debris points (96, GPU ballistic), pooled SMOKE dust, lit CHIP chips, additive SOFT embers
6. Terminal shock disc, decals, flash, shake, light

## Signature
A V-shaped wake of splayed slabs that climbs away from the caster and keeps shuddering as aftershocks roll down it.

## Palette
core #ffd28a / #ffc27a, tint #ff5a14, body #6e4a31, deep #22150d / scar #140c08

## Gameplay
Unchanged: each body within `reach` (1.3 m) of the swept front is thrown once along the line (`impulse` 5, `lift` 2.2, `hitSpin` 0.6). Slabs are dressing only; travel speed and hit sweep are untouched.
