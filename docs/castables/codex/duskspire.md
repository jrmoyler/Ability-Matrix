# Dusk Spire — `codex/duskspire`
Shadow · zone · range 2–18 m · circle 4.45 m · ≈2.9 s on screen (≈0.5 s travel at 24 m/s for a 12 m cast + 1.15 impact + 1.25 fade)

## Read in one line
A shadow crawls along the floor from the hand into a dark pool; on the beat a ring of seven lit obsidian columns erupts round the circle and a needle spire drives up in the middle; the columns lean in and sink as their violet light drains down into the floor and up the spire, which grows; then the stone sinks back into the floor.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.50 | Anticipation / travel | Hand flare and sparks. A 2.2 m dark runner (near-black, violet edges, streaks running forward) surfaces 1.6 m past the hand and crawls to the circle with dark smoke and violet sparks churning at its head. Ahead of it the pool opens to 30 % and the column tips (18 %) break the floor. |
| ≈0.50 | Impact | Seven faceted obsidian columns (2.7 m ± 35 %, ≈1 m thick) erupt round the circle at 0.78 R in 0.22 s (outBack, 0.03 s stagger), kicking 0.18 rad outward; each cracks the floor and throws 10 lit chips. The 3.8 m spire drives up through the pool in 0.35 s. Shake 0.44, light punch, flash 0.04. The runner is drawn into the circle over 0.35 s. |
| 0.5–2.2 | Linger — the drink | Over 1.7 s the columns lean 0.5 rad in toward the spire and lose 35 % of their height while their light drains from the tip down (a bright fill line moving down each column); the spire grows from 70 % to full and fills with light from its foot up; vein networks crawl up the stone. The pool's log-spiral filaments crawl inward and its edge contracts to 45 % R. Motes stream from the column tips into the needle (120/s). Bodies are dragged inward (template carry). |
| 2.1–2.9 | Exit | From fade 1.45 the stone sinks into the floor (inCubic) and the pool breaks up from the rim; the residue stain and column cracks stay 4.5 s. |

## Layers
1. Columns — `createDuskSpireColumnGeometry` (`assets/codex/DuskSpireSignatureGeometry.js`: five-sided jittered lathe, broken off-centre shard tip, chipped shoulder, `aHeat` seams), InstancedMesh ≤12, `createDuskSpireStoneMaterial` (MeshStandard obsidian #15101f patched: seam + vein glow below a moving fill level, four-stop ramp, violet fresnel), `LAYER.WORLD`, shadows.
2. Spire — `createDuskSpireSpireGeometry` (seven-sided twisted needle, three thorns, five buttress roots), same stone material, own fill level.
3. Pool — `createDuskSpireFloorMaterial(0)`: filled near-black disc, inward-crawling log-spiral filaments, hot lip, contracts and erodes.
4. Runner — `createDuskSpireFloorMaterial(1)`: dark tongue along the line from hand to circle.
5. Decals — CRACK at each column foot, template SCORCH residue and telegraph (embers darkened), faint shock ring, aftershock dust ring.
6. Particles — lit CHIP stone, SMOKE dust (runner head, beat), additive streak motes drawn into the spire.
7. World — shake, light punch, aftershock thud.
Off by default (sliders kept): template body, lens, voice, field, pieces, rig.

## Signature
The drink: light visibly runs out of the ring of columns (tip down) and up the spire (foot up) while the columns bow inward and the pool spirals in.

## Palette
core #ffffff, tint #b7a6ff, body #5e40dd, deep #0d0821 / stone #15101f / void #050309

## Gameplay
Unchanged: `handlesOwnHits`, commit hit on the beat within max(zoneRadius, hitRadius), blow `in`, carry `in`, shroud mark.
